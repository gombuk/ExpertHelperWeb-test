import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import type { Record as AppRecord, CostModelRow, GeneralSettings, MonthlyPlan, CurrentUser } from '../types';
import { calculateCost } from '../utils/calculateCost';
import type { AppMode } from '../App';

const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer dark:text-gray-500 hover:dark:text-gray-400" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

interface StatisticsProps {
    records: AppRecord[];
    costModelTable: CostModelRow[];
    generalSettings: GeneralSettings;
    experts: string[];
    selectedExpert: string;
    setSelectedExpert: (expert: string) => void;
    selectedMonth: string;
    setSelectedMonth: (month: string) => void;
    monthlyPlan: MonthlyPlan;
    activeMode: AppMode;
    lastRegistrationNumber: string;
    currentUser: CurrentUser | null;
}


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const Statistics: React.FC<StatisticsProps> = ({ 
    records, 
    costModelTable, 
    generalSettings,
    experts,
    selectedExpert,
    setSelectedExpert,
    selectedMonth,
    setSelectedMonth,
    monthlyPlan,
    activeMode,
    lastRegistrationNumber,
    currentUser
}) => {
    const [totalWithoutDiscount, setTotalWithoutDiscount] = useState(0);
    const [totalWithDiscount, setTotalWithDiscount] = useState(0);

    useEffect(() => {
        const totals = records.reduce((acc, record) => {
            const costData = {
                models: record.models,
                positions: record.positions,
                codes: record.codes,
                complexity: record.complexity,
                urgency: record.urgency,
                discount: record.discount,
                pages: record.pages,
                units: record.units,
                productionType: record.productionType,
                certificateServiceType: record.certificateServiceType,
                conclusionType: record.conclusionType,
            };
            const { sumWithoutDiscount, sumWithDiscount } = calculateCost(costData, costModelTable, generalSettings, activeMode);
            acc.totalWithoutDiscount += sumWithoutDiscount;
            acc.totalWithDiscount += sumWithDiscount;
            return acc;
        }, { totalWithoutDiscount: 0, totalWithDiscount: 0 });

        setTotalWithoutDiscount(totals.totalWithoutDiscount);
        setTotalWithDiscount(totals.totalWithDiscount);

    }, [records, costModelTable, generalSettings, activeMode]);

    const completedCount = records.filter(r => r.status === 'Виконано').length;
    const notCompletedCount = records.filter(r => r.status === 'Не виконано').length;

    const totalCompletedOverall = records.reduce((acc, record) => {
        if (record.status === 'Виконано') {
            const costData = {
                models: record.models,
                positions: record.positions,
                codes: record.codes,
                complexity: record.complexity,
                urgency: record.urgency,
                discount: record.discount,
                pages: record.pages,
                units: record.units,
                productionType: record.productionType,
                certificateServiceType: record.certificateServiceType,
                conclusionType: record.conclusionType,
            };
            const { sumWithDiscount } = calculateCost(costData, costModelTable, generalSettings, activeMode);
            return acc + sumWithDiscount;
        }
        return acc;
    }, 0);

    const totalPlanPercentage = monthlyPlan.totalPlan > 0 ? Math.min((totalCompletedOverall / monthlyPlan.totalPlan) * 100, 100) : 0;


    return (
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:text-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold dark:text-white">Статистика</h2>
                <ChartIcon />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <label htmlFor="expert" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Експерт</label>
                    <select 
                        id="expert" 
                        value={selectedExpert} 
                        onChange={(e) => setSelectedExpert(e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:disabled:bg-gray-600"
                    >
                        <option value="all">Всі експерти</option>
                        {experts.map(expert => <option key={expert} value={expert}>{expert}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Виберіть місяць</label>
                    <input 
                        type="month" 
                        id="month-select" 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Всього записів"
                    value={records.length.toString()}
                    subtitle={`Виконано: ${completedCount} | Не виконано: ${notCompletedCount}`}
                    icon="document"
                    color="blue"
                />
                <StatCard 
                    title="Останній рег. номер"
                    value={lastRegistrationNumber}
                    icon="document"
                    color="blue"
                />
                 <StatCard 
                    title="Сума без знижки"
                    value={formatCurrency(totalWithoutDiscount)}
                    icon="dollar"
                    color="green"
                />
                 <StatCard 
                    title="Сума зі знижкою"
                    value={formatCurrency(totalWithDiscount)}
                    icon="dollar"
                    color="green"
                />
            </div>


            <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 dark:text-white">Виконання загального плану</h3>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Загальний план</span>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{formatCurrency(totalCompletedOverall)} / {formatCurrency(monthlyPlan.totalPlan)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div 
                                className="bg-green-600 h-2.5 rounded-full" 
                                style={{ width: `${totalPlanPercentage}%` }}
                                role="progressbar"
                                aria-valuenow={totalPlanPercentage}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label="Прогрес виконання загального плану"
                            ></div>
                        </div>
                        <div className="text-right text-sm font-semibold text-green-700 mt-1 dark:text-green-400">
                            {totalPlanPercentage.toFixed(2)}%
                        </div>
                    </div>
                 </div>

                 <h3 className="text-lg font-semibold mb-4 dark:text-white">Виконання плану експертами</h3>
                 <div className="space-y-4">
                     {monthlyPlan.expertPlans.map(plan => {
                         const expertRecords = records.filter(r => r.expert === plan.name && r.status === 'Виконано');
                         const totalCompleted = expertRecords.reduce((acc, record) => {
                             const costData = {
                                models: record.models,
                                positions: record.positions,
                                codes: record.codes,
                                complexity: record.complexity,
                                urgency: record.urgency,
                                discount: record.discount,
                                pages: record.pages,
                                units: record.units,
                                productionType: record.productionType,
                                certificateServiceType: record.certificateServiceType,
                                conclusionType: record.conclusionType,
                             };
                              const { sumWithDiscount } = calculateCost(costData, costModelTable, generalSettings, activeMode);
                              return acc + sumWithDiscount;
                         }, 0);
                         const planAmount = Number(plan.planAmount) || 0;
                         const percentage = planAmount > 0 ? Math.min((totalCompleted / planAmount) * 100, 100) : 0;
 
                         return (
                             <div key={plan.id}>
                                 <div className="flex justify-between items-center mb-1">
                                     <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{plan.name}</span>
                                     <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{formatCurrency(totalCompleted)} / {formatCurrency(planAmount)}</span>
                                 </div>
                                 <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                     <div 
                                         className="bg-blue-600 h-2.5 rounded-full" 
                                         style={{ width: `${percentage}%` }}
                                         role="progressbar"
                                         aria-valuenow={percentage}
                                         aria-valuemin={0}
                                         aria-valuemax={100}
                                         aria-label={`Прогрес для ${plan.name}`}
                                     ></div>
                                 </div>
                                 <div className="text-right text-sm font-semibold text-blue-700 mt-1 dark:text-blue-400">
                                     {percentage.toFixed(2)}%
                                 </div>
                             </div>
                         );
                     })}
                 </div>
            </div>
        </div>
    );
};

export default Statistics;