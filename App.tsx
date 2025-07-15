import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { SaleData } from './types';
import * as n8nService from './services/n8nService';
import * as clientStore from './services/clientStore';
import { HomePage } from './pages/HomePage';
import { ClientListPage } from './pages/ClientListPage';
import { ClientFormPage } from './pages/ClientFormPage';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

type View = 'home' | 'list' | 'form';

const AppContent: React.FC = () => {
    const [view, setView] = useState<View>('home');
    const [clients, setClients] = useState<SaleData[]>([]);
    const [isFetchingClients, setIsFetchingClients] = useState<boolean>(true);
    const [editingClientId, setEditingClientId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { t } = useLanguage();

    const fetchClients = useCallback(async () => {
        setIsFetchingClients(true);
        try {
            // Fetch from n8n instead of Google Sheets
            const fetchedClients = await n8nService.fetchClientsFromN8n();
            setClients(fetchedClients);
            clientStore.setClients(fetchedClients);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('errorUnknown');
            showError(`${t('errorFetchClients')}: ${errorMessage}`);
            setClients([]); // Clear clients on fetch error
            clientStore.setClients([]); // Also clear the store
        } finally {
            setIsFetchingClients(false);
        }
    }, [t]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);
    
    const handleGoHome = () => setView('home');
    const handleGoToList = () => {
        fetchClients(); // Always refetch when going to the list
        setView('list');
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
        
        // For new clients, check if CPF already exists
        if (!formData.id && formData.clientCpf) {
            const clientExists = clients.some(client => client.clientCpf === formData.clientCpf);
            if (clientExists) {
                showError(t('errorClientExists'));
                setIsLoading(false);
                return;
            }
        }

        let formSuccess = false;
        let reportSuccess = false;

        try {
            const finalData = {
                ...formData,
                timestamp: formData.timestamp || new Date().toLocaleString('es-AR', { hour12: false })
            };

            // 1. Send form data and files to the main n8n workflow
            setLoadingMessage(t('loading_n8n_form'));
            // The service now handles both new and edited data (with ID)
            formSuccess = await n8nService.sendFormDataToN8n(finalData, fileObjects);
            if (!formSuccess) {
                showError(t('error_n8n_form'));
            }

            // 2. Send report data to the secondary n8n workflow
            setLoadingMessage(t('loading_n8n_report'));
            // The service now handles both new and edited data (with ID)
            reportSuccess = await n8nService.sendReportDataToN8n(finalData);
            if (!reportSuccess) {
                showError(t('error_n8n_report'));
            }

            if (formSuccess || reportSuccess) {
                 const successMsg = formData.id 
                    ? t('successUpdate', { clientName: formData.clientFullName })
                    : t('successNew');
                showSuccess(successMsg);
                setView('list');
                fetchClients(); // Refresh the list from n8n
            } else {
                 showError(t('error_n8n_all_failed'));
            }

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : t('errorUnknown');
            showError(`${t('errorPrefix')}: ${errorMessage}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [t, fetchClients, clients]); // Added 'clients' to dependency array for the CPF check

    const renderView = () => {
        if (isFetchingClients && view !== 'form') {
            return <div className="text-center p-10">{t('loading_clients')}</div>
        }
        
        switch (view) {
            case 'list':
                return <ClientListPage clients={clients} onEdit={handleGoToEditForm} onNew={handleGoToNewForm} />;
            case 'form':
                return (
                    <ClientFormPage 
                        editingClientId={editingClientId}
                        onSave={handleSave}
                        onCancel={handleGoToList}
                        isLoading={isLoading}
                        loadingMessage={loadingMessage}
                    />
                );
            case 'home':
            default:
                return <HomePage onNewClient={handleGoToNewForm} onViewClients={handleGoToList} />;
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            <Header onGoHome={handleGoHome} />
            <main className="container mx-auto p-4 md:p-8">
                {successMessage && (
                    <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 rounded-lg">
                        {successMessage}
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg">
                        {error}
                    </div>
                )}
                {renderView()}
            </main>
        </div>
    );
};

const App: React.FC = () => (
    <LanguageProvider>
        <AppContent />
    </LanguageProvider>
);


export default App;

export default App;
