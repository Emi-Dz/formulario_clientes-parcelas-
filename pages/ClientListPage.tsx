
import React, { useState, useMemo } from 'react';
import { SaleData, ClientStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';

// --- Types for Sorting ---
type SortKey = 'clientCpf' | 'clientFullName' | 'purchaseDate' | 'clientStatus';
type SortDirection = 'ascending' | 'descending';
interface SortConfig {
    key: SortKey | null;
    direction: SortDirection;
}

// --- Icons ---
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
    </svg>
);
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);
const SummaryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
const FlagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
);
const LoadingSpinnerIcon = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

// --- Component ---
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

const ClientListPage: React.FC<ClientListPageProps> = ({ clients, onEdit, onNew, onDelete, onGenerateSummary, generatingSummaryId, onRefresh, isRefreshing, onUpdateStatus, updatingStatusId }) => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'purchaseDate', direction: 'descending' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const normalizeCpf = (cpf: string) => (cpf || '').replace(/\D/g, '');

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const processedClients = useMemo(() => {
        let filteredItems = [...clients];

        if (searchTerm.trim()) {
            const normalizedSearchTerm = normalizeCpf(searchTerm);
            if (normalizedSearchTerm) {
                filteredItems = clients.filter(client =>
                    normalizeCpf(client.clientCpf).includes(normalizedSearchTerm)
                );
            }
        }
        
        if (sortConfig.key) {
            filteredItems.sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return filteredItems;
    }, [clients, searchTerm, sortConfig]);

    const totalPages = Math.ceil(processedClients.length / itemsPerPage);
    const paginatedClients = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedClients.slice(startIndex, startIndex + itemsPerPage);
    }, [processedClients, currentPage, itemsPerPage]);

    const handleStatusChange = (client: SaleData) => {
        const newStatus = client.clientStatus === 'apto' ? 'no_apto' : 'apto';
        onUpdateStatus(client, newStatus);
    };

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const SortableHeader: React.FC<{ sortKey: SortKey, label: string, className?: string }> = ({ sortKey, label, className = '' }) => {
        const isActive = sortConfig.key === sortKey;
        return (
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider ${className}`}>
                <button className="flex items-center gap-1 group" onClick={() => requestSort(sortKey)}>
                    {label}
                    <span className="opacity-30 group-hover:opacity-100 transition-opacity">
                        {isActive ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                    </span>
                </button>
            </th>
        );
    };

    const ActionButtons = ({ client }: { client: SaleData }) => (
        <div className="flex items-center justify-end gap-2 flex-wrap">
            <button 
                onClick={() => handleStatusChange(client)}
                disabled={!!updatingStatusId || !client.clientCpf || isRefreshing}
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
                disabled={!!generatingSummaryId || isRefreshing}
                className="inline-flex items-center justify-center p-2 border border-transparent text-sm leading-4 font-medium rounded-md text-sky-700 bg-sky-100 hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:bg-sky-900/50 dark:text-sky-300 dark:hover:bg-sky-900 disabled:opacity-60 disabled:cursor-not-allowed"
                title={t('generateSummaryButton')}
            >
                {generatingSummaryId === client.id ? <LoadingSpinnerIcon /> : <SummaryIcon />}
            </button>
            <button onClick={() => onEdit(client.id)} disabled={isRefreshing} className="inline-flex items-center p-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900 disabled:opacity-60 disabled:cursor-not-allowed" title={t('editButton')}>
                <EditIcon />
            </button>
            <button onClick={() => onDelete(client.id, client.clientFullName)} disabled={isRefreshing} className="inline-flex items-center p-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 disabled:opacity-60 disabled:cursor-not-allowed" title={t('deleteButton')}>
                <DeleteIcon />
            </button>
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-800 p-4 md:p-8 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('clientListTitle')}</h1>
                <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-md hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 min-w-[140px]"
                        title={isRefreshing ? t('refreshing') : t('refreshButton')}
                    >
                        {isRefreshing ? <LoadingSpinnerIcon /> : <RefreshIcon />}
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
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full max-w-sm px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    aria-label={t('searchPlaceholderCpf')}
                />
            </div>

            {processedClients.length === 0 && searchTerm ? (
                 <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                    {t('noClientsFound')}
                </p>
            ) : clients.length === 0 && !isRefreshing ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                    {t('noClients')}
                </p>
            ) : (
                <>
                {/* Mobile Card View */}
                <div className="space-y-4 md:hidden">
                    {paginatedClients.map((client) => (
                        <div key={client.id} className={`p-4 rounded-lg shadow-md border ${client.clientStatus === 'no_apto' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white pr-2">{client.clientFullName}</h3>
                                {client.clientStatus === 'apto' ? (
                                    <span className="px-2 py-1 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full dark:bg-green-800 dark:text-green-100 shrink-0">{t('status_apto')}</span>
                                ) : (
                                    <span className="px-2 py-1 text-xs font-semibold leading-5 text-red-800 bg-red-100 rounded-full dark:bg-red-800 dark:text-red-100 shrink-0">{t('status_no_apto')}</span>
                                )}
                            </div>
                            <div className="space-y-2 text-sm border-t border-slate-200 dark:border-slate-700 pt-3 mb-4">
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-500 dark:text-slate-400">{t('colCpf')}:</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-mono">{client.clientCpf}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="font-medium text-slate-500 dark:text-slate-400 shrink-0">{t('colProduct')}:</span>
                                    <span className="text-slate-700 dark:text-slate-300 text-right truncate">{client.product}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-500 dark:text-slate-400">{t('colTotal')}:</span>
                                    <span className="text-slate-700 dark:text-slate-200 font-semibold">R$ {(client.totalProductPrice ?? 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-500 dark:text-slate-400">{t('purchaseDate')}:</span>
                                    <span className="text-slate-500 dark:text-slate-400">{client.purchaseDate}</span>
                                </div>
                            </div>
                            <ActionButtons client={client} />
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                <SortableHeader sortKey="clientFullName" label={t('sobrenomeENome')} className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-700" />
                                <SortableHeader sortKey="clientCpf" label={t('colCpf')} />
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t('colProduct')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t('colTotal')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t('colPaymentSystem')}</th>
                                <SortableHeader sortKey="purchaseDate" label={t('purchaseDate')} />
                                <SortableHeader sortKey="clientStatus" label={t('status')} />
                                <th scope="col" className="relative px-6 py-3 text-right">
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t('actions')}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {paginatedClients.map((client) => (
                                <tr key={client.id} className={`group ${client.clientStatus === 'no_apto' ? 'bg-red-50 dark:bg-red-900/20' : ''} hover:bg-slate-50 dark:hover:bg-slate-700/50`}>
                                    <td className={`sticky left-0 px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white ${client.clientStatus === 'no_apto' ? 'bg-red-50 dark:bg-red-900/30' : 'bg-white dark:bg-slate-800'} group-hover:bg-slate-100 dark:group-hover:bg-slate-700`}>
                                        {client.clientFullName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                        {client.clientCpf}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                                        {client.product}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200">
                                        R$ {(client.totalProductPrice ?? 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                        {t(client.paymentSystem?.toLowerCase() ?? '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                        {client.purchaseDate}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {client.clientStatus === 'apto' ? (
                                            <span className="px-2 py-1 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full dark:bg-green-800 dark:text-green-100">{t('status_apto')}</span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-semibold leading-5 text-red-800 bg-red-100 rounded-full dark:bg-red-800 dark:text-red-100">{t('status_no_apto')}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <ActionButtons client={client} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <label htmlFor="items-per-page" className="text-slate-600 dark:text-slate-300">Items por página:</label>
                        <select
                            id="items-per-page"
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 px-2 py-1"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="15">15</option>
                            <option value="20">20</option>
                        </select>
                    </div>

                    <div className="text-sm text-slate-700 dark:text-slate-300">
                        Página <span className="font-semibold">{currentPage}</span> de <span className="font-semibold">{totalPages}</span> ({processedClients.length} resultados)
                    </div>

                    <div className="flex items-center gap-2">
                         <button 
                            onClick={() => handlePageChange(currentPage - 1)} 
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 dark:border-slate-600"
                        >
                            Anterior
                        </button>
                        <button 
                            onClick={() => handlePageChange(currentPage + 1)} 
                            disabled={currentPage === totalPages || processedClients.length === 0}
                            className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 dark:border-slate-600"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
                </>
            )}
        </div>
    );
};

export default ClientListPage;
