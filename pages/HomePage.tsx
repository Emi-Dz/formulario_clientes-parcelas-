import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const NewClientIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
);

const ViewListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
);

interface HomePageProps {
    onNewClient: () => void;
    onViewClients: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNewClient, onViewClients }) => {
    const { t } = useLanguage();

    return (
        <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">{t('welcome')}</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-12">{t('welcomeSubtitle')}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <button
                    onClick={onNewClient}
                    className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <NewClientIcon />
                    <span className="text-xl font-semibold">{t('home_newClient')}</span>
                </button>
                <button
                    onClick={onViewClients}
                    className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 text-teal-600 dark:text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                    <ViewListIcon />
                    <span className="text-xl font-semibold">{t('home_viewClients')}</span>
                </button>
            </div>
        </div>
    );
};