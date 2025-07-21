

import React, { useMemo, useEffect } from 'react';
import { DataEntryForm } from '../components/DataEntryForm';
import { SaleData, PaymentSystem } from '../types';
import * as clientStore from '../services/clientStore';
import { useLanguage } from '../context/LanguageContext';

interface ClientFormPageProps {
    editingClientId: string | null;
    onSave: (data: SaleData, files: { [key: string]: File }) => void;
    onCancel: () => void;
    isLoading: boolean;
    loadingMessage: string | null;
    error: string | null;
    clients: SaleData[];
    fetchClients: () => Promise<void>;
    isFetchingClients: boolean;
}

const emptyFormData: Omit<SaleData, 'id'> = {
    timestamp: '',
    clientFullName: '',
    clientCpf: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    phone: '',
    product: '',
    
    // New calculation logic fields
    totalProductPrice: 0,
    downPayment: 0,
    installments: 1,
    installmentPrice: 0, // This will be calculated and displayed

    reference1Name: '',
    reference1Relationship: '',
    reference2Name: '',
    reference2Relationship: '',
    language: '',
    storeName: '',
    workLocation: '',
    workAddress: '',
    homeLocation: '',
    homeAddress: '',
    photoStoreFileName: '',
    photoContractFrontFileName: '',
    photoContractBackFileName: '',
    photoIdFrontFileName: '',
    photoIdBackFileName: '',
    photoCpfFileName: '',
    photoHomeFileName: '',
    photoPhoneCodeFileName: '',
    photoFaceFileName: '',
    clientType: '',
    paymentSystem: PaymentSystem.MENSAL,
    paymentStartDate: new Date().toISOString().split('T')[0],
    vendedor: '',
    guarantor: '',
    photoInstagramFileName: '',
    notes: '',
    clientStatus: 'no_apto', // Default status for new clients
};

export const ClientFormPage: React.FC<ClientFormPageProps> = ({ 
    editingClientId, 
    onSave, 
    onCancel, 
    isLoading, 
    loadingMessage, 
    error,
    clients,
    fetchClients,
    isFetchingClients
}) => {
    const { t } = useLanguage();
    const isEditMode = !!editingClientId;

    useEffect(() => {
        // Pre-fetch clients if creating a new entry and the list is not available.
        // This is used for the pre-submission CPF duplication and status check.
        if (clients.length === 0 && !isFetchingClients) {
            fetchClients();
        }
    }, [clients.length, fetchClients, isFetchingClients]);


    const initialData = useMemo(() => {
        if (editingClientId) {
            const clientData = clientStore.getClient(editingClientId) as any; // Use any for easier migration
            if (clientData) {
                // Gracefully migrate from old `languages` object to new `language` string.
                const migratedData = { ...clientData };
                if (clientData.languages && typeof clientData.languages === 'object') {
                    migratedData.language = clientData.languages.pt ? 'pt' : 'es';
                    delete migratedData.languages;
                }
                return { ...emptyFormData, ...migratedData };
            }
             // If client not found, shouldn't happen but good to handle
            return { ...emptyFormData, id: editingClientId };
        }
        return { ...emptyFormData, id: '' };
    }, [editingClientId]);

    return (
        <div>
             <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
                {isEditMode ? t('formTitleEdit') : t('formTitleNew')}
            </h1>
            <DataEntryForm
                key={editingClientId || 'new'}
                initialData={initialData as SaleData}
                onSubmit={onSave}
                onCancel={onCancel}
                isLoading={isLoading}
                loadingMessage={loadingMessage}
                isEditMode={isEditMode}
                error={error}
                clients={clients}
            />
        </div>
    );
};
