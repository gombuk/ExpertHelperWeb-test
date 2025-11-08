
import React from 'react';
import { View, AppMode } from '../App';

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


interface HeaderProps {
    setCurrentView: (view: View) => void;
    activeMode: AppMode;
    setActiveMode: (mode: AppMode) => void;
    // Removed onOpenSheetsSync prop
    // onOpenSheetsSync: () => void;
}

const Header: React.FC<HeaderProps> = ({ setCurrentView, activeMode, setActiveMode }) => {
    
    const baseButtonClass = "px-4 py-2 text-sm font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";
    // FIX: Renamed variable to use only ASCII characters to avoid potential issues with build tools.
    const activeConclusionClass = activeMode === 'conclusions' ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300";
    const activeSertifikatClass = activeMode === 'certificates' ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300";

    return (
        <header className="flex flex-col justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">ExpertHelper Web</h1>
                <p className="text-gray-500 mt-1">Управління експертними висновками та сертифікатами походження</p>
            </div>

            <div className="w-full flex flex-col md:flex-row justify-between items-center mt-6 border-t border-gray-200 pt-4">
                <div className="flex items-center bg-gray-200 p-1 rounded-lg">
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
                    <button 
                        onClick={() => setCurrentView('plan')}
                        className="flex items-center px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors">
                        <PlanIcon />
                        План
                    </button>
                    <button 
                        onClick={() => setCurrentView('firms')}
                        className="flex items-center px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors">
                        <FirmsIcon />
                        Фірми
                    </button>
                    <button 
                        onClick={() => setCurrentView('settings')}
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                        <SettingsIcon />
                        Налаштування
                    </button>
                     {/* Removed Google Sheets Sync Button */}
                    {/* <button 
                        onClick={onOpenSheetsSync}
                        className="flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors">
                        <GoogleSheetsIcon />
                        Синхронізація з Sheets
                    </button> */}
                </nav>
            </div>
        </header>
    );
};

export default Header;