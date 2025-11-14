import React, { useState, useMemo, useRef } from 'react';
// FIX: Aliased Record to AppRecord to avoid conflict with the built-in Record type.
import type { Record as AppRecord, Firm, CostModelRow, GeneralSettings } from '../types';
import RecordModal from './AddRecordModal';
import { calculateCost } from '../utils/calculateCost';
import type { AppMode } from '../App';
// FIX: Corrected the import of generateOrderHtml, generateCertificateOrderHtml, and generateRecordsHtml.
import { generateOrderHtml, generateCertificateOrderHtml, generateRecordsHtml, generateFirmsHtml, generateMonthlyReportHtml, generateJournalHtml } from '../utils/generateOrderHtml';
import BulkDeleteModal from './BulkDeleteModal';


interface RecordsTableProps {
    records: AppRecord[];
    allRecords: AppRecord[];
    onAddRecord: (newRecord: Omit<AppRecord, 'id' | 'startDate' | 'endDate'> & { startDate: string; endDate: string }) => void;
    onUpdateRecord: (updatedRecord: AppRecord) => void;
    onDeleteRecord: (id: number) => void;
    onDeleteMultipleRecords: (ids: number[]) => void;
    firms: Firm[];
    experts: string[];
    costModelTable: CostModelRow[];
    generalSettings: GeneralSettings;
    showToast: (message: string, type?: 'success' | 'error') => void;
    activeMode: AppMode;
    selectedMonth: string; // Add selectedMonth prop
    onImportRecords: (file: File) => void;
    onExportRecords: (startDate?: string, endDate?: string) => void;
}

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 hover:text-blue-700" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);

const DeleteIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 hover:text-red-700" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const PrintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
);

const ReportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 2v-6m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const JournalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5c1.706 0 3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18c-1.706 0-3.332.477-4.5 1.253" />
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


const Tag: React.FC<{ text: string, color: 'orange' | 'red' | 'neutral' }> = ({ text, color }) => {
    const colorClasses = {
        orange: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
        red: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
        neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }[color];
    
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses}`}>
            {text}
        </span>
    );
};

const StatusTag: React.FC<{ status: 'Виконано' | 'Не виконано' }> = ({ status }) => {
    const colorClasses = status === 'Виконано'
        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${colorClasses}`}>
            {status}
        </span>
    );
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const productionTypeDisplay: Record<string, string> = {
    'fully_produced': 'Повністю вироблений',
    'sufficient_processing': 'Достатня обробка'
};

const certificateServiceTypeDisplay: Record<string, string> = {
    'standard': 'Стандартний',
    'replacement': 'Замінний',
    'reissuance': 'Переоформлення',
    'duplicate': 'Дублікат'
};

const conclusionTypeDisplay: Record<string, string> = {
    'standard': 'Стандартний',
    'contractual': 'Договірний',
    'custom_cost': 'Своя вартість'
};

