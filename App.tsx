import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { SaleData } from './types';
import * as n8nService from './services/n8nService';
import * as clientStore from './services/clientStore';
import { HomePage } from './pages/HomePage';
import { ClientListPage } from './pages/ClientListPage';
import { ClientFormPage } from './pages/ClientFormPage';
import { useLanguage } from './context/LanguageContext';

type View = 'home' | 'list' | 'form';

const App: React.FC = () => {
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
        fetchClients();
    }, [fetchClients]);
    
    const handleGoHome = () => setView('home');
    const handleGoToList = () => {
        fetchClients();
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
        
        // For new clients, check if CPF already exists using a robust, normalized comparison.
        if (!formData.id && formData.clientCpf) {
            const normalizeCpf = (cpf: string) => (cpf || '').replace(/\D/g, '');
            const newClientCpf = normalizeCpf(formData.clientCpf);

            if (newClientCpf) { // Only check if CPF is not empty
                const clientExists = clients.some(client => normalizeCpf(client.clientCpf) === newClientCpf);
                if (clientExists) {
                    showError(t('errorClientExists'));
                    setIsLoading(false);
                    return;
                }
            }
        }

        let formSuccess = false;
        let reportSuccess = false;

        try {
            const finalData = {
                ...formData,
                timestamp: formData.timestamp || new Date().toLocaleString('es-AR', { hour12: false })
            };

            setLoadingMessage(t('loading_n8n_form'));
            formSuccess = await n8nService.sendFormDataToN8n(finalData, fileObjects);
            if (!formSuccess) {
                showError(t('error_n8n_form'));
            }

            setLoadingMessage(t('loading_n8n_report'));
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
                fetchClients(); 
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
    }, [t, fetchClients, clients]);

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


export default App;
