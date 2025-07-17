

import React, { useState, useMemo } from 'react';
import { SaleData, ClientStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ClientListPageProps {
    clients: SaleData[];
    onEdit: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string, name: string) => void;
    onGenerateSummary: (id: string) => void;
    generatingSummaryId: string | null;
    onRefresh: () => void;
    isRefreshing: boolean;
    onUpdateStatus: (client: SaleData, newStatus: ClientStatus) => void;
    updatingStatusId: string | null;
}

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const SummaryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const FlagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
);

const LoadingSpinnerIcon = () => (
    <svg className="animate-spin h-5 w-5 mr-1.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
    </svg>
);

const NewPlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);


export const ClientListPage: React.FC<ClientListPageProps> = ({ clients, onEdit, onNew, onDelete, onGenerateSummary, generatingSummaryId, onRefresh, isRefreshing, onUpdateStatus, updatingStatusId }) => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');

    const normalizeCpf = (cpf: string) => (cpf || '').replace(/\D/g, '');

    const filteredClients = useMemo(() => {
        if (!searchTerm.trim()) {
            return clients;
        }
        const normalizedSearchTerm = normalizeCpf(searchTerm);
        if (!normalizedSearchTerm) return clients;
        
        return clients.filter(client =>
            normalizeCpf(client.clientCpf).includes(normalizedSearchTerm)
        );
    }, [clients, searchTerm]);

    const handleStatusChange = (client: SaleData) => {
        const newStatus = client.clientStatus === 'apto' ? 'no_apto' : 'apto';
        onUpdateStatus(client, newStatus);
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('clientListTitle')}</h1>
                <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-md hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 min-w-[140px]"
                        title={isRefreshing ? t('refreshing') : t('refreshButton')}
                    >
                        {isRefreshing ? (
                            <svg className="animate-spin h-5 w-5 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <RefreshIcon />
                        )}
                        <span>{isRefreshing ? t('refreshing') : t('refreshButton')}</span>
                    </button>
                    <button
                        onClick={onNew}
                        className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <NewPlusIcon />
                        {t('newButton')}
                    </button>
                </div>
            </div>
            
            <div className="mb-6">
                 <input
                    type="text"
                    placeholder={t('searchPlaceholderCpf')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-sm px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    aria-label={t('searchPlaceholderCpf')}
                />
            </div>

            {clients.length > 0 && filteredClients.length === 0 ? (
                 <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                    {t('noClientsFound')}
                </p>
            ) : clients.length === 0 && !isRefreshing ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                    {t('noClients')}
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t('colCpf')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t('sobrenomeENome')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t('colProduct')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t('colTotal')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t('colPaymentSystem')}</th>
                                <th scope="col" className="relative px-6 py-3 text-right">
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t('actions')}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredClients.map((client) => (
                                <tr key={client.id} className={`${client.clientStatus === 'no_apto' ? 'bg-red-50 dark:bg-red-900/20' : ''} hover:bg-slate-50 dark:hover:bg-slate-700/50`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                        {client.clientCpf}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="text-sm font-medium text-slate-900 dark:text-white">{client.clientFullName}</span>
                                            {client.clientStatus === 'no_apto' && (
                                                <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-red-800 bg-red-200 dark:bg-red-800 dark:text-red-100 rounded-full">{t('status_no_apto')}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-900 dark:text-slate-300">{client.product}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200">
                                        R$ {(client.totalProductPrice ?? 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                        {t(client.paymentSystem?.toLowerCase() ?? '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                                            <button 
                                                onClick={() => handleStatusChange(client)}
                                                disabled={!!updatingStatusId || !client.clientCpf}
                                                className={`inline-flex items-center justify-center p-2 border border-transparent text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed
                                                    ${client.clientStatus === 'no_apto' 
                                                        ? 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900' 
                                                        : 'text-amber-700 bg-amber-100 hover:bg-amber-200 focus:ring-amber-500 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900'}`}
                                                title={client.clientStatus === 'apto' ? t('mark_as_not_apt') : t('mark_as_apt')}
                                            >
                                                {updatingStatusId === client.id ? <LoadingSpinnerIcon /> : <FlagIcon />}
                                            </button>
                                            <button 
                                                onClick={() => onGenerateSummary(client.id)} 
                                                disabled={!!generatingSummaryId}
                                                className="inline-flex items-center justify-center p-2 border border-transparent text-sm leading-4 font-medium rounded-md text-sky-700 bg-sky-100 hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:bg-sky-900/50 dark:text-sky-300 dark:hover:bg-sky-900 disabled:opacity-60 disabled:cursor-not-allowed"
                                                title={t('generateSummaryButton')}
                                            >
                                                {generatingSummaryId === client.id ? <LoadingSpinnerIcon /> : <SummaryIcon />}
                                            </button>
                                            <button onClick={() => onEdit(client.id)} className="inline-flex items-center p-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900" title={t('editButton')}>
                                                <EditIcon />
                                            </button>
                                            <button onClick={() => onDelete(client.id, client.clientFullName)} className="inline-flex items-center p-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900" title={t('deleteButton')}>
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
