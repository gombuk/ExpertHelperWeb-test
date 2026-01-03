
import React, { useState, useEffect } from 'react';
import type { Record as AppRecord, Firm, GeneralSettings, CostModelRow } from '../types';
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
    costModelTable: CostModelRow[] | undefined;
    generalSettings: GeneralSettings;
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
    units: 0,
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
    isOpen, onClose, mode, onAddRecord, onUpdateRecord, recordToEdit, firms, experts, costModelTable, generalSettings, showToast, activeMode, allRecords
}) => {
    const [formState, setFormState] = useState(initialFormState);
    const [sumWithoutDiscount, setSumWithoutDiscount] = useState(0);
    const [sumWithDiscount, setSumWithDiscount] = useState(0);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && recordToEdit) setFormState({ ...initialFormState, ...recordToEdit });
            else setFormState({ ...initialFormState, endDate: new Date().toISOString().split('T')[0] });
        }
    }, [isOpen, mode, recordToEdit]);

    useEffect(() => {
        const { sumWithoutDiscount, sumWithDiscount } = calculateCost(formState, costModelTable, generalSettings, activeMode);
        setSumWithoutDiscount(sumWithoutDiscount);
        setSumWithDiscount(sumWithDiscount);
    }, [formState, costModelTable, generalSettings, activeMode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') setFormState(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        else setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'edit' && onUpdateRecord && recordToEdit) onUpdateRecord({ ...formState, id: recordToEdit.id });
        else if (mode === 'add' && onAddRecord) onAddRecord(formState);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col dark:bg-gray-800 dark:text-gray-100">
                <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">{mode === 'edit' ? 'Редагувати' : 'Додати'} запис</h2>
                    <button onClick={onClose}>Закрити</button>
                </div>
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium">Реєстраційний №</label>
                            <input type="text" name="registrationNumber" value={formState.registrationNumber} onChange={handleInputChange} required className="w-full p-2 border rounded dark:bg-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Дата закінчення</label>
                            <input type="date" name="endDate" value={formState.endDate} onChange={handleInputChange} required className="w-full p-2 border rounded dark:bg-gray-700" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium">Компанія</label>
                            <select name="companyName" value={formState.companyName} onChange={handleInputChange} required className="w-full p-2 border rounded dark:bg-gray-700">
                                <option value="">Оберіть...</option>
                                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                            </select>
                        </div>
                        {activeMode === 'conclusions' ? (
                            <>
                                <div><label className="block text-sm font-medium">Моделей</label><input type="number" name="models" value={formState.models} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700" /></div>
                                <div><label className="block text-sm font-medium">Позицій</label><input type="number" name="positions" value={formState.positions} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700" /></div>
                            </>
                        ) : (
                            <>
                                <div><label className="block text-sm font-medium">Кількість</label><input type="number" name="units" value={formState.units} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700" /></div>
                                <div><label className="block text-sm font-medium">Сторінок</label><input type="number" name="pages" value={formState.pages} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700" /></div>
                            </>
                        )}
                    </div>
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-bold">Розрахункова вартість: {sumWithDiscount.toFixed(2)} грн</div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-6 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded dark:bg-gray-600">Скасувати</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Зберегти</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordModal;
