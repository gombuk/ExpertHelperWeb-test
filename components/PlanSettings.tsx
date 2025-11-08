
import React, { useState, useEffect } from 'react';
import type { ExpertPlan, MonthlyPlan } from '../types';
import type { View } from '../App';

interface PlanSettingsProps {
    setCurrentView: (view: View) => void;
    monthlyPlans: Record<string, MonthlyPlan>;
    setMonthlyPlans: (newPlans: Record<string, MonthlyPlan>) => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

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

const PlanSettings: React.FC<PlanSettingsProps> = ({ setCurrentView, monthlyPlans, setMonthlyPlans, showToast }) => {
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const months = Object.keys(monthlyPlans).sort((a, b) => b.localeCompare(a));
        return months.length > 0 ? months[0] : new Date().toISOString().slice(0, 7);
    });
    const [newExpertName, setNewExpertName] = useState('');

    useEffect(() => {
        if (Object.keys(monthlyPlans).length > 0 && !monthlyPlans[selectedMonth]) {
            const months = Object.keys(monthlyPlans).sort((a, b) => b.localeCompare(a));
            setSelectedMonth(months[0]);
        }
    }, [monthlyPlans, selectedMonth]);


    const currentPlan = monthlyPlans[selectedMonth] || { totalPlan: 0, expertPlans: [] };

    const updateCurrentMonthPlan = (updatedPlan: Partial<MonthlyPlan>) => {
        const newPlans = {
            ...monthlyPlans,
            [selectedMonth]: {
                ...(monthlyPlans[selectedMonth] || { totalPlan: 0, expertPlans: [] }),
                ...updatedPlan,
            },
        };
        setMonthlyPlans(newPlans);
    };

    const handleTotalPlanChange = (value: string) => {
        updateCurrentMonthPlan({ totalPlan: Number(value) || 0 });
    };

    const handleAddExpert = () => {
        if (newExpertName.trim() === '') return;
        const newExpert: ExpertPlan = {
            id: Date.now(),
            name: newExpertName,
            planAmount: '',
        };
        updateCurrentMonthPlan({ expertPlans: [...currentPlan.expertPlans, newExpert] });
        setNewExpertName('');
    };

    const handleDeleteExpert = (id: number) => {
        const updatedExpertPlans = currentPlan.expertPlans.filter(expert => expert.id !== id);
        updateCurrentMonthPlan({ expertPlans: updatedExpertPlans });
    };

    const handlePlanChange = (id: number, value: string) => {
        const updatedExpertPlans = currentPlan.expertPlans.map(expert => 
            expert.id === id ? { ...expert, planAmount: value } : expert
        );
        updateCurrentMonthPlan({ expertPlans: updatedExpertPlans });
    };

    const handleSaveChanges = () => {
        // Data is already saved via live updates. This button is for user confirmation.
        showToast('Дані збережено');
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md max-w-4xl mx-auto">
            <button onClick={() => setCurrentView('dashboard')} className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
                <BackArrowIcon />
                Повернутися назад
            </button>
            
            <h1 className="text-2xl font-bold mb-8">Налаштування місячного плану</h1>

            <div className="space-y-6">
                <div>
                    <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">Виберіть місяць</label>
                    <input type="month" id="month-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <div>
                    <label htmlFor="total-plan" className="block text-sm font-medium text-gray-700 mb-1">Загальний місячний план (грн)</label>
                    <input type="number" id="total-plan" value={currentPlan.totalPlan} onChange={e => handleTotalPlanChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                
                <div className="pt-4">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                        <h2 className="text-lg font-semibold">Плани експертів</h2>
                        <div className="flex items-center space-x-2">
                            <input 
                                type="text" 
                                placeholder="Ім'я експерта"
                                value={newExpertName}
                                onChange={(e) => setNewExpertName(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 w-48" 
                            />
                            <button 
                                onClick={handleAddExpert}
                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                            >
                               <span className="text-xl mr-2 font-light">+</span> Додати
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {currentPlan.expertPlans.map(expert => (
                            <div key={expert.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-between gap-4">
                                <div className="flex-grow">
                                    <label htmlFor={`expert-plan-${expert.id}`} className="block text-sm font-medium text-gray-900 mb-1">{expert.name}</label>
                                    <input 
                                        type="number" 
                                        id={`expert-plan-${expert.id}`}
                                        value={expert.planAmount}
                                        onChange={(e) => handlePlanChange(expert.id, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                                    />
                                </div>
                                <button onClick={() => handleDeleteExpert(expert.id)} className="self-end mb-2 focus:outline-none">
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button 
                    onClick={handleSaveChanges}
                    className="flex items-center justify-center px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    <SaveIcon />
                    Зберегти план
                </button>
            </div>
        </div>
    );
};

export default PlanSettings;