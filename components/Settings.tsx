
import React, { useState, useEffect } from 'react';
import type { CostModelRow, GeneralSettings } from '../types';
import type { View, AppMode } from '../App';

const BackArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 hover:text-red-700 cursor-pointer" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3l-4 4-4-4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3" />
    </svg>
);

interface SettingsProps {
    setCurrentView: (view: View) => void;
    generalSettings: GeneralSettings;
    setGeneralSettings: (settings: GeneralSettings) => void;
    costModelTable: CostModelRow[];
    setCostModelTable: (table: CostModelRow[]) => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
    activeMode: AppMode;
}

const Settings: React.FC<SettingsProps> = ({ 
    setCurrentView,
    generalSettings,
    setGeneralSettings,
    costModelTable,
    setCostModelTable,
    showToast,
    activeMode
}) => {
    const [localGeneralSettings, setLocalGeneralSettings] = useState(generalSettings);
    const [localCostModelTable, setLocalCostModelTable] = useState(costModelTable);

    useEffect(() => {
        setLocalGeneralSettings(generalSettings);
    }, [generalSettings]);

    useEffect(() => {
        setLocalCostModelTable(costModelTable);
    }, [costModelTable]);

    const [newModelCount, setNewModelCount] = useState('');

    const handleAddRow = () => {
        if (!newModelCount || isNaN(Number(newModelCount)) || Number(newModelCount) <= 0) {
            return;
        }
        const newRow: CostModelRow = {
            id: Date.now(),
            models: Number(newModelCount),
            upTo10: '',
            upTo20: '',
            upTo50: '',
            plus51: '',
        };
        setLocalCostModelTable([...localCostModelTable, newRow]);
        setNewModelCount('');
    };

    const handleDeleteRow = (id: number) => {
        setLocalCostModelTable(localCostModelTable.filter(row => row.id !== id));
    };
    
    const handleCostTableInputChange = (id: number, field: keyof Omit<CostModelRow, 'id' | 'models'>, value: string) => {
        setLocalCostModelTable(localCostModelTable.map(row => row.id === id ? { ...row, [field]: value } : row));
    };
    
    const handleGeneralSettingsChange = (field: keyof GeneralSettings, value: string) => {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
            setLocalGeneralSettings(prev => ({ ...prev, [field]: numValue }));
        }
    };

    const handleSaveChanges = () => {
        setGeneralSettings(localGeneralSettings);
        setCostModelTable(localCostModelTable);
        showToast('Дані оновлено');
    };


    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md dark:bg-gray-800 dark:text-gray-100">
            <button onClick={() => setCurrentView('dashboard')} className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 dark:text-gray-300 hover:dark:text-white">
                <BackArrowIcon />
                Повернутися назад
            </button>

            <h1 className="text-2xl font-bold mb-6 dark:text-white">Налаштування вартості</h1>

            {activeMode === 'conclusions' ? (
                <>
                    <section>
                        <h2 className="text-lg font-semibold mb-4 dark:text-white">Загальні параметри (Висновки)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="codeCost" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Вартість коду (грн)</label>
                                <input type="number" id="codeCost" value={localGeneralSettings.codeCost || ''} onChange={(e) => handleGeneralSettingsChange('codeCost', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Знижка (%)</label>
                                <input type="number" id="discount" value={localGeneralSettings.discount || ''} onChange={(e) => handleGeneralSettingsChange('discount', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label htmlFor="complexity" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Складність (%)</label>
                                <input type="number" id="complexity" value={localGeneralSettings.complexity || ''} onChange={(e) => handleGeneralSettingsChange('complexity', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Терміновість (%)</label>
                                <input type="number" id="urgency" value={localGeneralSettings.urgency} onChange={(e) => handleGeneralSettingsChange('urgency', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label htmlFor="contractualPageCost" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Вартість сторінки (договірний, грн)</label>
                                <input type="number" id="contractualPageCost" value={localGeneralSettings.contractualPageCost || ''} onChange={(e) => handleGeneralSettingsChange('contractualPageCost', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                        </div>
                    </section>
                    <section className="mt-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                            <h2 className="text-lg font-semibold dark:text-white">Вартість моделей за кількістю позицій</h2>
                            <div className="flex items-center space-x-2">
                                <input 
                                type="number" 
                                placeholder="Кількість моделей" 
                                value={newModelCount}
                                onChange={(e) => setNewModelCount(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                                />
                                <button 
                                onClick={handleAddRow}
                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                <span className="text-xl mr-2 font-light">+</span> Додати
                                </button>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto border border-gray-200 rounded-lg dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">Кількість моделей</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">До 10 позицій (грн)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">11-20 позицій (грн)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">21-50 позицій (грн)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">51+ позицій (грн)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">Дії</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                    {localCostModelTable.map((row) => (
                                        <tr key={row.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{row.models}</td>
                                            <td className="px-6 py-4"><input type="number" value={row.upTo10} onChange={(e) => handleCostTableInputChange(row.id, 'upTo10', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"/></td>
                                            <td className="px-6 py-4"><input type="number" value={row.upTo20} onChange={(e) => handleCostTableInputChange(row.id, 'upTo20', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"/></td>
                                            <td className="px-6 py-4"><input type="number" value={row.upTo50} onChange={(e) => handleCostTableInputChange(row.id, 'upTo50', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"/></td>
                                            <td className="px-6 py-4"><input type="number" value={row.plus51} onChange={(e) => handleCostTableInputChange(row.id, 'plus51', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"/></td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => handleDeleteRow(row.id)} className="focus:outline-none"><TrashIcon /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            ) : (
                <>
                <section>
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2 dark:text-white dark:border-gray-700">Вартість: Повністю вироблений в Україні</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div>
                            <label htmlFor="fullyProduced_upTo20PagesCost" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Вартість (до 20 сторінок)</label>
                            <input type="number" id="fullyProduced_upTo20PagesCost" value={localGeneralSettings.fullyProduced_upTo20PagesCost || ''} onChange={(e) => handleGeneralSettingsChange('fullyProduced_upTo20PagesCost', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                         <div>
                            <label htmlFor="fullyProduced_from21To200PagesCost" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Вартість (21-200 сторінок)</label>
                            <input type="number" id="fullyProduced_from21To200PagesCost" value={localGeneralSettings.fullyProduced_from21To200PagesCost || ''} onChange={(e) => handleGeneralSettingsChange('fullyProduced_from21To200PagesCost', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="fullyProduced_plus201PagesCost" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Вартість (201+ сторінок)</label>
                            <input type="number" id="fullyProduced_plus201PagesCost" value={localGeneralSettings.fullyProduced_plus201PagesCost || ''} onChange={(e) => handleGeneralSettingsChange('fullyProduced_plus201PagesCost', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                         <div>
                            <label htmlFor="fullyProduced_additionalPositionCost" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Вартість дод. позиції</label>
                            <input type="number" id="fullyProduced_additionalPositionCost" value={localGeneralSettings.fullyProduced_additionalPositionCost || ''} onChange={(e) => handleGeneralSettingsChange('fullyProduced_additionalPositionCost', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                    </div>
                </section>

                <section className="mt-8">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2 dark:text-white dark:border-gray-700">Вартість: Достатня обробка/переробка</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div>
                            <label htmlFor="sufficientProcessing_upTo20PagesCost" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Вартість (до 20 сторінок)</label>
                            <input type="number" id="sufficientProcessing_upTo20PagesCost" value={localGeneralSettings.sufficientProcessing_upTo20PagesCost || ''} onChange={(e) => handleGeneralSettingsChange('sufficientProcessing_upTo20PagesCost', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                         <div>
                            <label htmlFor="sufficientProcessing_from21To200PagesCost" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Вартість (21-200 сторінок)</label>
                            <input type="number" id="sufficientProcessing_from21To200PagesCost" value={localGeneralSettings.sufficientProcessing_from21To200PagesCost || ''} onChange={(e) => handleGeneralSettingsChange('sufficientProcessing_from21To200PagesCost', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="sufficientProcessing_plus201PagesCost" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Вартість (201+ сторінок)</label>
                            <input type="number" id="sufficientProcessing_plus201PagesCost" value={localGeneralSettings.sufficientProcessing_plus201PagesCost || ''} onChange={(e) => handleGeneralSettingsChange('sufficientProcessing_plus201PagesCost', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                         <div>
                            <label htmlFor="sufficientProcessing_additionalPositionCost" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Вартість дод. позиції</label>
                            <input type="number" id="sufficientProcessing_additionalPositionCost" value={localGeneralSettings.sufficientProcessing_additionalPositionCost || ''} onChange={(e) => handleGeneralSettingsChange('sufficientProcessing_additionalPositionCost', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                    </div>
                </section>
                 <section className="mt-8">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2 dark:text-white dark:border-gray-700">Вартість спеціальних послуг</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                        <div>
                            <label htmlFor="replacementCost" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Вартість (Замінний)</label>
                            <input type="number" id="replacementCost" value={localGeneralSettings.replacementCost || ''} onChange={(e) => handleGeneralSettingsChange('replacementCost', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="reissuanceCost" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Вартість (Переоформлення)</label>
                            <input type="number" id="reissuanceCost" value={localGeneralSettings.reissuanceCost || ''} onChange={(e) => handleGeneralSettingsChange('reissuanceCost', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="duplicateCost" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Вартість (Дублікат)</label>
                            <input type="number" id="duplicateCost" value={localGeneralSettings.duplicateCost || ''} onChange={(e) => handleGeneralSettingsChange('duplicateCost', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                    </div>
                </section>
                
                <section className="mt-8">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2 dark:text-white dark:border-gray-700">Загальні параметри (Сертифікати)</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div>
                            <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Терміновість (%)</label>
                            <input type="number" id="urgency" value={localGeneralSettings.urgency} onChange={(e) => handleGeneralSettingsChange('urgency', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="additionalPageCost" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Вартість дод. аркуша (грн)</label>
                            <input type="number" id="additionalPageCost" value={localGeneralSettings.additionalPageCost || ''} onChange={(e) => handleGeneralSettingsChange('additionalPageCost', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                    </div>
                </section>
                </>
            )}

            <div className="mt-8 flex justify-end">
                <button 
                    onClick={handleSaveChanges}
                    className="flex items-center justify-center px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    <SaveIcon />
                    Зберегти налаштування
                </button>
            </div>
        </div>
    );
};

export default Settings;