const RecordsTable: React.FC<RecordsTableProps> = ({ 
    records, 
    allRecords,
    onAddRecord, 
    onUpdateRecord, 
    onDeleteRecord,
    onDeleteMultipleRecords, 
    firms, 
    experts, 
    costModelTable, 
    generalSettings, 
    showToast, 
    activeMode, 
    selectedMonth,
    onImportRecords,
    onExportRecords 
}) => {
    const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
    const [recordToEdit, setRecordToEdit] = useState<AppRecord | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');

    
    const handleOpenAddModal = () => {
        setRecordToEdit(null);
        setModalMode('add');
    };

    const handleOpenEditModal = (record: AppRecord) => {
        setRecordToEdit(record);
        setModalMode('edit');
    };

    const handleCloseModal = () => {
        setModalMode(null);
        setRecordToEdit(null);
    };
    
    const handleOpenDeleteModal = (id: number) => {
        setRecordToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setRecordToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const handleConfirmDelete = () => {
        if (recordToDelete !== null) {
            onDeleteRecord(recordToDelete);
        }
        handleCloseDeleteModal();
    };

    const handleGenerateOrder = (record: AppRecord) => {
        if (activeMode !== 'conclusions') return;
    
        const firm = firms.find(f => f.name === record.companyName);
        if (!firm) {
            showToast('Фірму для цього запису не знайдено.', 'error');
            return;
        }
    
        const orderHtml = generateOrderHtml(record, firm, costModelTable, generalSettings);
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(orderHtml);
            newWindow.document.close();
        } else {
            showToast('Не вдалося відкрити нове вікно. Будь ласка, дозвольте спливаючі вікна для цього сайту.', 'error');
        }
    };
    
    const handleGenerateCertificateOrder = (record: AppRecord) => {
        if (activeMode !== 'certificates') return;

        const firm = firms.find(f => f.name === record.companyName);
        if (!firm) {
            showToast('Фірму для цього запису не знайдено.', 'error');
            return;
        }

        const orderHtml = generateCertificateOrderHtml(record, firm, generalSettings);
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(orderHtml);
            newWindow.document.close();
        } else {
            showToast('Не вдалося відкрити нове вікно. Будь ласка, дозвольте спливаючі вікна для цього сайту.', 'error');
        }
    };

    const handlePrintRecords = () => {
        const html = generateRecordsHtml(recordsWithCost, activeMode);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        } else {
            showToast('Не вдалося відкрити нове вікно. Будь ласка, дозвольте спливаючі вікна для цього сайту.', 'error');
        }
    };

    const handleGenerateMonthlyReport = () => {
        const reportHtml = generateMonthlyReportHtml(records, firms, costModelTable, generalSettings, selectedMonth, activeMode);
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(reportHtml);
            newWindow.document.close();
        } else {
            showToast('Не вдалося відкрити нове вікно. Будь ласка, дозвольте спливаючі вікна для цього сайту.', 'error');
        }
    };

    const handleGenerateJournal = () => {
        const journalHtml = generateJournalHtml(recordsWithCost, firms, activeMode);
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(journalHtml);
            newWindow.document.close();
        } else {
            showToast('Не вдалося відкрити нове вікно. Будь ласка, дозвольте спливаючі вікна для цього сайту.', 'error');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImportRecords(file);
        }
        // Reset file input value so same file can be selected again
        if (e.target) {
            e.target.value = '';
        }
    };


    const recordsWithCost = useMemo(() => {
        return records.map(record => {
            const costData = {
                models: record.models,
                positions: record.positions,
                codes: record.codes,
                complexity: record.complexity,
                urgency: record.urgency,
                discount: record.discount,
                pages: record.pages,
                additionalPages: record.additionalPages,
                units: record.units,
                productionType: record.productionType,
                certificateServiceType: record.certificateServiceType,
                conclusionType: record.conclusionType,
                customCost: record.customCost,
                isQuickRegistration: record.isQuickRegistration,
            };
            const { sumWithoutDiscount, sumWithDiscount } = calculateCost(costData, costModelTable, generalSettings, activeMode);
            return { ...record, sumWithoutDiscount, sumWithDiscount };
        });
    }, [records, costModelTable, generalSettings, activeMode]);

    const sortedRecords = useMemo(() => {
        let sortableItems = [...recordsWithCost];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof typeof a];
                const bValue = b[sortConfig.key as keyof typeof b];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                
                let comparison = 0;
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    if (['startDate', 'endDate'].includes(sortConfig.key)) {
                        comparison = new Date(aValue).getTime() - new Date(bValue).getTime();
                    } else {
                        comparison = aValue.localeCompare(bValue);
                    }
                } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                    comparison = aValue === bValue ? 0 : aValue ? -1 : 1;
                } else {
                    comparison = (aValue as number) - (bValue as number);
                }

                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        return sortableItems;
    }, [recordsWithCost, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const formatDateString = (dateStr: string) => {
        if (!dateStr || dateStr.includes('.')) return dateStr;
        
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) { // Check for invalid date
                return dateStr;
            }

            const shortMonthNames = [
                'січ', 'лют', 'бер', 'квіт', 'трав', 'черв',
                'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'
            ];
            
            const userTimezoneOffset = date.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
            
            const day = String(adjustedDate.getDate()).padStart(2, '0');
            const month = shortMonthNames[adjustedDate.getMonth()];
            const year = adjustedDate.getFullYear();
            
            return `${day} ${month}. ${year} р.`;
        } catch (error) {
            console.error("Error formatting date:", dateStr, error);
            return dateStr; // Return original string if parsing fails
        }
    };

    const conclusionHeaders = [
        { key: 'registrationNumber', label: 'РЕЄСТР. №' },
        { key: 'actNumber', label: 'АКТ' },
        { key: 'startDate', label: 'ДАТА ПОЧАТКУ' },
        { key: 'endDate', label: 'ДАТА ЗАКІНЧЕННЯ' },
        { key: 'companyName', label: 'НАЗВА КОМПАНІЇ' },
        { key: 'comment', label: 'КОМЕНТАР' },
        { key: 'units', label: 'ОДИНИЦІ' },
        { key: 'models', label: 'МОДЕЛІ' },
        { key: 'positions', label: 'ПОЗИЦІЇ' },
        { key: 'pages', label: 'СТОРІНКИ' },
        { key: 'codes', label: 'КОДИ' },
        { key: 'complexity', label: 'СКЛАДНІСТЬ' },
        { key: 'urgency', label: 'ТЕРМІНОВІСТЬ' },
        { key: 'discount', label: 'ЗНИЖКА' },
        { key: 'conclusionType', label: 'ТАРИФ'},
        { key: 'sumWithoutDiscount', label: 'СУМА (БЕЗ ЗН.)' },
        { key: 'sumWithDiscount', label: 'СУМА (ЗІ ЗН.)' },
        { key: 'expert', label: "ІМ'Я ЕКСПЕРТА" },
        { key: 'status', label: 'СТАТУС' },
        { key: 'actions', label: 'ДІЇ', sortable: false }
    ];

    const certificateHeaders = [
        { key: 'registrationNumber', label: 'РЕЄСТР. №' },
        { key: 'actNumber', label: 'АКТ' },
        { key: 'startDate', label: 'ДАТА ПОЧАТКУ' },
        { key: 'endDate', label: 'ДАТА ЗАКІНЧЕННЯ' },
        { key: 'companyName', label: 'НАЗВА КОМПАНІЇ' },
        { key: 'comment', label: 'КОМЕНТАР' },
        { key: 'certificateForm', label: 'ФОРМА СЕРТИФІКАТУ' },
        { key: 'certificateServiceType', label: 'ТИП ПОСЛУГИ' },
        { key: 'productionType', label: 'ТИП ВИРОБНИЦТВА' },
        { key: 'units', label: 'КІЛ-СТЬ СЕРТИФІКАТІВ' },
        { key: 'pages', label: 'СТОРІНКИ'},
        { key: 'additionalPages', label: 'ДОД. АРКУШІ'},
        { key: 'positions', label: 'КІЛ-СТЬ ДОД. ПОЗИЦІЙ' },
        { key: 'urgency', label: 'ТЕРМІНОВІСТЬ' },
        { key: 'sumWithoutDiscount', label: 'СУМА БЕЗ ПДВ' },
        { key: 'expert', label: "ПІБ ЕКСПЕРТА" },
        { key: 'status', label: 'СТАТУС' },
        { key: 'actions', label: 'ДІЇ', sortable: false }
    ];

    const headers = activeMode === 'conclusions' ? conclusionHeaders : certificateHeaders;

    return (
        <>
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:text-gray-100">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div className="relative w-full lg:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Пошук записів..." 
                        className="w-full lg:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <div className="flex items-end gap-2 p-2 border rounded-lg dark:border-gray-600">
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">Експорт з</label>
                            <input 
                                type="date" 
                                value={exportStartDate} 
                                onChange={e => setExportStartDate(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">по</label>
                            <input 
                                type="date" 
                                value={exportEndDate} 
                                onChange={e => setExportEndDate(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-500"
                            />
                        </div>
                        <button
                            onClick={() => onExportRecords(exportStartDate, exportEndDate)}
                            className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-200 hover:dark:bg-gray-600"
                            title="Експортувати записи за вибраний період"
                        >
                            <DownloadIcon />
                        </button>
                    </div>
                     <button
                        onClick={handleImportClick}
                        className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-200 hover:dark:bg-gray-600"
                        title="Імпортувати записи"
                    >
                        <UploadIcon />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        style={{ display: 'none' }} 
                    />
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
                    <button
                        onClick={handlePrintRecords}
                        className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-200 hover:dark:bg-gray-600"
                        title="Роздрукувати список"
                    >
                        <PrintIcon />
                    </button>
                    <button
                        onClick={handleGenerateMonthlyReport}
                        className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-200 hover:dark:bg-gray-600"
                        title="Сформувати місячний звіт"
                    >
                        <ReportIcon />
                    </button>
                    <button
                        onClick={handleGenerateJournal}
                        className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-200 hover:dark:bg-gray-600"
                        title="Надрукувати журнал"
                    >
                        <JournalIcon />
                    </button>
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
                    <button
                        onClick={() => setIsBulkDeleteModalOpen(true)}
                        className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                        title="Масове видалення записів"
                    >
                        <DeleteIcon />
                        <span className="ml-2">Видалити</span>
                    </button>
                    <button 
                        onClick={handleOpenAddModal}
                        className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                        <span className="text-xl mr-2 font-light">+</span> Додати запис
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            {headers.map(header => (
                                <th 
                                    key={header.key} 
                                    scope="col" 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none dark:text-gray-200"
                                    onClick={() => header.sortable !== false && requestSort(header.key)}
                                    style={{ cursor: header.sortable !== false ? 'pointer' : 'default' }}
                                >
                                    <div className="flex items-center">
                                        {header.label}
                                        {sortConfig && sortConfig.key === header.key && (
                                            <span className="ml-2 text-gray-600 dark:text-gray-300">
                                                {sortConfig.direction === 'ascending' ? '▲' : '▼'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                        {sortedRecords.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    {activeMode === 'conclusions' ? (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white flex items-center">
                                                {record.registrationNumber}
                                                {record.isQuickRegistration && <span className="ml-2"><Tag text="Швидка" color="orange" /></span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.actNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDateString(record.startDate)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDateString(record.endDate)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.companyName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.comment}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.units}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.conclusionType === 'standard' ? record.models : '—'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.conclusionType === 'standard' ? record.positions : '—'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.conclusionType === 'contractual' ? record.pages : '—'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.codes}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.conclusionType === 'standard' ? (record.complexity ? <Tag text="Так" color="orange" /> : '') : '—'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.conclusionType === 'standard' ? (record.urgency ? <Tag text="Так" color="red" /> : <Tag text="Ні" color="neutral" />) : '—'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.discount}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{conclusionTypeDisplay[record.conclusionType as keyof typeof conclusionTypeDisplay] || 'Стандартний'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium dark:text-gray-200">{formatCurrency(record.sumWithoutDiscount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium dark:text-gray-200">{formatCurrency(record.sumWithDiscount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.expert}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"><StatusTag status={record.status} /></td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white flex items-center">
                                                {record.registrationNumber}
                                                {record.isQuickRegistration && <span className="ml-2"><Tag text="Швидка" color="orange" /></span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.actNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDateString(record.startDate)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDateString(record.endDate)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.companyName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.comment}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.certificateForm}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{certificateServiceTypeDisplay[record.certificateServiceType as keyof typeof certificateServiceTypeDisplay] || 'Стандартний'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{productionTypeDisplay[record.productionType as keyof typeof productionTypeDisplay] || ''}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.units}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.pages}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.additionalPages}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.positions}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.urgency ? <Tag text="Так" color="red" /> : <Tag text="Ні" color="neutral" />}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium dark:text-gray-200">{formatCurrency(record.sumWithoutDiscount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.expert}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"><StatusTag status={record.status} /></td>
                                        </>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-3">
                                            <button onClick={() => handleOpenEditModal(record)} title="Редагувати запис" className="focus:outline-none"><EditIcon /></button>
                                            <button 
                                                onClick={() => activeMode === 'conclusions' ? handleGenerateOrder(record) : handleGenerateCertificateOrder(record)} 
                                                title={activeMode === 'conclusions' ? "Сформувати наряд" : "Сформувати наряд (сертифікат)"} 
                                                className="focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={record.isQuickRegistration}
                                            >
                                                <PrintIcon />
                                            </button>
                                            <button onClick={() => handleOpenDeleteModal(record.id)} className="focus:outline-none" title="Видалити запис"><DeleteIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
        {modalMode && (
            <RecordModal
                mode={modalMode}
                isOpen={!!modalMode}
                onClose={handleCloseModal}
                onAddRecord={onAddRecord}
                onUpdateRecord={onUpdateRecord}
                recordToEdit={recordToEdit}
                firms={firms}
                experts={experts}
                costModelTable={costModelTable}
                generalSettings={generalSettings}
                showToast={showToast}
                activeMode={activeMode}
            />
        )}
        {isDeleteModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm dark:bg-gray-800 dark:text-gray-100">
                    <h3 id="delete-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">Підтвердження видалення</h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Ви впевнені, що хочете видалити цей запис? Цю дію неможливо буде скасувати.</p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button 
                            onClick={handleCloseDeleteModal}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 hover:dark:bg-gray-600"
                        >
                            Скасувати
                        </button>
                        <button 
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Видалити
                        </button>
                    </div>
                </div>
            </div>
        )}
        <BulkDeleteModal
            isOpen={isBulkDeleteModalOpen}
            onClose={() => setIsBulkDeleteModalOpen(false)}
            allRecords={allRecords}
            onDelete={onDeleteMultipleRecords}
            activeMode={activeMode}
        />
        </>
    );
};

export default RecordsTable;
