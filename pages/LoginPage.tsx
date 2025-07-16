
import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface LoginPageProps {
    onLogin: (password: string) => boolean;
    onCancel: () => void;
}

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onCancel }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { t } = useLanguage();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = onLogin(password);
        if (!success) {
            setError(t('loginError'));
            setPassword('');
        }
    };

    return (
        <div className="flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl px-8 pt-10 pb-8 mb-4">
                    <div className="flex justify-center mb-6">
                        <LockIcon />
                    </div>
                    <h1 className="text-center text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('loginTitle')}</h1>
                    <p className="text-center text-slate-500 dark:text-slate-400 mb-8">{t('welcomeSubtitle')}</p>
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}
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
                            autoFocus
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row-reverse gap-3">
                         <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition-colors"
                        >
                            {t('loginButton')}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition-colors"
                        >
                            {t('cancel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
