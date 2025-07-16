
import React, { useState, useMemo } from 'react';
import { SaleData } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ClientListPageProps {
    clients: SaleData[];
    onEdit: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string, name: string) => void;
}

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const ClientListPage: React.FC<ClientListPageProps> = ({ clients, onEdit, onNew, onDelete }) => {
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


    return (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('clientListTitle')}</h1>
                <button
                    onClick={onNew}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 self-end sm:self-center"
                >
                    + {t('newButton')}
                </button>
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
            ) : clients.length === 0 ? (
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
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">{t('actions')}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                        {client.clientCpf}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900 dark:text-white">{client.clientFullName}</div>
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
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => onEdit(client.id)} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900">
                                            <EditIcon />
                                            {t('editButton')}
                                        </button>
                                        <button onClick={() => onDelete(client.id, client.clientFullName)} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">
                                            <DeleteIcon />
                                            {t('deleteButton')}
                                        </button>
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
