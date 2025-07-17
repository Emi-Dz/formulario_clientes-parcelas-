

import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { SaleData } from './types';
import * as n8nService from './services/n8nService';
import * as clientStore from './services/clientStore';
import { HomePage } from './pages/HomePage';
import { ClientListPage } from './pages/ClientListPage';
import { ClientFormPage } from './pages/ClientFormPage';
import { useLanguage } from './context/LanguageContext';
import { LoginPage } from './pages/LoginPage';
import { generateExcel } from './services/excelGenerator';

type View = 'home' | 'list' | 'form';

const CORRECT_PASSWORD = 'Lilo0608';
const AUTH_KEY = 'client-app-auth';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => sessionStorage.getItem(AUTH_KEY) === 'true');
    const [isLoginVisible, setIsLoginVisible] = useState<boolean>(false);
    const [view, setView] = useState<View>('home');
    const [clients, setClients] = useState<SaleData[]>([]);
    const [isFetchingClients, setIsFetchingClients] = useState<boolean>(false);
    const [editingClientId, setEditingClientId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { t } = useLanguage();

    // --- State for async actions on list items ---
    const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [isGeneratingSummaryId, setIsGeneratingSummaryId] = useState<string | null>(null);


    const fetchClients = useCallback(async () => {
        setIsFetchingClients(true);
        try {
            const fetchedClients = await n8nService.fetchClientsFromN8n();
            setClients(fetchedClients);
            clientStore.setClients(fetchedClients);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('errorUnknown');
            showError(`${t('errorFetchClients')}: ${errorMessage}`);
            setClients([]);
            clientStore.setClients([]);
        } finally {
            setIsFetchingClients(false);
        }
    }, [t]);
    
    const handleGoHome = () => {
        setView('home');
        setIsLoginVisible(false); // Hide login page if user navigates home
    };

    const handleGoToList = () => {
        if (isAuthenticated) {
            setView('list');
            fetchClients();
        } else {
            setIsLoginVisible(true);
        }
    };
    
    const handleGoToNewForm = () => {
        setEditingClientId(null);
        setView('form');
    };

    const handleGoToEditForm = (id: string) => {
        setEditingClientId(id);
        setView('form');
    };
    
    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    const showError = (message: string) => {
        setError(message);
        setTimeout(() => setError(null), 8000);
    }

    const handleSave = useCallback(async (formData: SaleData, fileObjects: { [key: string]: File }) => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        setLoadingMessage(t('loading'));

        try {
            const finalData = {
                ...formData,
                timestamp: formData.timestamp || new Date().toLocaleString('es-AR', { hour12: false })
            };

            const isEditMode = !!editingClientId;
            const success = await n8nService.sendFormDataToN8n(finalData, fileObjects, isEditMode);

            if (success) {
                 const successMsg = isEditMode 
                    ? t('successUpdate', { clientName: formData.clientFullName })
                    : t('successNew');
                showSuccess(successMsg);
                // Go to list only if authenticated, otherwise go home
                if (isAuthenticated) {
                    setView('list');
                    fetchClients();
                } else {
                    setView('home');
                }
            } else {
                 showError(t('error_n8n_form'));
            }

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : t('errorUnknown');
            showError(`${t('errorPrefix')}: ${errorMessage}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [t, isAuthenticated, fetchClients, editingClientId]);

    const handleLogin = (password: string): boolean => {
        if (password === CORRECT_PASSWORD) {
            setIsAuthenticated(true);
            sessionStorage.setItem(AUTH_KEY, 'true');
            setIsLoginVisible(false);
            setView('list'); // Go to list after successful login
            fetchClients();
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem(AUTH_KEY);
        setView('home');
    };
    
    const handleCancelLogin = () => {
        setIsLoginVisible(false);
    };

    // --- Action Handlers ---
    const handleRequestDelete = (id: string, name: string) => {
        setClientToDelete({ id, name });
    };

    const handleCancelDelete = () => {
        if (isDeleting) return;
        setClientToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!clientToDelete) return;

        setIsDeleting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const success = await n8nService.deleteClientInN8n(clientToDelete.id);
            if (success) {
                // Remove client from local state to update UI immediately
                const updatedClients = clients.filter(c => c.id !== clientToDelete.id)
                setClients(updatedClients);
                clientStore.setClients(updatedClients);
                showSuccess(t('successDelete', { clientName: clientToDelete.name }));
            } else {
                showError(t('errorDelete', { clientName: clientToDelete.name }));
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('errorUnknown');
            showError(`${t('errorDelete', { clientName: clientToDelete.name })}: ${errorMessage}`);
        } finally {
            setIsDeleting(false);
            setClientToDelete(null);
        }
    };

    const handleGenerateSummary = async (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) {
            showError('Client not found'); // This should not happen
            return;
        }

        setIsGeneratingSummaryId(clientId);
        setError(null);
        setSuccessMessage(null);

        try {
            generateExcel(client);
            showSuccess(t('successGenerateSummary', { clientName: client.clientFullName }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('errorUnknown');
            showError(`${t('errorGenerateSummary', { clientName: client.clientFullName })}: ${errorMessage}`);
        } finally {
            // Give a small delay for the user to see the loading state and perceive action
            setTimeout(() => setIsGeneratingSummaryId(null), 500);
        }
    };


    const renderView = () => {
        if (isFetchingClients && view === 'list' && clients.length === 0) {
            return <div className="text-center p-10">{t('loading_clients')}</div>
        }
        
        switch (view) {
            case 'list':
                 // This view is protected by the handleGoToList logic
                return <ClientListPage 
                    clients={clients} 
                    onEdit={handleGoToEditForm} 
                    onNew={handleGoToNewForm} 
                    onDelete={handleRequestDelete}
                    onGenerateSummary={handleGenerateSummary}
                    generatingSummaryId={isGeneratingSummaryId}
                    onRefresh={fetchClients}
                    isRefreshing={isFetchingClients}
                />;
            case 'form':
                return (
                    <ClientFormPage 
                        editingClientId={editingClientId}
                        onSave={handleSave}
                        onCancel={isAuthenticated ? handleGoToList : handleGoHome}
                        isLoading={isLoading}
                        loadingMessage={loadingMessage}
                        error={error}
                        clients={clients}
                        fetchClients={fetchClients}
                        isFetchingClients={isFetchingClients}
                    />
                );
            case 'home':
            default:
                return <HomePage onNewClient={handleGoToNewForm} onViewClients={handleGoToList} />;
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            <Header onGoHome={handleGoHome} onLogout={handleLogout} isAuthenticated={isAuthenticated} />
            <main className="container mx-auto p-4 md:p-8">
                 {isLoginVisible ? (
                    <LoginPage onLogin={handleLogin} onCancel={handleCancelLogin} />
                ) : (
                    <>
                        {successMessage && (
                            <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 rounded-lg">
                                {successMessage}
                            </div>
                        )}
                        {error && view !== 'form' && (
                            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg">
                                {error}
                            </div>
                        )}
                        {renderView()}
                    </>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {clientToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('deleteConfirmTitle')}</h2>
                        <p className="mt-2 text-slate-600 dark:text-slate-300">
                            {t('deleteConfirmText', { clientName: clientToDelete.name })}
                        </p>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button 
                                onClick={handleCancelDelete} 
                                disabled={isDeleting}
                                className="px-4 py-2 border border-slate-300 text-base font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                            >
                                {t('cancel')}
                            </button>
                            <button 
                                onClick={handleConfirmDelete} 
                                disabled={isDeleting}
                                className="flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('loading')}
                                    </>
                                ) : (
                                    t('deleteConfirmButton')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default App;
