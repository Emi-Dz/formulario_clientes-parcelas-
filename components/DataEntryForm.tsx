import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SaleData, PaymentSystem, Language, ClientType } from '../types';
import { PAYMENT_OPTIONS, CLIENT_TYPE_OPTIONS } from '../constants';
import { useLanguage } from '../context/LanguageContext';

// --- Reusable Input Components ---

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
    label?: string;
    wrapperClass?: string;
    as?: 'input' | 'select' | 'textarea';
    children?: React.ReactNode;
    rows?: number;
}

const Input: React.FC<InputProps> = ({ label, id, wrapperClass, as = 'input', ...props }) => {
    const commonClasses = "w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-slate-200 dark:disabled:bg-slate-700";
    const Tag = as;

    return (
        <div className={wrapperClass}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {label}
                </label>
            )}
            <Tag id={id} {...props} className={commonClasses} />
        </div>
    );
};

const Fieldset: React.FC<{ legend: string; children: React.ReactNode }> = ({ legend, children }) => (
    <fieldset className="border border-slate-300 dark:border-slate-600 p-4 rounded-lg">
        <legend className="px-2 text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {legend}
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {children}
        </div>
    </fieldset>
);

const NotAptWarning = ({ message }: { message: string }) => (
    <div className="md:col-span-2 flex items-center p-3 mt-1 rounded-md bg-red-100 dark:bg-red-900 border border-red-500 text-red-800 dark:text-red-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="font-bold">{message}</p>
    </div>
);


// --- Main Form Component ---

interface DataEntryFormProps {
    initialData: SaleData;
    onSubmit: (data: SaleData, files: { [key: string]: File }) => void;
    onCancel: () => void;
    isLoading: boolean;
    loadingMessage: string | null;
    isEditMode: boolean;
    error: string | null;
    clients: SaleData[];
}

