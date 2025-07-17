

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
    isInitialLoading: boolean;
}

export const DataEntryForm: React.FC<DataEntryFormProps> = ({ initialData, onSubmit, onCancel, isLoading, loadingMessage, isEditMode, error, clients, isInitialLoading }) => {
    const [formData, setFormData] = useState<SaleData>(initialData);
    const [fileObjects, setFileObjects] = useState<{ [key: string]: File }>({});
    const [isSearchingCpf, setIsSearchingCpf] = useState(false);
    const { t } = useLanguage();
    const errorRef = useRef<HTMLDivElement>(null);

    const calculateInstallmentPrice = useCallback(() => {
        const total = formData.totalProductPrice || 0;
        const down = formData.downPayment || 0;
        const count = formData.installments > 0 ? formData.installments : 1;
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

    const formatCpf = (value: string) => {
        const onlyNumbers = value.replace(/\D/g, '');
        return onlyNumbers
            .slice(0, 11)
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    };
    
    const handleCpfBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const cpfToFind = e.target.value;
        if (!cpfToFind || clients.length === 0 || isEditMode) {
            return;
        }

        setIsSearchingCpf(true);
        const normalize = (cpf: string) => (cpf || '').replace(/\D/g, '');
        const normalizedCpfToFind = normalize(cpfToFind);

        setTimeout(() => {
            const matchingClients = clients.filter(c => normalize(c.clientCpf) === normalizedCpfToFind);

            if (matchingClients.length > 0) {
                const lastClient = matchingClients.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                
                setFormData(prevData => ({
                    ...prevData,
                    clientFullName: lastClient.clientFullName,
                    clientType: lastClient.clientType,
                    phone: lastClient.phone,
                    language: lastClient.language,
                    storeName: lastClient.storeName,
                    guarantor: lastClient.guarantor,
                    workLocation: lastClient.workLocation,
                    workAddress: lastClient.workAddress,
                    homeLocation: lastClient.homeLocation,
                    homeAddress: lastClient.homeAddress,
                    reference1Name: lastClient.reference1Name,
                    reference1Relationship: lastClient.reference1Relationship,
                    reference2Name: lastClient.reference2Name,
                    reference2Relationship: lastClient.reference2Relationship,
                    photoInstagramFileName: lastClient.photoInstagramFileName,
                    photoStoreFileName: lastClient.photoStoreFileName,
                    photoHomeFileName: lastClient.photoHomeFileName,
                    photoIdFrontFileName: lastClient.photoIdFrontFileName,
                    photoIdBackFileName: lastClient.photoIdBackFileName,
                    photoCpfFileName: lastClient.photoCpfFileName,
                }));
            }
            setIsSearchingCpf(false);
        }, 300); // Small delay for UX
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'clientCpf') {
             setFormData(prev => ({ ...prev, [name]: formatCpf(value) }));
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
            
            // Create a new object for files to send to n8n
            const filesToSubmit = { ...fileObjects, [name]: file };

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
                <button type="button" className={`${getButtonClass(hasFile(frontName))} p-2 text-sm`}>
                    <FileUploadDisplay isPresent={hasFile(frontName)} text={t('frente')} />
                    <input type="file" name={frontName} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                </button>
                 <button type="button" className={`${getButtonClass(hasFile(backName))} p-2 text-sm`}>
                    <FileUploadDisplay isPresent={hasFile(backName)} text={t('verso')} />
                    <input type="file" name={backName} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                </button>
            </div>
        </div>
    );
    
    const singleUploadButton = (titleKey: string, name: keyof SaleData) => (
         <button type="button" className={`${getButtonClass(hasFile(name))} p-3 text-sm`}>
            <FileUploadDisplay isPresent={hasFile(name)} text={t(titleKey)} />
            <input type="file" name={name} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
        </button>
    );
    
    const fileUploadButton = (label: string, name: keyof SaleData) => (
        <button type="button" className={`${getButtonClass(hasFile(name))} p-2 text-xs`}>
            <FileUploadDisplay isPresent={hasFile(name)} text={label} />
            <input type="file" name={name} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
        </button>
    );


    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-lg space-y-6">
            
            <Fieldset legend={t('clientDetails')}>
                <div className="relative">
                     <Input 
                        label={t('cpf')} 
                        id="clientCpf" 
                        name="clientCpf" 
                        value={formData.clientCpf} 
                        onChange={handleChange} 
                        onBlur={handleCpfBlur} 
                        placeholder={isInitialLoading ? t('loading_clients') : "000.000.000-00"}
                        disabled={isSearchingCpf || isEditMode || isInitialLoading}
                        aria-describedby="cpf-search-status"
                    />
                    {(isSearchingCpf || isInitialLoading) && (
                        <div className="absolute right-3 top-9" role="status" id="cpf-search-status">
                            <span className="sr-only">{t('searchCpf')}</span>
                            <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}
                </div>
                <Input label={t('sobrenomeENome')} id="clientFullName" name="clientFullName" value={formData.clientFullName} onChange={handleChange} placeholder={t('placeholder_clientName')} />
                <Input label={t('telefone')} id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder={t('placeholder_phone')} />
                <Input label={t('purchaseDate')} id="purchaseDate" name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} />
            </Fieldset>
            
            <Fieldset legend={t('saleDetails')}>
                <Input label={t('produtos')} id="product" name="product" value={formData.product} onChange={handleChange} wrapperClass="md:col-span-2" placeholder={t('placeholder_product')} />
                 <Input as="select" label={t('paymentSystem')} id="paymentSystem" name="paymentSystem" value={formData.paymentSystem} onChange={handleChange}>
                    {PAYMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{t(opt.toLowerCase())}</option>)}
                </Input>
                <Input label={t('paymentStartDate')} id="paymentStartDate" name="paymentStartDate" type="date" value={formData.paymentStartDate} onChange={handleChange} />

                 <Input label={t('totalProductPrice')} id="totalProductPrice" name="totalProductPrice" type="number" min="0" step="0.01" value={formData.totalProductPrice} onChange={handleChange} placeholder="1250.00" />
                 <Input label={t('downPayment')} id="downPayment" name="downPayment" type="number" min="0" step="0.01" value={formData.downPayment} onChange={handleChange} placeholder="250.00" />
                 <Input label={t('installments')} id="installments" name="installments" type="number" min="1" value={formData.installments} onChange={handleChange} placeholder="10" />
                 <Input label={t('installmentPrice')} id="installmentPrice" name="installmentPrice" type="number" value={formData.installmentPrice.toFixed(2)} readOnly disabled />

                 <Input label={t('storeName')} id="storeName" name="storeName" value={formData.storeName} onChange={handleChange} placeholder={t('placeholder_storeName')} />
                 <Input label={t('vendedor')} id="vendedor" name="vendedor" value={formData.vendedor} onChange={handleChange} placeholder={t('placeholder_vendedor')}/>
                 <Input label={t('guarantor')} id="guarantor" name="guarantor" value={formData.guarantor} onChange={handleChange} placeholder={t('placeholder_guarantor')} />
                
                 <Input as="select" label={t('clientType')} id="clientType" name="clientType" value={formData.clientType} onChange={handleChange}>
                    <option value="">{t('placeholder_select')}</option>
                    {CLIENT_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{t(opt)}</option>)}
                </Input>
                
                <Input as="select" label={t('language')} id="language" name="language" value={formData.language} onChange={handleChange} required>
                    <option value="">{t('placeholder_select')}</option>
                    <option value="es">{t('espanol')}</option>
                    <option value="pt">{t('portugues')}</option>
                </Input>
            </Fieldset>
            
            <Fieldset legend={t('locations')}>
                 <Input label={t('localizacaoTrab')} id="workLocation" name="workLocation" value={formData.workLocation} onChange={handleChange} placeholder={t('placeholder_location')} />
                 <Input label={t('enderecoTrab')} id="workAddress" name="workAddress" value={formData.workAddress} onChange={handleChange} placeholder={t('placeholder_address')} />
                 <Input label={t('localizacaoCasa')} id="homeLocation" name="homeLocation" value={formData.homeLocation} onChange={handleChange} placeholder={t('placeholder_location')} />
                 <Input label={t('enderecoCasa')} id="homeAddress" name="homeAddress" value={formData.homeAddress} onChange={handleChange} placeholder={t('placeholder_address')} />
            </Fieldset>

            <Fieldset legend={t('references')}>
                <Input label={t('reference1Name')} id="reference1Name" name="reference1Name" value={formData.reference1Name} onChange={handleChange} placeholder={t('placeholder_refName')} />
                <Input label={t('reference1Relationship')} id="reference1Relationship" name="reference1Relationship" value={formData.reference1Relationship} onChange={handleChange} placeholder={t('placeholder_refRelationship')} />
                <Input label={t('reference2Name')} id="reference2Name" name="reference2Name" value={formData.reference2Name} onChange={handleChange} placeholder={t('placeholder_refName')} />
                <Input label={t('reference2Relationship')} id="reference2Relationship" name="reference2Relationship" value={formData.reference2Relationship} onChange={handleChange} placeholder={t('placeholder_refRelationship')} />
            </Fieldset>
            
            <Fieldset legend={t('photos')}>
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {singleUploadButton('fotoLoja', 'photoStoreFileName')}
                    {singleUploadButton('fotoCasa', 'photoHomeFileName')}
                    {singleUploadButton('fotoCodigoTelefono', 'photoPhoneCodeFileName')}
                    {singleUploadButton('instagramFace', 'photoInstagramFileName')}
                    {twoSidedUpload('fotoContrato', 'photoContractFrontFileName', 'photoContractBackFileName')}
                    <div className="relative p-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg flex flex-col">
                        <span className="block text-sm font-medium text-center text-slate-700 dark:text-slate-300 mb-2">{t('fotoDocumentos')}</span>
                        <div className="grid grid-cols-3 gap-2 mt-auto">
                            {fileUploadButton(t('frente'), 'photoIdFrontFileName')}
                            {fileUploadButton(t('verso'), 'photoIdBackFileName')}
                            {fileUploadButton(t('cpfPhoto'), 'photoCpfFileName')}
                        </div>
                    </div>
                </div>
            </Fieldset>

            <Fieldset legend={t('obs')}>
                 <Input as="textarea" id="notes" name="notes" value={formData.notes} onChange={handleChange} wrapperClass="md:col-span-2" rows={4} placeholder={t('placeholder_notes')} />
            </Fieldset>

            {/* Error Message Display */}
            {error && (
                <div ref={errorRef} className="my-2 p-4 bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 rounded-r-lg shadow-md" role="alert">
                    <p className="font-bold">{t('errorPrefix')}</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Submission Buttons */}
            <div className="pt-4 flex justify-end space-x-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-6 py-3 border border-slate-300 text-base font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                >
                    {t('cancel')}
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-not-allowed min-w-[200px]"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{loadingMessage || t('loading')}</span>
                        </>
                    ) : (
                        isEditMode ? t('saveChanges') : t('submitNewClient')
                    )}
                </button>
            </div>
        </form>
    );
};
