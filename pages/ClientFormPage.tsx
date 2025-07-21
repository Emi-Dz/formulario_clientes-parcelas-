
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
            const clientToEdit = clientStore.getClient(editingClientId);
            if (!clientToEdit) {
                 return { ...emptyFormData, id: editingClientId };
            }
    
            // Find all records for this client's CPF to merge photo data
            const clientCpf = clientToEdit.clientCpf;
            const allClientRecords = (clientCpf && clients.length > 0)
                ? clients.filter(c => c.clientCpf && c.clientCpf.replace(/\D/g, '') === clientCpf.replace(/\D/g, ''))
                : [clientToEdit];
            
            // Create a composite object of all available photos from the client's history.
            // This ensures that if a photo was uploaded in ANY previous purchase, it's found and displayed.
            const compositePhotoData = allClientRecords.reduce((acc, record) => {
                acc.photoStoreFileName = acc.photoStoreFileName || record.photoStoreFileName;
                acc.photoHomeFileName = acc.photoHomeFileName || record.photoHomeFileName;
                acc.photoInstagramFileName = acc.photoInstagramFileName || record.photoInstagramFileName;
                acc.photoIdFrontFileName = acc.photoIdFrontFileName || record.photoIdFrontFileName;
                acc.photoIdBackFileName = acc.photoIdBackFileName || record.photoIdBackFileName;
                acc.photoCpfFileName = acc.photoCpfFileName || record.photoCpfFileName;
                acc.photoFaceFileName = acc.photoFaceFileName || record.photoFaceFileName;
                acc.photoPhoneCodeFileName = acc.photoPhoneCodeFileName || record.photoPhoneCodeFileName;
                return acc;
            }, { 
                photoStoreFileName: '', photoHomeFileName: '', photoInstagramFileName: '',
                photoIdFrontFileName: '', photoIdBackFileName: '', photoCpfFileName: '',
                photoFaceFileName: '', photoPhoneCodeFileName: ''
            });
    
            const finalData = { ...emptyFormData, ...clientToEdit, ...compositePhotoData };
            
            // Contract photos are specific to a single purchase, so we ensure only the ones
            // from the record being edited are used, not historical ones.
            finalData.photoContractFrontFileName = clientToEdit.photoContractFrontFileName;
            finalData.photoContractBackFileName = clientToEdit.photoContractBackFileName;
            
            // Gracefully migrate from old `languages` object to new `language` string.
            const migratedData = { ...finalData } as any;
            if (migratedData.languages && typeof migratedData.languages === 'object') {
                migratedData.language = migratedData.languages.pt ? 'pt' : 'es';
                delete migratedData.languages;
            }
            return migratedData;
        }
        return { ...emptyFormData, id: '' };
    }, [editingClientId, clients]);

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
