
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Logo } from '../components/Logo';

interface LoginPageProps {
    onLogin: (username: string, password: string) => Promise<boolean>;
    isLoading: boolean;
    error: string | null;
}

const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isLoading, error: initialError }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(initialError);
    const { t } = useLanguage();

    useEffect(() => {
        setError(initialError);
    }, [initialError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const success = await onLogin(username, password);
        if (!success) {
            setError(t('loginError'));
            setPassword('');
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl px-8 pt-8 pb-8 mb-4">
                    <Logo />
                    <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
                        {t('welcomeSubtitle')}
                    </p>
                    
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="username">
                            {t('usernameLabel')}
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
                            placeholder={t('usernamePlaceholder')}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="password">
                            {t('passwordLabel')}
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
                            required
                        />
                    </div>

                    <div className="flex flex-col">
                         <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <LoadingSpinner /> : t('loginButton')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
