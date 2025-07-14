import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { SaleData } from './types';
import { generateExcel } from './services/excelGenerator';
import { sendToGoogleSheets } from './services/googleSheetsService';
import * as clientStore from './services/clientStore';
import { HomePage } from './pages/HomePage';
import { ClientListPage } from './pages/ClientListPage';
import { ClientFormPage } from './pages/ClientFormPage';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

type View = 'home' | 'list' | 'form';

const AppContent: React.FC = () => {
    const [view, setView] = useState<View>('home');
    const [clients, setClients] = useState<SaleData[]>([]);
    const [editingClientId, setEditingClientId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { t } = useLanguage();

    useEffect(() => {
        setClients(clientStore.getClients());
    }, []);
    
    const handleGoHome = () => setView('home');
    const handleGoToList = () => setView('list');
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

    const handleSave = useCallback(async (formData: SaleData) => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const isEditing = !!formData.id;

            const finalDataWithTimestamp = {
                ...formData,
                timestamp: formData.timestamp || new Date().toLocaleString('es-AR', { hour12: false })
            };
            
            // 1. Send to Webhook (with File objects) and handle failure gracefully
            setLoadingMessage(t('loading_sheets'));
            const webhookSuccess = await sendToGoogleSheets(finalDataWithTimestamp);
            if (!webhookSuccess) {
                 // Show a non-blocking error, the process will continue
                showError(t('error_sheets_fallback'));
            }

            // 2. Prepare data for local storage and Excel by replacing File objects with their names.
            const dataForStorage: SaleData = { ...finalDataWithTimestamp };
            const fileKeys: (keyof SaleData)[] = [
                'photoStoreFileName', 'photoContractFrontFileName', 'photoContractBackFileName',
                'photoIdFrontFileName', 'photoIdBackFileName', 'photoCpfFileName', 'photoHomeFileName',
                'photoPhoneCodeFileName', 'photoInstagramFileName'
            ];

            fileKeys.forEach(key => {
                const value = (dataForStorage as any)[key];
                if (value instanceof File) {
                    (dataForStorage as any)[key] = value.name;
                }
            });

            // 3. Save to LocalStorage
            setLoadingMessage(t('loading_saving'));
            if (isEditing) {
                const updatedClients = clientStore.updateClient(dataForStorage);
                setClients(updatedClients);
                showSuccess(t('successUpdate', { clientName: dataForStorage.clientFullName }));
            } else {
                const newClient = clientStore.addClient(dataForStorage);
                setClients(prev => [...prev, newClient]);
                showSuccess(t('successNew'));
            }

            // 4. Generate and download Excel file
            setLoadingMessage(t('loading_excel'));
            generateExcel(dataForStorage);

            // 5. Navigate to list view
            setView('list');

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : t('errorUnknown');
            showError(`${t('errorPrefix')}: ${errorMessage}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [t]);

    const renderView = () => {
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
