
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Record as AppRecord, Firm, CurrentUser, EditingActivity, GeneralSettings, CostModelRow, YearlySettings } from '../types';
import RecordModal from './AddRecordModal';
import RecordInfoModal from './RecordInfoModal';
import { calculateCost } from '../utils/calculateCost';
import type { AppMode } from '../App';
import { generateOrderHtml, generateCertificateOrderHtml, generateCertificateActHtml, generateRecordsHtml, generateMonthlyReportHtml, generateJournalHtml } from '../utils/generateOrderHtml';
import BulkDeleteModal from './BulkDeleteModal';

interface RecordsTableProps {
    records: AppRecord[];
    allRecords: AppRecord[];
    onAddRecord: (newRecord: Omit<AppRecord, 'id'>) => void;
    onUpdateRecord: (updatedRecord: AppRecord) => void;
    onDeleteRecord: (id: number) => void;
    onDeleteMultipleRecords: (ids: number[]) => void;
    firms: Firm[];
    experts: string[];
    yearlySettings: Record<string, YearlySettings>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    activeMode: AppMode;
    selectedMonth: string;
    onImportRecords: (file: File) => void;
    onExportRecords: (startDate?: string, endDate?: string) => void;
    currentUser: CurrentUser | null;
    editingActivity?: EditingActivity[];
    onReportFocus?: (recordId: number, isEditing: boolean) => void;
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

const ActIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 hover:text-green-800" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

const StatusTag: React.FC<{ status: 'Проведено' | 'Не проведено' }> = ({ status }) => {
    const colorClasses = status === 'Проведено' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
    return <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${colorClasses}`}>{status}</span>;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const conclusionTypeDisplay: Record<string, string> = { 'standard': 'Стандартний', 'contractual': 'Договірний', 'custom_cost': 'Своя вартість' };

const RecordsTable: React.FC<RecordsTableProps> = ({ 
    records, 
    allRecords,
    onAddRecord, 
    onUpdateRecord, 
    onDeleteRecord,
    onDeleteMultipleRecords, 
    firms, 
    experts, 
    yearlySettings, 
    showToast, 
    activeMode, 
    selectedMonth,
    onImportRecords,
    onExportRecords,
    currentUser,
    editingActivity = [],
    onReportFocus
}) => {
    const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
    const [recordToEdit, setRecordToEdit] = useState<AppRecord | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [infoModalRecord, setInfoModalRecord] = useState<(AppRecord & { sumWithoutDiscount: number, sumWithDiscount: number }) | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;
    
    useEffect(() => { setCurrentPage(1); }, [activeMode, selectedMonth, searchTerm]);

    const handleOpenAddModal = () => { setRecordToEdit(null); setModalMode('add'); };
    const handleOpenEditModal = (record: AppRecord) => {
        const editor = editingActivity.find(e => e.recordId === record.id && e.userFullName !== currentUser?.fullName);
        if (editor) { showToast(`Цей запис зараз редагує ${editor.userFullName}.`, 'error'); return; }
        setRecordToEdit(record); setModalMode('edit');
        if (onReportFocus) onReportFocus(record.id, true);
    };

    const handleCloseModal = () => {
        if (modalMode === 'edit' && recordToEdit && onReportFocus) onReportFocus(recordToEdit.id, false);
        setModalMode(null); setRecordToEdit(null);
    };
    
    const handleOpenDeleteModal = (id: number) => { setRecordToDelete(id); setIsDeleteModalOpen(true); };
    const handleCloseDeleteModal = () => { setRecordToDelete(null); setIsDeleteModalOpen(false); };
    const handleConfirmDelete = () => { if (recordToDelete !== null) onDeleteRecord(recordToDelete); handleCloseDeleteModal(); };

    const handleGenerateOrder = (record: AppRecord) => {
        const firm = firms.find(f => f.name === record.companyName);
        if (!firm) { showToast('Фірму не знайдено.', 'error'); return; }
        const orderHtml = generateOrderHtml(record, firm, yearlySettings);
        const newWindow = window.open('', '_blank');
        if (newWindow) { newWindow.document.write(orderHtml); newWindow.document.close(); }
    };
    
    const handleGenerateCertificateOrder = (record: AppRecord) => {
        let firm = firms.find(f => f.name === record.companyName) || { id: 0, name: record.companyName, address: '—', directorName: record.companyName, edrpou: '—', taxNumber: '—', productName: '' };
        const orderHtml = generateCertificateOrderHtml(record, firm, yearlySettings);
        const newWindow = window.open('', '_blank');
        if (newWindow) { newWindow.document.write(orderHtml); newWindow.document.close(); }
    };

    const handleGenerateCertificateAct = (record: AppRecord) => {
        let firm = firms.find(f => f.name === record.companyName) || { id: 0, name: record.companyName, address: '—', directorName: record.companyName, edrpou: '—', taxNumber: '—', productName: '' };
        const actHtml = generateCertificateActHtml(record, firm, yearlySettings);
        const newWindow = window.open('', '_blank');
        if (newWindow) { newWindow.document.write(actHtml); newWindow.document.close(); }
    };

    const handlePrintRecords = () => {
        const html = generateRecordsHtml(recordsWithCost, activeMode);
        const printWindow = window.open('', '_blank');
        if (printWindow) { printWindow.document.write(html); printWindow.document.close(); }
    };

    const handleGenerateMonthlyReport = () => {
        const reportHtml = generateMonthlyReportHtml(allRecords, firms, yearlySettings, selectedMonth, activeMode);
        const newWindow = window.open('', '_blank');
        if (newWindow) { newWindow.document.write(reportHtml); newWindow.document.close(); }
    };

    const handleGenerateJournal = () => {
        const journalHtml = generateJournalHtml(recordsWithCost, firms, activeMode);
        const newWindow = window.open('', '_blank');
        if (newWindow) { newWindow.document.write(journalHtml); newWindow.document.close(); }
    };

    const recordsWithCost = useMemo(() => {
        return records.map(record => {
            const { sumWithoutDiscount, sumWithDiscount } = calculateCost(record, yearlySettings, activeMode);
            return { ...record, sumWithoutDiscount, sumWithDiscount };
        });
    }, [records, yearlySettings, activeMode]);

    const filteredRecords = useMemo(() => {
        if (!searchTerm) return recordsWithCost;
        const lowerTerm = searchTerm.toLowerCase();
        return recordsWithCost.filter(r => r.companyName.toLowerCase().includes(lowerTerm) || r.registrationNumber.toLowerCase().includes(lowerTerm) || (r.comment && r.comment.toLowerCase().includes(lowerTerm)));
    }, [recordsWithCost, searchTerm]);

    const sortedRecords = useMemo(() => {
        let sortableItems = [...filteredRecords];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof typeof a];
                const bValue = b[sortConfig.key as keyof typeof b];
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                let comp = 0;
                if (typeof aValue === 'string' && typeof bValue === 'string') comp = (['startDate', 'endDate'].includes(sortConfig.key)) ? new Date(aValue).getTime() - new Date(bValue).getTime() : aValue.localeCompare(bValue);
                else comp = (aValue as number) - (bValue as number);
                return sortConfig.direction === 'ascending' ? comp : -comp;
            });
        }
        return sortableItems;
    }, [filteredRecords, sortConfig]);

    const paginatedRecords = sortedRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const headers = activeMode === 'conclusions' ? [
        { key: 'registrationNumber', label: 'РЕЄСТР. №' }, { key: 'actNumber', label: 'АКТ' }, { key: 'startDate', label: 'ДАТА ПОЧАТКУ' }, { key: 'endDate', label: 'ДАТА ЗАКІНЧЕННЯ' }, { key: 'companyName', label: 'НАЗВА КОМПАНІЇ' }, { key: 'comment', label: 'КОМЕНТАР' }, { key: 'units', label: 'ОДИНИЦІ' }, { key: 'models', label: 'МОДЕЛІ' }, { key: 'positions', label: 'ПОЗИЦІЇ' }, { key: 'pages', label: 'СТОРІНКИ' }, { key: 'codes', label: 'КОДИ' }, { key: 'complexity', label: 'СКЛАДНІСТЬ' }, { key: 'urgency', label: 'ТЕРМІНОВІСТЬ' }, { key: 'discount', label: 'ЗНИЖКА' }, { key: 'conclusionType', label: 'ТАРИФ'}, { key: 'sumWithoutDiscount', label: 'СУМА (БЕЗ ЗН.)' }, { key: 'sumWithDiscount', label: 'СУМА (ЗІ ЗН.)' }, { key: 'expert', label: "ІМ'Я ЕКСПЕРТА" }, { key: 'status', label: 'СТАТУС' }, { key: 'actions', label: 'ДІЇ', sortable: false }
    ] : [
        { key: 'registrationNumber', label: 'РЕЄСТР. №' }, { key: 'actNumber', label: 'АКТ' }, { key: 'startDate', label: 'ДАТА ПОЧАТКУ' }, { key: 'endDate', label: 'ДАТА ЗАКІНЧЕННЯ' }, { key: 'companyName', label: 'НАЗВА КОМПАНІЇ' }, { key: 'comment', label: 'КОМЕНТАР' }, { key: 'certificateForm', label: 'ФОРМА СЕРТИФІКАТУ' }, { key: 'certificateServiceType', label: 'ТИП ПОСЛУГИ' }, { key: 'productionType', label: 'ТИП ВИРОБНИЦТВА' }, { key: 'units', label: 'КІЛ-СТЬ СЕРТИФІКАТІВ' }, { key: 'pages', label: 'СТОРІНКИ'}, { key: 'additionalPages', label: 'ДОД. АРКУШІ'}, { key: 'positions', label: 'КІЛ-СТЬ ДОД. ПОЗИЦІЙ' }, { key: 'urgency', label: 'ТЕРМІНОВІСТЬ' }, { key: 'sumWithoutDiscount', label: 'СУМА БЕЗ ПДВ' }, { key: 'expert', label: "ПІБ ЕКСПЕРТА" }, { key: 'status', label: 'СТАТУС' }, { key: 'actions', label: 'ДІЇ', sortable: false }
    ];

    return (
        <>
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:text-gray-100">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div className="relative w-full lg:w-auto">
                    <input type="text" placeholder="Пошук записів..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full lg:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <button onClick={handlePrintRecords} className="p-2 bg-gray-100 rounded-lg dark:bg-gray-700" title="Роздрукувати список"><PrintIcon /></button>
                    <button onClick={handleGenerateMonthlyReport} className="p-2 bg-gray-100 rounded-lg dark:bg-gray-700" title="Місячний звіт"><ReportIcon /></button>
                    <button onClick={handleGenerateJournal} className="p-2 bg-gray-100 rounded-lg dark:bg-gray-700" title="Журнал"><JournalIcon /></button>
                    <button onClick={() => setIsBulkDeleteModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"><DeleteIcon /></button>
                    <button onClick={handleOpenAddModal} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">+ Додати запис</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            {headers.map(h => (
                                <th key={h.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-200 cursor-pointer" onClick={() => h.sortable !== false && setSortConfig({ key: h.key, direction: sortConfig?.key === h.key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending' })}>{h.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                        {paginatedRecords.map((record) => (
                            <tr key={record.id} onDoubleClick={() => setInfoModalRecord(record)} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                {activeMode === 'conclusions' ? (
                                    <>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium dark:text-white">{record.registrationNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.actNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.startDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.endDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.companyName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.comment}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.units}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.models}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.positions}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.pages}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.codes}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.complexity ? 'Так' : 'Ні'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.urgency ? 'Так' : 'Ні'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.discount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{conclusionTypeDisplay[record.conclusionType as string] || 'Стандартний'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium dark:text-gray-200">{formatCurrency(record.sumWithoutDiscount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium dark:text-gray-200">{formatCurrency(record.sumWithDiscount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.expert}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusTag status={record.status} /></td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium dark:text-white">{record.registrationNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.actNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.startDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.endDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.companyName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.comment}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.certificateForm}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.certificateServiceType}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.productionType}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.units}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.pages}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.additionalPages}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.positions}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.urgency ? 'Так' : 'Ні'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium dark:text-gray-200">{formatCurrency(record.sumWithoutDiscount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.expert}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusTag status={record.status} /></td>
                                    </>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => handleOpenEditModal(record)}><EditIcon /></button>
                                        <button onClick={() => activeMode === 'conclusions' ? handleGenerateOrder(record) : handleGenerateCertificateOrder(record)}><PrintIcon /></button>
                                        {activeMode === 'certificates' && <button onClick={() => handleGenerateCertificateAct(record)}><ActIcon /></button>}
                                        <button onClick={() => handleOpenDeleteModal(record.id)}><DeleteIcon /></button>
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
                yearlySettings={yearlySettings}
                showToast={showToast} 
                activeMode={activeMode} 
                allRecords={allRecords} 
            />
        )}
        </>
    );
};

export default RecordsTable;
