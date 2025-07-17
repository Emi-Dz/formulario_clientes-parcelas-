
import React from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';

const PaperPlaneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z"/>
    </svg>
);

const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);


interface HeaderProps {
    onGoHome: () => void;
    onLogout: () => void;
    isLoggedIn: boolean;
    userRole: UserRole | undefined;
}

export const Header: React.FC<HeaderProps> = ({ onGoHome, onLogout, isLoggedIn, userRole }) => {
    const { t } = useLanguage();
    return (
        <header className="bg-gradient-to-r from-slate-800 to-slate-900 shadow-lg">
            <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <PaperPlaneIcon />
                    <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                        {t('appTitle')}
                    </h1>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                     <LanguageSwitcher />
                    {isLoggedIn && userRole === 'admin' && (
                        <button
                            onClick={onGoHome}
                            className="p-2 rounded-full text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white"
                            aria-label={t('home_viewClients')}
                        >
                            <HomeIcon />
                        </button>
                    )}
                    {isLoggedIn && (
                        <button
                            onClick={onLogout}
                            className="p-2 rounded-full text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white"
                            aria-label={t('logout')}
                        >
                            <LogoutIcon />
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};
