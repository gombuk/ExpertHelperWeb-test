import React from 'react';
import { View, AppMode } from '../App';
import { Theme, CurrentUser } from '../types';

const PlanIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const FirmsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 2 0 011 1v5m-4 0h4" />
    </svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.325 6.325l-.707-.707M6.325 6.325l-.707-.707M18.325 6.325l-.707.707M6.325 18.325l-.707.707M12 18a6 6 0 100-12 6 6 0 000 12z" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H9a4 4 0 01-4-4V10a4 4 0 014-4h6a4 4 0 014 4v7a4 4 0 01-4 4z" />
    </svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6-11v1.5a2.5 2.5 0 01-5 0V5m10 0v1.5a2.5 2.5 0 00-5 0V5" />
    </svg>
);

interface HeaderProps {
    setCurrentView: (view: View) => void;
    activeMode: AppMode;
    setActiveMode: (mode: AppMode) => void;
    theme: Theme;
    toggleTheme: () => void;
    currentUser: CurrentUser | null;
    onLogout: () => void;
    activeUsers: string[];
}

const Header: React.FC<HeaderProps> = ({ setCurrentView, activeMode, setActiveMode, theme, toggleTheme, currentUser, onLogout, activeUsers }) => {
    
    const baseButtonClass = "px-4 py-2 text-sm font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";
    const activeConclusionClass = activeMode === 'conclusions' ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 hover:dark:bg-gray-500";
    const activeSertifikatClass = activeMode === 'certificates' ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 hover:dark:bg-gray-500";
    const otherActiveUsers = currentUser ? activeUsers.filter(u => u !== currentUser.fullName) : [];

    return (
        <header className="flex flex-col justify-between items-start">
             <div className="w-full flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white cursor-pointer" onClick={() => setCurrentView('dashboard')}>ExpertHelper Web</h1>
                    <p className="text-gray-500 mt-1 dark:text-gray-400">Управління експертними висновками та сертифікатами походження</p>
                </div>
                 {currentUser && (
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                Вітаємо, <span className="font-bold">{currentUser.fullName}</span>!
                            </span>
                            <button
                                onClick={onLogout}
                                className="flex items-center p-2 rounded-lg text-red-500 bg-red-100 hover:bg-red-200 transition-colors dark:text-red-300 dark:bg-red-800 hover:dark:bg-red-700"
                                title="Вийти з системи"
                            >
                                <LogoutIcon />
                            </button>
                        </div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200 h-4">
                            {otherActiveUsers.length > 0 ? (
                                <span>
                                    Зараз разом з Вами працює: {otherActiveUsers.join(', ')}
                                </span>
                            ) : (
                                <span>На жаль, зараз з додатком працюєте лише Ви</span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="w-full flex flex-col md:flex-row justify-between items-center mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
                <div className="flex items-center bg-gray-200 p-1 rounded-lg dark:bg-gray-700">
                    <button 
                        onClick={() => setActiveMode('conclusions')}
                        className={`${baseButtonClass} ${activeConclusionClass}`}
                    >
                        Експертні висновки
                    </button>
                    <button 
                        onClick={() => setActiveMode('certificates')}
                        className={`${baseButtonClass} ${activeSertifikatClass}`}
                    >
                        Сертифікати
                    </button>
                </div>
                
                <nav className="flex items-center flex-wrap gap-2 mt-4 md:mt-0">
                    {currentUser?.role === 'admin' && (
                        <button 
                            onClick={() => setCurrentView('user_management')}
                            className="flex items-center px-4 py-2 text-sm font-medium text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200 transition-colors dark:text-teal-200 dark:bg-teal-800 hover:dark:bg-teal-700">
                            <UserIcon />
                            Користувачі
                        </button>
                    )}
                    <button 
                        onClick={() => setCurrentView('plan')}
                        className="flex items-center px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors dark:text-purple-200 dark:bg-purple-800 hover:dark:bg-purple-700">
                        <PlanIcon />
                        План
                    </button>
                    <button 
                        onClick={() => setCurrentView('firms')}
                        className="flex items-center px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors dark:text-orange-200 dark:bg-orange-800 hover:dark:bg-orange-700">
                        <FirmsIcon />
                        Фірми
                    </button>
                    <button 
                        onClick={() => setCurrentView('settings')}
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors dark:text-gray-100 dark:bg-gray-600 hover:dark:bg-gray-500">
                        <SettingsIcon />
                        Налаштування
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="flex items-center p-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors dark:text-gray-100 dark:bg-gray-600 hover:dark:bg-gray-500"
                        title={theme === 'light' ? 'Увімкнути темний режим' : 'Увімкнути світлий режим'}
                    >
                        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                    </button>
                </nav>
            </div>
        </header>
    );
};

export default Header;