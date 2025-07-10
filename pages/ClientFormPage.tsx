
import React, { useMemo } from 'react';
import { DataEntryForm } from '../components/DataEntryForm';
import { SaleData, PaymentSystem } from '../types';
import * as clientStore from '../services/clientStore';
import { useLanguage } from '../context/LanguageContext';

interface ClientFormPageProps {
    editingClientId: string | null;
    onSave: (data: SaleData) => void;
    onCancel: () => void;
    isLoading: boolean;
    loadingMessage: string | null;
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
    languages: { es: true, pt: false }, // Default to Spanish, no English
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
    clientType: '',
    paymentSystem: PaymentSystem.MENSAL,
    paymentStartDate: new Date().toISOString().split('T')[0],
    vendedor: '',
    guarantor: '',
    photoInstagramFileName: '',
    notes: '',
};

export const ClientFormPage: React.FC<ClientFormPageProps> = ({ editingClientId, onSave, onCancel, isLoading, loadingMessage }) => {
    const { t } = useLanguage();

    const initialData = useMemo(() => {
        if (editingClientId) {
            const clientData = clientStore.getClient(editingClientId);
            if (clientData) {
                // Ensure languages object is valid and merge with empty form
                // to gracefully handle data from older app versions.
                const languages = {
                    es: (clientData.languages && clientData.languages.es) || false,
                    pt: (clientData.languages && clientData.languages.pt) || false,
                };
                return { ...emptyFormData, ...clientData, languages };
            }
            // Add the id field to the empty form data if the client is not found
            return { ...emptyFormData, id: editingClientId };
        }
        return { ...emptyFormData, id: '' };
    }, [editingClientId]);

    const isEditMode = !!editingClientId;

    return (
        <div>
             <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
                {isEditMode ? t('formTitleEdit') : t('formTitleNew')}
            </h1>
            <DataEntryForm
                initialData={initialData as SaleData}
                onSubmit={onSave}
                onCancel={onCancel}
                isLoading={isLoading}
                loadingMessage={loadingMessage}
                isEditMode={isEditMode}
            />
        </div>
    );
};
