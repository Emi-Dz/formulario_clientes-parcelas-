


import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { SaleData, AuthUser, ClientStatus } from './types';
import * as n8nService from './services/n8nService';
import * as clientStore from './services/clientStore';
import { ClientListPage } from './pages/ClientListPage';
import { ClientFormPage } from './pages/ClientFormPage';
import { useLanguage } from './context/LanguageContext';
import { LoginPage } from './pages/LoginPage';
import { generateExcel } from './services/excelGenerator';

type View = 'list' | 'form';

const AUTH_KEY = 'client-app-user';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
        const storedUser = sessionStorage.getItem(AUTH_KEY);
        try {
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            return null;
        }
    });
    const [view, setView] = useState<View>('list');
    const [clients, setClients] = useState<SaleData[]>([]);
    const [isFetchingClients, setIsFetchingClients] = useState<boolean>(false);
    const [editingClientId, setEditingClientId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { t } = useLanguage();
    const [formKey, setFormKey] = useState(1);

    // --- State for async actions on list items ---
    const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [isGeneratingSummaryId, setIsGeneratingSummaryId] = useState<string | null>(null);
    const [isUpdatingStatusId, setIsUpdatingStatusId] = useState<string | null>(null);

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

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            fetchClients();
        }
        if(currentUser) {
            setView(currentUser.role === 'admin' ? 'list' : 'form');
        }
    }, [currentUser, fetchClients]);

    const handleGoHome = () => {
        if (!currentUser) return;
        if (currentUser.role === 'admin') {
            setView('list');
        } else {
            // Seller's "home" is a new form
            handleGoToNewForm();
        }
    };
    
    const handleGoToNewForm = () => {
        setEditingClientId(null);
        setView('form');
        setFormKey(k => k + 1); // Force re-mount of form component for a clean state
    };

    const handleGoToEditForm = (id: string) => {
        if (currentUser?.role !== 'admin') return;
        setEditingClientId(id);
        setView('form');
        setFormKey(k => k + 1);
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
        
        // --- Pre-submission Validation ---
        // Only perform this check for new entries (when formData.id is falsy)
        if (!formData.id && formData.clientCpf) {
            const normalizeCpf = (cpf: string) => (cpf || '').replace(/\D/g, '');
            const newClientCpf = normalizeCpf(formData.clientCpf);
            
            if (newClientCpf) {
                // Find if a client with this CPF exists and check their status.
                // We only need to find one entry to check the status, as it should be consistent for a given CPF.
                const existingClient = clients.find(client => normalizeCpf(client.clientCpf) === newClientCpf);

                // Block submission only if the client exists AND is marked as "not apt".
                if (existingClient && existingClient.clientStatus === 'no_apto') {
                    showError(t('warning_client_not_apt'));
                    setIsLoading(false);
                    setLoadingMessage(null);
                    return;
                }
            }
        }

        try {
            const finalData = { ...formData, timestamp: formData.timestamp || new Date().toLocaleString('es-AR', { hour12: false }) };
            const success = await n8nService.sendFormDataToN8n(finalData, fileObjects);

            if (success) {
                const successMsg = formData.id ? t('successUpdate', { clientName: formData.clientFullName }) : t('successNew');
                showSuccess(successMsg);
                
                // Always refresh the client list after any save operation to keep data fresh.
                await fetchClients();

                if (currentUser?.role === 'admin') {
                    setView('list');
                } else {
                    // For sellers, after saving and refreshing the data,
                    // present them with a fresh form for the next entry.
                    handleGoToNewForm();
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
    }, [t, currentUser, fetchClients, clients]);

    const handleLogin = async (username: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const users = await n8nService.fetchUsers();
            const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
            
            if (foundUser) {
                const userToStore: AuthUser = { id: foundUser.id, username: foundUser.username, role: foundUser.role };
                sessionStorage.setItem(AUTH_KEY, JSON.stringify(userToStore));
                setCurrentUser(userToStore);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Login failed:", error);
            const errorMessage = error instanceof Error ? error.message : t('errorUnknown');
            showError(errorMessage);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem(AUTH_KEY);
        setCurrentUser(null);
        setClients([]);
    };

    const handleCancelForm = () => {
        setEditingClientId(null);
        if (currentUser?.role === 'admin') {
            setView('list');
        } else {
            handleGoToNewForm();
        }
    };

    // --- Action Handlers ---
    const handleRequestDelete = (id: string, name: string) => {
        if (currentUser?.role !== 'admin') return;
        setClientToDelete({ id, name });
    };

    const handleCancelDelete = () => {
        if (isDeleting) return;
        setClientToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!clientToDelete || currentUser?.role !== 'admin') return;

        setIsDeleting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const success = await n8nService.deleteClientInN8n(clientToDelete.id);
            if (success) {
                const updatedClients = clients.filter(c => c.id !== clientToDelete.id);
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
        if (currentUser?.role !== 'admin') return;
        const client = clients.find(c => c.id === clientId);
        if (!client) {
            showError('Client not found');
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
            setTimeout(() => setIsGeneratingSummaryId(null), 500);
        }
    };

    const handleUpdateClientStatus = async (clientToUpdate: SaleData, newStatus: ClientStatus) => {
        if (currentUser?.role !== 'admin' || !clientToUpdate.clientCpf) return;
        
        setIsUpdatingStatusId(clientToUpdate.id);
        setError(null);
        setSuccessMessage(null);

        try {
            const success = await n8nService.updateClientStatusInN8n(clientToUpdate.clientCpf, newStatus);
            if (success) {
                // Update state locally for immediate feedback to avoid race conditions with fetching.
                // Since the backend updates all records for a given CPF, we mimic that behavior here.
                setClients(prevClients => {
                    const updatedClients = prevClients.map(c => {
                        if (c.clientCpf && c.clientCpf === clientToUpdate.clientCpf) {
                            return { ...c, clientStatus: newStatus };
                        }
                        return c;
                    });
                    clientStore.setClients(updatedClients); // Also update the cache
                    return updatedClients;
                });

                const statusText = newStatus === 'apto' ? t('status_apto') : t('status_no_apto');
                showSuccess(t('successStatusUpdate', { clientName: clientToUpdate.clientFullName, status: statusText }));
            } else {
                showError(t('errorStatusUpdate', { clientName: clientToUpdate.clientFullName }));
            }
        } catch (err) {
             const errorMessage = err instanceof Error ? err.message : t('errorUnknown');
            showError(`${t('errorStatusUpdate', { clientName: clientToUpdate.clientFullName })}: ${errorMessage}`);
        } finally {
             setIsUpdatingStatusId(null);
        }
    };


    const renderView = () => {
        // For sellers, the view is always the form to add a new client.
        if (currentUser?.role === 'vendedor') {
            return (
                <ClientFormPage 
                    key={formKey}
                    editingClientId={null} // Sellers can only create new clients
                    onSave={handleSave}
                    onCancel={handleCancelForm}
                    isLoading={isLoading}
                    loadingMessage={loadingMessage}
                    error={error}
                    clients={clients}
                    fetchClients={fetchClients}
                    isFetchingClients={isFetchingClients}
                />
            );
        }

        // For admins, the view depends on the `view` state variable
        if (currentUser?.role === 'admin') {
            if (view === 'list') {
                 if (isFetchingClients && clients.length === 0) {
                    return <div className="text-center p-10">{t('loading_clients')}</div>
                }
                return <ClientListPage 
                    clients={clients} 
                    onEdit={handleGoToEditForm} 
                    onNew={handleGoToNewForm} 
                    onDelete={handleRequestDelete}
                    onGenerateSummary={handleGenerateSummary}
                    generatingSummaryId={isGeneratingSummaryId}
                    onRefresh={fetchClients}
                    isRefreshing={isFetchingClients}
                    onUpdateStatus={handleUpdateClientStatus}
                    updatingStatusId={isUpdatingStatusId}
                />;
            }

            if (view === 'form') {
                return (
                    <ClientFormPage 
                        key={formKey}
                        editingClientId={editingClientId} // Admins can edit existing clients
                        onSave={handleSave}
                        onCancel={handleCancelForm}
                        isLoading={isLoading}
                        loadingMessage={loadingMessage}
                        error={error}
                        clients={clients}
                        fetchClients={fetchClients}
                        isFetchingClients={isFetchingClients}
                    />
                );
            }
        }
        
        // Fallback for initial loading after login but before role is processed, or unexpected states.
        return <div className="text-center p-10">{t('loading')}</div>;
    }

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} isLoading={isLoading} error={error} />;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            <Header onGoHome={handleGoHome} onLogout={handleLogout} isLoggedIn={!!currentUser} userRole={currentUser.role} />
            <main className="container mx-auto p-4 md:p-8">
                {error && view !== 'form' && (
                    <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg">
                        {error}
                    </div>
                )}
                {renderView()}
            </main>

            {/* Success Toast Notification */}
            {successMessage && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-md w-auto" role="status" aria-live="polite">
                    <div className="bg-emerald-500 text-white font-bold rounded-lg shadow-xl p-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{successMessage}</span>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {clientToDelete && currentUser.role === 'admin' && (
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
