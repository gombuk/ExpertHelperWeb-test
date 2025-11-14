import React, { useState, useEffect, useCallback } from 'react';
// FIX: Aliased Record to AppRecord to avoid conflict with the built-in Record type.
import type { Record as AppRecord, Firm, CostModelRow, GeneralSettings } from '../types';
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
    costModelTable: CostModelRow[];
    generalSettings: GeneralSettings;
    showToast: (message: string, type?: 'success' | 'error') => void;
    activeMode: AppMode;
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
    status: 'Не виконано',
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
    isOpen, 
    onClose, 
    mode,
    onAddRecord,
    onUpdateRecord,
    recordToEdit,
    firms,
    experts,
    costModelTable,
    generalSettings,
    showToast,
    activeMode
}) => {
    const [formState, setFormState] = useState(initialFormState);
    const [sumWithoutDiscount, setSumWithoutDiscount] = useState(0);
    const [sumWithDiscount, setSumWithDiscount] = useState(0);
    const [registrationMode, setRegistrationMode] = useState<'full' | 'quick'>('full');

    const resetState = useCallback(() => {
        setFormState(initialFormState);
        setSumWithoutDiscount(0);
        setSumWithDiscount(0);
    }, []);

    const populateForm = useCallback((record: AppRecord) => {
        const fullRecord = {
            ...initialFormState,
            ...record,
            comment: record.comment || '',
        };
        setFormState(fullRecord);
        
        const costData = {
            models: fullRecord.models,
            positions: fullRecord.positions,
            codes: fullRecord.codes,
            complexity: fullRecord.complexity,
            urgency: fullRecord.urgency,
            discount: fullRecord.discount,
            pages: fullRecord.pages,
            additionalPages: fullRecord.additionalPages,
            units: fullRecord.units,
            productionType: fullRecord.productionType,
            certificateServiceType: fullRecord.certificateServiceType,
            conclusionType: fullRecord.conclusionType,
            customCost: fullRecord.customCost,
            isQuickRegistration: fullRecord.isQuickRegistration
        };
        const { sumWithoutDiscount, sumWithDiscount } = calculateCost(costData, costModelTable, generalSettings, activeMode);
        setSumWithoutDiscount(sumWithoutDiscount);
        setSumWithDiscount(sumWithDiscount);
    }, [costModelTable, generalSettings, activeMode]);
    
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && recordToEdit) {
                populateForm(recordToEdit);
                setRegistrationMode('full'); // Editing is always full
            } else {
                resetState();
                setRegistrationMode('full');
            }
        }
    }, [isOpen, mode, recordToEdit, resetState, populateForm]);

    useEffect(() => {
        if (activeMode === 'conclusions' && formState.conclusionType === 'custom_cost') {
            const customCost = Number(formState.customCost) || 0;
            setSumWithoutDiscount(customCost);
            const discountMultiplier = formState.discount === 'Зі знижкою' ? (1 - (generalSettings.discount || 0) / 100) : 1;
            setSumWithDiscount(customCost * discountMultiplier);
        }
    }, [formState.customCost, formState.discount, activeMode, formState.conclusionType, generalSettings.discount]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
             const { checked } = e.target as HTMLInputElement;
             setFormState(prev => ({ ...prev, [name]: checked }));
        } else {
            if (name === 'conclusionType') {
                if (value === 'contractual' || value === 'custom_cost') {
                    setFormState(prev => ({
                        ...prev,
                        conclusionType: value,
                        models: 0,
                        positions: 0,
                        complexity: false,
                        urgency: false,
                    }));
                } else { // standard
                     setFormState(prev => ({
                        ...prev,
                        conclusionType: 'standard',
                        pages: 0,
                        customCost: 0,
                    }));
                }
            } else {
                setFormState(prev => ({ ...prev, [name]: value }));
            }
        }
    };
    
    const handleCalculate = useCallback(() => {
        const costData = {
            models: Number(formState.models),
            positions: Number(formState.positions),
            codes: Number(formState.codes),
            complexity: formState.complexity,
            urgency: formState.urgency,
            discount: formState.discount,
            pages: Number(formState.pages),
            additionalPages: Number(formState.additionalPages),
            units: Number(formState.units),
            productionType: formState.productionType,
            certificateServiceType: formState.certificateServiceType,
            conclusionType: formState.conclusionType,
            customCost: Number(formState.customCost),
            isQuickRegistration: registrationMode === 'quick',
        };

        const { sumWithoutDiscount, sumWithDiscount } = calculateCost(costData, costModelTable, generalSettings, activeMode);
        setSumWithoutDiscount(sumWithoutDiscount);
        setSumWithDiscount(sumWithDiscount);
    }, [formState, costModelTable, generalSettings, activeMode, registrationMode]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalRecordData: Omit<AppRecord, 'id'>;

        if (registrationMode === 'quick') {
            finalRecordData = {
                ...initialFormState,
                registrationNumber: formState.registrationNumber,
                startDate: formState.startDate,
                endDate: formState.endDate,
                companyName: formState.companyName,
                expert: formState.expert,
                isQuickRegistration: true,
                status: 'Не виконано',
            };
        } else {
            finalRecordData = {
                ...formState,
                models: Number(formState.models),
                positions: Number(formState.positions),
                codes: Number(formState.codes),
                units: Number(formState.units),
                pages: Number(formState.pages),
                additionalPages: Number(formState.additionalPages),
                customCost: Number(formState.customCost),
                isQuickRegistration: false,
            };

            if (activeMode === 'conclusions') {
                if (finalRecordData.conclusionType === 'contractual') {
                    finalRecordData = { ...finalRecordData, models: 0, positions: 0, complexity: false, urgency: false, customCost: 0 };
                } else if (finalRecordData.conclusionType === 'custom_cost') {
                    finalRecordData = { ...finalRecordData, models: 0, positions: 0, codes: 0, complexity: false, urgency: false, pages: 0 };
                } else { // standard
                    finalRecordData = { ...finalRecordData, pages: 0, customCost: 0 };
                }
            } else if (activeMode === 'certificates') {
                finalRecordData = { ...finalRecordData, models: 1, codes: 0, complexity: false, discount: 'Повна' };
                if (finalRecordData.certificateServiceType !== 'standard') {
                    finalRecordData.pages = 0;
                    finalRecordData.positions = 0;
                    finalRecordData.additionalPages = 0;
                }
            }
        }
        
        if (mode === 'edit' && onUpdateRecord && recordToEdit) {
            onUpdateRecord({ ...finalRecordData, id: recordToEdit.id });
            showToast('Дані оновлено');
        } else if (mode === 'add' && onAddRecord) {
            onAddRecord(finalRecordData);
            showToast('Дані збережено');
        }
        
        onClose();
    };

    if (!isOpen) return null;
    
    const title = mode === 'edit' ? 'Редагувати запис' : 'Додати новий запис';
    const submitButtonText = mode === 'edit' ? 'Оновити' : 'Створити';
    const isStandardCertificate = formState.certificateServiceType === 'standard' || !formState.certificateServiceType;


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col dark:bg-gray-800 dark:text-gray-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold dark:text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 hover:dark:text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
                    {mode === 'add' && (
                        <div className="flex items-center justify-center p-1 bg-gray-100 rounded-lg mb-6 dark:bg-gray-700">
                            <button type="button" onClick={() => setRegistrationMode('full')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-1/2 ${registrationMode === 'full' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                                Повна реєстрація
                            </button>
                            <button type="button" onClick={() => setRegistrationMode('quick')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-1/2 ${registrationMode === 'quick' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                                Швидка реєстрація
                            </button>
                        </div>
                    )}

                    {registrationMode === 'quick' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Реєстраційний номер *</label>
                                <input type="text" name="registrationNumber" value={formState.registrationNumber} onChange={handleInputChange} required className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Дата початку *</label>
                                <input type="date" name="startDate" value={formState.startDate} onChange={handleInputChange} required className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Дата закінчення *</label>
                                <input type="date" name="endDate" value={formState.endDate} onChange={handleInputChange} required className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Назва компанії *</label>
                                <select name="companyName" value={formState.companyName} onChange={handleInputChange} required className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value="" disabled>Виберіть компанію</option>
                                    {firms.map(firm => <option key={firm.id} value={firm.name}>{firm.name}</option>)}
                                </select>
                            </div>
                             <div className="md:col-span-2">
                                <label htmlFor="expert" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Експерт *</label>
                                <select name="expert" value={formState.expert} onChange={handleInputChange} required className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value="" disabled>Виберіть експерта</option>
                                    {experts.map(expert => <option key={expert} value={expert}>{expert}</option>)}
                                </select>
                            </div>
                        </div>
                    ) : (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Реєстраційний номер *</label>
                            <input type="text" name="registrationNumber" value={formState.registrationNumber} onChange={handleInputChange} required className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="actNumber" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Акт</label>
                            <input type="text" name="actNumber" value={formState.actNumber || ''} onChange={handleInputChange} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Назва компанії *</label>
                            <select name="companyName" value={formState.companyName} onChange={handleInputChange} required className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="" disabled>Виберіть компанію</option>
                                {firms.map(firm => <option key={firm.id} value={firm.name}>{firm.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Дата початку *</label>
                            <input type="date" name="startDate" value={formState.startDate} onChange={handleInputChange} required className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Дата закінчення *</label>
                            <input type="date" name="endDate" value={formState.endDate} onChange={handleInputChange} required className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="expert" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Експерт *</label>
                            <select name="expert" value={formState.expert} onChange={handleInputChange} required className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="" disabled>Виберіть експерта</option>
                                {experts.map(expert => <option key={expert} value={expert}>{expert}</option>)}
                            </select>
                        </div>
                         {activeMode === 'conclusions' && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">Тип тарифу</label>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <input type="radio" id="standard_tariff" name="conclusionType" value="standard" checked={formState.conclusionType === 'standard'} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700" />
                                        <label htmlFor="standard_tariff" className="ml-2 block text-sm text-gray-900 dark:text-white">Стандартний</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input type="radio" id="contractual_tariff" name="conclusionType" value="contractual" checked={formState.conclusionType === 'contractual'} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700" />
                                        <label htmlFor="contractual_tariff" className="ml-2 block text-sm text-gray-900 dark:text-white">Договірний</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input type="radio" id="custom_cost_tariff" name="conclusionType" value="custom_cost" checked={formState.conclusionType === 'custom_cost'} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700" />
                                        <label htmlFor="custom_cost_tariff" className="ml-2 block text-sm text-gray-900 dark:text-white">Своя вартість</label>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeMode === 'certificates' && (
                             <div>
                                <label htmlFor="certificateForm" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Форма сертифікату</label>
                                <select name="certificateForm" value={formState.certificateForm || ''} onChange={handleInputChange} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value="" disabled>Оберіть форму</option>
                                    <option value="О">О</option>
                                    <option value="А">А</option>
                                    <option value="СТ-1">СТ-1</option>
                                    <option value="СТ-1 (форма Д)">СТ-1 (форма Д)</option>
                                    <option value="У-1">У-1</option>
                                </select>
                            </div>
                        )}
                         <div>
                            <label htmlFor="units" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">{activeMode === 'conclusions' ? 'Кількість (одиниці)' : 'Кількість сертифікатів *'}</label>
                            <input type="number" name="units" value={formState.units} onChange={handleInputChange} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" required={activeMode === 'certificates'} />
                        </div>
                        {activeMode === 'certificates' && (
                            <>
                                <div>
                                    <label htmlFor="certificateServiceType" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Тип послуги</label>
                                    <select name="certificateServiceType" value={formState.certificateServiceType || 'standard'} onChange={handleInputChange} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option value="standard">Стандартний</option>
                                        <option value="replacement">Замінний</option>
                                        <option value="reissuance">Переоформлення</option>
                                        <option value="duplicate">Дублікат</option>
                                    </select>
                                </div>
                                {isStandardCertificate && (
                                <>
                                    <div>
                                        <label htmlFor="productionType" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Тип виробництва *</label>
                                        <select name="productionType" value={formState.productionType || 'fully_produced'} onChange={handleInputChange} required className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                            <option value="fully_produced">Повністю вироблений в Україні</option>
                                            <option value="sufficient_processing">Достатня обробка/переробка</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="pages" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Кількість сторінок *</label>
                                        <input type="number" name="pages" value={formState.pages || ''} onChange={handleInputChange} required className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                    </div>
                                    <div>
                                        <label htmlFor="additionalPages" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Кількість дод. аркушів</label>
                                        <input type="number" name="additionalPages" value={formState.additionalPages || ''} onChange={handleInputChange} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                    </div>
                                </>
                                )}
                            </>
                        )}
                        {activeMode === 'conclusions' && formState.conclusionType === 'standard' && (
                             <>
                                <div>
                                    <label htmlFor="models" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Кількість моделей *</label>
                                    <input type="number" name="models" value={formState.models} onChange={handleInputChange} required className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                </div>
                                <div>
                                    <label htmlFor="positions" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Кількість позицій *</label>
                                    <input type="number" name="positions" value={formState.positions} onChange={handleInputChange} required className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                </div>
                            </>
                        )}
                        {activeMode === 'conclusions' && formState.conclusionType === 'contractual' && (
                            <div>
                                <label htmlFor="pages" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Кількість сторінок *</label>
                                <input type="number" name="pages" value={formState.pages || ''} onChange={handleInputChange} required className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                        )}
                        {(activeMode === 'certificates' && isStandardCertificate) && (
                        <div>
                            <label htmlFor="positions" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Кількість додаткових позицій</label>
                            <input type="number" name="positions" value={formState.positions} onChange={handleInputChange} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        )}
                         {activeMode === 'conclusions' && formState.conclusionType !== 'custom_cost' && (
                            <div>
                                <label htmlFor="codes" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Кількість кодів</label>
                                <input type="number" name="codes" value={formState.codes} onChange={handleInputChange} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                        )}
                    </div>
                    
                    {formState.conclusionType !== 'custom_cost' && (
                    <div className="pt-4">
                        <button type="button" onClick={handleCalculate} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            Розрахувати вартість
                        </button>
                    </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {activeMode === 'conclusions' ? (
                            <>
                                {formState.conclusionType === 'custom_cost' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Сума без знижки *</label>
                                        <input type="number" name="customCost" value={formState.customCost || ''} onChange={handleInputChange} required className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Сума без знижки</label>
                                        <input type="text" value={sumWithoutDiscount.toFixed(2)} readOnly className="input-field bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Сума зі знижкою</label>
                                    <input type="text" value={sumWithDiscount.toFixed(2)} readOnly className="input-field bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Тип знижки</label>
                                    <select name="discount" value={formState.discount} onChange={handleInputChange} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option>Повна</option>
                                        <option>Зі знижкою</option>
                                    </select>
                                </div>
                            </>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Сума</label>
                                <input type="text" value={sumWithoutDiscount.toFixed(2)} readOnly className="input-field bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Статус</label>
                             <select name="status" value={formState.status} onChange={handleInputChange} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="Не виконано">Не виконано</option>
                                <option value="Виконано">Виконано</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                         <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Коментар</label>
                         <textarea name="comment" value={formState.comment || ''} onChange={handleInputChange} rows={3} className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
                    </div>

                    <div className="flex items-center space-x-6">
                        {activeMode === 'conclusions' && formState.conclusionType === 'standard' && (
                             <>
                                <div className="flex items-center">
                                    <input type="checkbox" id="complexity" name="complexity" checked={formState.complexity} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700" />
                                    <label htmlFor="complexity" className="ml-2 block text-sm text-gray-900 dark:text-white">Складний</label>
                                </div>
                                 <div className="flex items-center">
                                    <input type="checkbox" id="urgency" name="urgency" checked={formState.urgency} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700" />
                                    <label htmlFor="urgency" className="ml-2 block text-sm text-gray-900 dark:text-white">Терміновий</label>
                                </div>
                            </>
                        )}
                         {activeMode === 'certificates' && (
                            <div className="flex items-center">
                               <input type="checkbox" id="urgency" name="urgency" checked={formState.urgency} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700" />
                               <label htmlFor="urgency" className="ml-2 block text-sm text-gray-900 dark:text-white">Терміновий</label>
                            </div>
                        )}
                    </div>
                    </>
                    )}

                    <style>{`.input-field { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); outline: none; transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out; } .input-field:focus { border-color: #4F46E5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2); } .dark .input-field { background-color: #374151; border-color: #4B5563; color: #FFFFFF; } .dark .input-field:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); }`}</style>
                
                </form>
                 <div className="flex justify-end items-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl dark:border-gray-700 dark:bg-gray-700">
                    <button onClick={onClose} type="button" className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 hover:dark:bg-gray-600">
                        Скасувати
                    </button>
                    <button onClick={handleSubmit} type="submit" className="ml-3 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                        {submitButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecordModal;
