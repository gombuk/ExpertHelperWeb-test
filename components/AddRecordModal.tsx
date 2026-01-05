
import React, { useState, useEffect } from 'react';
import type { Record as AppRecord, Firm, YearlySettings } from '../types';
import { calculateCost } from '../utils/calculateCost';
import type { AppMode } from '../App';

interface RecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'add' | 'edit';
    onAddRecord?: (newRecord: Omit<AppRecord, 'id'>) => void;
    onUpdateRecord?: (updatedRecord: AppRecord) => void;
    recordToEdit?: AppRecord | null;
    firms: Firm[];
    experts: string[];
    yearlySettings: Record<string, YearlySettings>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    activeMode: AppMode;
    allRecords: AppRecord[];
}

const initialFormState: Omit<AppRecord, 'id'> = {
    registrationNumber: '',
    actNumber: '',
    companyName: '',
    startDate: '',
    endDate: '',
    expert: '',
    models: 0,
    positions: 0,
    codes: 0,
    units: 1,
    comment: '',
    complexity: false,
    urgency: false,
    discount: 'Повна',
    status: 'Не проведено',
    certificateForm: '',
    pages: 0,
    additionalPages: 0,
    productionType: 'fully_produced',
    certificateServiceType: 'standard',
    conclusionType: 'standard',
    isQuickRegistration: false,
    customCost: 0,
};

const RecordModal: React.FC<RecordModalProps> = ({ 
    isOpen, onClose, mode, onAddRecord, onUpdateRecord, recordToEdit, firms, experts, yearlySettings, showToast, activeMode, allRecords
}) => {
    const [formState, setFormState] = useState(initialFormState);
    const [sumWithDiscount, setSumWithDiscount] = useState(0);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && recordToEdit) {
                setFormState({ ...initialFormState, ...recordToEdit });
            } else {
                const today = new Date().toISOString().split('T')[0];
                setFormState({ ...initialFormState, startDate: today, endDate: today });
            }
        }
    }, [isOpen, mode, recordToEdit]);

    useEffect(() => {
        const { sumWithDiscount } = calculateCost(formState, yearlySettings, activeMode);
        setSumWithDiscount(sumWithDiscount);
    }, [formState, yearlySettings, activeMode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormState(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else if (type === 'number') {
            setFormState(prev => ({ ...prev, [name]: Number(value) }));
        } else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'edit' && onUpdateRecord && recordToEdit) {
            onUpdateRecord({ ...formState, id: recordToEdit.id });
            showToast('Запис оновлено');
        } else if (mode === 'add' && onAddRecord) {
            onAddRecord(formState);
            showToast('Запис додано');
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col dark:bg-gray-800 dark:text-gray-100 overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">{mode === 'edit' ? 'Редагувати' : 'Додати новий'} запис</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Реєстраційний №</label>
                            <input type="text" name="registrationNumber" value={formState.registrationNumber} onChange={handleInputChange} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium uppercase text-gray-500 mb-1">№ Акту</label>
                            <input type="text" name="actNumber" value={formState.actNumber || ''} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Статус</label>
                            <select name="status" value={formState.status} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                <option value="Не проведено">Не проведено</option>
                                <option value="Проведено">Проведено</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Дата початку</label>
                            <input type="date" name="startDate" value={formState.startDate} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Дата закінчення</label>
                            <input type="date" name="endDate" value={formState.endDate} onChange={handleInputChange} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Компанія замовник</label>
                            <select name="companyName" value={formState.companyName} onChange={handleInputChange} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                <option value="">Оберіть компанію...</option>
                                {firms.sort((a,b) => a.name.localeCompare(b.name)).map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Експерт</label>
                            <select name="expert" value={formState.expert} onChange={handleInputChange} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                <option value="">Оберіть експерта...</option>
                                {experts.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="border-t pt-4 dark:border-gray-700">
                        <h3 className="text-sm font-semibold mb-3 text-blue-600 dark:text-blue-400">Параметри розрахунку</h3>
                        
                        {activeMode === 'conclusions' ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Тип тарифу</label>
                                        <select name="conclusionType" value={formState.conclusionType} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                            <option value="standard">Стандартний</option>
                                            <option value="contractual">Договірний</option>
                                            <option value="custom_cost">Своя вартість</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Знижка</label>
                                        <select name="discount" value={formState.discount} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                            <option value="Повна">Повна (без знижки)</option>
                                            <option value="Зі знижкою">Зі знижкою</option>
                                        </select>
                                    </div>
                                    {formState.conclusionType === 'custom_cost' && (
                                        <div>
                                            <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Вартість (грн)</label>
                                            <input type="number" name="customCost" value={formState.customCost} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                        </div>
                                    )}
                                </div>

                                {formState.conclusionType !== 'custom_cost' && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {formState.conclusionType === 'standard' && (
                                            <div>
                                                <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Моделей</label>
                                                <input type="number" name="models" value={formState.models} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Позицій</label>
                                            <input type="number" name="positions" value={formState.positions} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Кодів</label>
                                            <input type="number" name="codes" value={formState.codes} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                        </div>
                                        {formState.conclusionType === 'contractual' && (
                                            <div>
                                                <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Сторінок</label>
                                                <input type="number" name="pages" value={formState.pages} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-6">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" name="complexity" checked={formState.complexity} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600" />
                                        <span className="text-sm">Складність</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" name="urgency" checked={formState.urgency} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600" />
                                        <span className="text-sm">Терміновість</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer text-orange-600">
                                        <input type="checkbox" name="isQuickRegistration" checked={formState.isQuickRegistration} onChange={handleInputChange} className="w-4 h-4 rounded text-orange-600" />
                                        <span className="text-sm font-semibold">Швидка реєстрація (0 грн)</span>
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Форма сертифікату</label>
                                        <input type="text" name="certificateForm" value={formState.certificateForm || ''} onChange={handleInputChange} placeholder="Напр. EUR.1" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Тип послуги</label>
                                        <select name="certificateServiceType" value={formState.certificateServiceType} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                            <option value="standard">Стандартний</option>
                                            <option value="replacement">Замінний</option>
                                            <option value="reissuance">Переоформлення</option>
                                            <option value="duplicate">Дублікат</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Тип виробництва</label>
                                        <select name="productionType" value={formState.productionType} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                            <option value="fully_produced">Повністю вироблено</option>
                                            <option value="sufficient_processing">Достатня переробка</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium uppercase text-gray-500 mb-1">К-сть сертифікатів</label>
                                        <input type="number" name="units" value={formState.units} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Сторінок (осн.)</label>
                                        <input type="number" name="pages" value={formState.pages} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Дод. аркушів</label>
                                        <input type="number" name="additionalPages" value={formState.additionalPages} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Дод. позицій</label>
                                        <input type="number" name="positions" value={formState.positions} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                </div>

                                <div className="flex gap-6">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" name="urgency" checked={formState.urgency} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600" />
                                        <span className="text-sm font-medium">Терміновість</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Коментар</label>
                        <textarea name="comment" value={formState.comment || ''} onChange={handleInputChange} rows={2} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Додаткова інформація..."></textarea>
                    </div>

                    <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-baseline space-x-2">
                            <span className="text-sm text-gray-500">Попередня вартість:</span>
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(sumWithDiscount)}
                            </span>
                        </div>
                        <div className="flex space-x-3 w-full sm:w-auto">
                            <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-6 py-2 border rounded dark:bg-gray-600 dark:border-gray-500">Скасувати</button>
                            <button type="submit" className="flex-1 sm:flex-none px-8 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 shadow-lg">Зберегти запис</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordModal;
