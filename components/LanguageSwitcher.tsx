import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();

    const buttonClasses = (lang: 'es' | 'pt') =>
        `px-3 py-1 text-sm font-bold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white ${
            language === lang
                ? 'bg-white text-slate-800'
                : 'bg-transparent text-white hover:bg-slate-700'
        }`;

    return (
        <div className="flex items-center space-x-2 p-1 bg-slate-700 rounded-lg">
            <button onClick={() => setLanguage('es')} className={buttonClasses('es')}>
                {t('es')}
            </button>
            <button onClick={() => setLanguage('pt')} className={buttonClasses('pt')}>
                {t('pt')}
            </button>
        </div>
    );
};