export const DataEntryForm: React.FC<DataEntryFormProps> = ({ initialData, onSubmit, onCancel, isLoading, loadingMessage, isEditMode, error, clients }) => {
    const [formData, setFormData] = useState<SaleData>(initialData);
    const [fileObjects, setFileObjects] = useState<{ [key: string]: File }>({});
    const [isClientNotApt, setIsClientNotApt] = useState<boolean>(false);
    const { t } = useLanguage();
    const errorRef = useRef<HTMLDivElement>(null);

    const normalizeCpf = (cpf: string) => (cpf || '').replace(/\D/g, '');

    // Check client status and auto-fill data for existing CPF on new forms
    useEffect(() => {
        const handleCpfChange = () => {
            // Auto-filling should only happen on new forms, not when editing an existing client
            if (isEditMode) return;
    
            const currentCpf = normalizeCpf(formData.clientCpf);
            
            // A full CPF is needed for a reliable search
            if (currentCpf.length < 11 || clients.length === 0) {
                setIsClientNotApt(false);
                // If user is clearing the CPF, we don't clear other fields they might want to keep.
                return;
            }
            
            // Find all client records that match the entered CPF
            const existingClientRecords = clients.filter(c => normalizeCpf(c.clientCpf) === currentCpf);
    
            if (existingClientRecords.length > 0) {
                // A client's status is consistent across all records, check the first one
                setIsClientNotApt(existingClientRecords[0].clientStatus === 'no_apto');
                
                // Sort records by purchase date to get the most recent data
                const sortedRecords = [...existingClientRecords].sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
                const mostRecentRecord = sortedRecords[0];

                // Find the latest non-empty value for clientType and language by searching all of the client's records.
                const latestClientType = sortedRecords.find(r => r.clientType)?.clientType || '';
                const latestLanguage = sortedRecords.find(r => r.language)?.language || '';
                
                // Aggregate all non-purchase-specific photos from the client's entire history.
                // This ensures that if a photo was uploaded in ANY previous purchase, it's found and displayed.
                const compositePhotoData = existingClientRecords.reduce((acc, record) => {
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
    
                setFormData(prevData => ({
                    ...prevData, // Keep purchase-specific data already entered for this new sale
                    // Overwrite with existing client's data, using most recent record as the base
                    clientFullName: mostRecentRecord.clientFullName,
                    phone: mostRecentRecord.phone,
                    workLocation: mostRecentRecord.workLocation,
                    workAddress: mostRecentRecord.workAddress,
                    homeLocation: mostRecentRecord.homeLocation,
                    homeAddress: mostRecentRecord.homeAddress,
                    reference1Name: mostRecentRecord.reference1Name,
                    reference1Relationship: mostRecentRecord.reference1Relationship,
                    reference2Name: mostRecentRecord.reference2Name,
                    reference2Relationship: mostRecentRecord.reference2Relationship,
                    // Use the most recent non-empty values found
                    clientType: latestClientType,
                    language: latestLanguage,
                    // Overwrite with aggregated photo data
                    ...compositePhotoData,
                    // Ensure contract photos, which are specific to a new purchase, are NOT carried over.
                    photoContractFrontFileName: '',
                    photoContractBackFileName: '',
                }));
            } else {
                // If no client is found, just ensure the "not apt" warning is hidden.
                setIsClientNotApt(false);
            }
        };
        handleCpfChange();
    }, [formData.clientCpf, clients, isEditMode]);


    const calculateInstallmentPrice = useCallback(() => {
        const total = parseFloat(String(formData.totalProductPrice)) || 0;
        const down = parseFloat(String(formData.downPayment)) || 0;
        const count = parseInt(String(formData.installments), 10) > 0 ? parseInt(String(formData.installments), 10) : 1;
        const price = (total - down) / count;
        setFormData(prev => ({ ...prev, installmentPrice: price > 0 ? price : 0 }));
    }, [formData.totalProductPrice, formData.downPayment, formData.installments]);

    useEffect(() => {
        calculateInstallmentPrice();
    }, [calculateInstallmentPrice]);
    
    useEffect(() => {
        if (error && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [error]);

    const formatCpfInput = (value: string) => {
        const onlyNumbers = value.replace(/\D/g, '');
        return onlyNumbers
            .slice(0, 11)
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'clientCpf') {
             setFormData(prev => ({ ...prev, [name]: formatCpfInput(value) }));
             return;
        }

        const isNumericField = ['installments', 'downPayment', 'totalProductPrice'].includes(name);

        setFormData(prev => ({
            ...prev,
            [name]: isNumericField ? (value === '' ? '' : Number(value)) : value,
        }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files.length > 0) {
            const file = files[0];
            const updatedFileObjects = { ...fileObjects, [name]: file };
            setFileObjects(updatedFileObjects);

            // Update formData to reflect the new file name immediately
            const updatedFormData = { ...formData, [name]: file.name };
            
            setFormData(updatedFormData);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData, fileObjects);
    }
    
    // --- New File Upload Button UI ---
    
    const hasFile = (name: keyof SaleData): boolean => {
        const fileName = (formData[name] as string) || '';
        return fileName.trim() !== '';
    };

    const handleCancelFile = (name: keyof SaleData) => {
        // Clear the file from the pending upload queue
        setFileObjects(prev => {
            const newFiles = { ...prev };
            delete newFiles[name];
            return newFiles;
        });

        // Clear the file name from the form data to update the UI
        setFormData(prev => ({
            ...prev,
            [name]: '',
        }));

        // Reset the underlying file input so the user can re-select the same file
        const inputElement = document.querySelector(`input[name="${name}"]`) as HTMLInputElement;
        if (inputElement) {
            inputElement.value = '';
        }
    };
    
    const FileUploadDisplay = ({ isPresent, text }: { isPresent: boolean, text: string }) => (
        <>
            {isPresent && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            )}
            <span className="truncate">{text}</span>
        </>
    );

    const getButtonClass = (isPresent: boolean) => {
        return `relative w-full border-2 border-dashed rounded-lg transition-colors font-semibold flex items-center justify-center 
        ${isPresent
            ? 'bg-emerald-50 dark:bg-emerald-900/50 border-emerald-500 text-emerald-700 dark:text-emerald-300'
            : 'border-slate-400 dark:border-slate-500 text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-500'
        }`;
    }

    const twoSidedUpload = (titleKey: string, frontName: keyof SaleData, backName: keyof SaleData) => (
         <div className="relative p-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg flex flex-col">
            <span className="block text-sm font-medium text-center text-slate-700 dark:text-slate-300 mb-2">{t(titleKey)}</span>
            <div className="grid grid-cols-2 gap-2 mt-auto">
                <div className="relative h-full">
                    <button type="button" className={`${getButtonClass(hasFile(frontName))} p-2 text-sm w-full h-full`}>
                        <FileUploadDisplay isPresent={hasFile(frontName)} text={t('frente')} />
                        <input type="file" name={frontName} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                    </button>
                    {hasFile(frontName) && (
                         <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCancelFile(frontName); }}
                            className="absolute -top-1.5 -right-1.5 z-10 p-0.5 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-800 focus:ring-red-500"
                            aria-label={`Cancelar subida de ${t('frente')}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
                <div className="relative h-full">
                    <button type="button" className={`${getButtonClass(hasFile(backName))} p-2 text-sm w-full h-full`}>
                        <FileUploadDisplay isPresent={hasFile(backName)} text={t('verso')} />
                        <input type="file" name={backName} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                    </button>
                     {hasFile(backName) && (
                         <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCancelFile(backName); }}
                            className="absolute -top-1.5 -right-1.5 z-10 p-0.5 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-800 focus:ring-red-500"
                            aria-label={`Cancelar subida de ${t('verso')}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
    
    const singleUploadButton = (titleKey: string, name: keyof SaleData) => (
        <div className="relative h-full">
            <button type="button" className={`${getButtonClass(hasFile(name))} p-3 text-sm w-full h-full`}>
                <FileUploadDisplay isPresent={hasFile(name)} text={t(titleKey)} />
                <input type="file" name={name} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
            </button>
            {hasFile(name) && (
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCancelFile(name); }}
                    className="absolute -top-2 -right-2 z-10 p-1 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-red-500"
                    aria-label={`Cancelar subida de ${t(titleKey)}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
        </div>
    );


    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
                <div ref={errorRef} className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg">
                    {error}
                </div>
            )}
            
            <Fieldset legend={t('clientDetails')}>
                <Input
                    label={t('sobrenomeENome')}
                    id="clientFullName"
                    name="clientFullName"
                    value={formData.clientFullName}
                    onChange={handleChange}
                    required
                    placeholder={t('placeholder_clientName')}
                    wrapperClass="md:col-span-2"
                />
                
                <Input
                    label={t('cpf')}
                    id="clientCpf"
                    name="clientCpf"
                    value={formData.clientCpf}
                    onChange={handleChange}
                    required
                    disabled={isEditMode}
                    placeholder="000.000.000-00"
                />

                <Input
                    label={t('telefone')}
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder={t('placeholder_phone')}
                />
                
                {isClientNotApt && !isEditMode && <NotAptWarning message={t('warning_client_not_apt')} />}

                 <Input
                    as="select"
                    label={t('clientType')}
                    id="clientType"
                    name="clientType"
                    value={formData.clientType}
                    onChange={handleChange}
                    required
                >
                    <option value="" disabled>{t('placeholder_select')}</option>
                    {CLIENT_TYPE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{t(opt)}</option>
                    ))}
                </Input>

                <Input
                    as="select"
                    label={t('language')}
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    required
                >
                    <option value="" disabled>{t('placeholder_select')}</option>
                    <option value="es">{t('espanol')}</option>
                    <option value="pt">{t('portugues')}</option>
                </Input>
                
            </Fieldset>
            
            <Fieldset legend={t('saleDetails')}>
                 <Input
                    label={t('produtos')}
                    id="product"
                    name="product"
                    value={formData.product}
                    onChange={handleChange}
                    required
                    placeholder={t('placeholder_product')}
                    wrapperClass="md:col-span-2"
                />

                <Input
                    label={t('purchaseDate')}
                    type="date"
                    id="purchaseDate"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    required
                />
                
                <Input
                    label={t('vendedor')}
                    id="vendedor"
                    name="vendedor"
                    value={formData.vendedor}
                    onChange={handleChange}
                    placeholder={t('placeholder_vendedor')}
                />
                
                <Input
                    label={t('totalProductPrice')}
                    type="number"
                    step="0.01"
                    id="totalProductPrice"
                    name="totalProductPrice"
                    value={formData.totalProductPrice}
                    onChange={handleChange}
                    required
                />

                <Input
                    label={t('downPayment')}
                    type="number"
                    step="0.01"
                    id="downPayment"
                    name="downPayment"
                    value={formData.downPayment}
                    onChange={handleChange}
                />
                
                 <Input
                    label={t('installments')}
                    type="number"
                    id="installments"
                    name="installments"
                    value={formData.installments}
                    onChange={handleChange}
                    required
                    min="1"
                />

                <div className="flex flex-col justify-center">
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('installmentPrice')}</label>
                    <span className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                        R$ {formData.installmentPrice.toFixed(2)}
                    </span>
                </div>
                
                 <Input
                    as="select"
                    label={t('paymentSystem')}
                    id="paymentSystem"
                    name="paymentSystem"
                    value={formData.paymentSystem}
                    onChange={handleChange}
                    required
                >
                    {PAYMENT_OPTIONS.map(system => (
                        <option key={system} value={system}>{t(system.toLowerCase())}</option>
                    ))}
                </Input>

                <Input
                    label={t('paymentStartDate')}
                    type="date"
                    id="paymentStartDate"
                    name="paymentStartDate"
                    value={formData.paymentStartDate}
                    onChange={handleChange}
                    required
                />
                
                 <Input
                    label={t('guarantor')}
                    id="guarantor"
                    name="guarantor"
                    value={formData.guarantor}
                    onChange={handleChange}
                    placeholder={t('placeholder_guarantor')}
                />
                 <Input
                    label={t('storeName')}
                    id="storeName"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    placeholder={t('placeholder_storeName')}
                />
            </Fieldset>

            <Fieldset legend={t('locations')}>
                <Input
                    label={t('localizacaoTrab')}
                    id="workLocation"
                    name="workLocation"
                    value={formData.workLocation}
                    onChange={handleChange}
                    placeholder={t('placeholder_location')}
                />
                 <Input
                    label={t('enderecoTrab')}
                    id="workAddress"
                    name="workAddress"
                    value={formData.workAddress}
                    onChange={handleChange}
                    placeholder={t('placeholder_address')}
                />
                 <Input
                    label={t('localizacaoCasa')}
                    id="homeLocation"
                    name="homeLocation"
                    value={formData.homeLocation}
                    onChange={handleChange}
                    placeholder={t('placeholder_location')}
                />
                 <Input
                    label={t('enderecoCasa')}
                    id="homeAddress"
                    name="homeAddress"
                    value={formData.homeAddress}
                    onChange={handleChange}
                    placeholder={t('placeholder_address')}
                />
            </Fieldset>

            <Fieldset legend={t('references')}>
                <Input
                    label={t('reference1Name')}
                    id="reference1Name"
                    name="reference1Name"
                    value={formData.reference1Name}
                    onChange={handleChange}
                    placeholder={t('placeholder_refName')}
                />
                <Input
                    label={t('reference1Relationship')}
                    id="reference1Relationship"
                    name="reference1Relationship"
                    value={formData.reference1Relationship}
                    onChange={handleChange}
                    placeholder={t('placeholder_refRelationship')}
                />
                <Input
                    label={t('reference2Name')}
                    id="reference2Name"
                    name="reference2Name"
                    value={formData.reference2Name}
                    onChange={handleChange}
                    placeholder={t('placeholder_refName')}
                />
                <Input
                    label={t('reference2Relationship')}
                    id="reference2Relationship"
                    name="reference2Relationship"
                    value={formData.reference2Relationship}
                    onChange={handleChange}
                    placeholder={t('placeholder_refRelationship')}
                />
            </Fieldset>
            
             <Fieldset legend={t('photos')}>
                {twoSidedUpload('fotoContrato', 'photoContractFrontFileName', 'photoContractBackFileName')}
                {twoSidedUpload('fotoDocumentos', 'photoIdFrontFileName', 'photoIdBackFileName')}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:col-span-2">
                     {singleUploadButton('cpfPhoto', 'photoCpfFileName')}
                     {singleUploadButton('fotoCasa', 'photoHomeFileName')}
                     {singleUploadButton('fotoCara', 'photoFaceFileName')}
                     {singleUploadButton('fotoLoja', 'photoStoreFileName')}
                     {singleUploadButton('fotoCodigoTelefono', 'photoPhoneCodeFileName')}
                     {singleUploadButton('instagramFace', 'photoInstagramFileName')}
                </div>
            </Fieldset>

            <Fieldset legend={t('obs')}>
                <Input
                    as="textarea"
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder={t('placeholder_notes')}
                    wrapperClass="md:col-span-2"
                />
            </Fieldset>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-base font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {t('cancel')}
                </button>
                <button
                    type="submit"
                    disabled={isLoading || isClientNotApt}
                    className="flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed"
                >
                    {isLoading && (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {isLoading ? loadingMessage : (isEditMode ? t('saveChanges') : t('submitNewClient'))}
                </button>
            </div>
        </form>
    );
};
