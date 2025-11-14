import React, { useState, useMemo, useEffect } from 'react';
import type { Record as AppRecord } from '../types';
import type { AppMode } from '../App';

interface BulkDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    allRecords: AppRecord[];
    onDelete: (ids: number[]) => void;
    activeMode: AppMode;
}

const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({ isOpen, onClose, allRecords, onDelete, activeMode }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStartDate('');
            setEndDate('');
            setSelectedIds(new Set());
            setShowConfirm(false);
        }
    }, [isOpen]);

    const filteredRecords = useMemo(() => {
        if (!startDate && !endDate) {
            return allRecords;
        }
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        return allRecords.filter(record => {
            try {
                const recordDate = new Date(record.endDate);
                if (isNaN(recordDate.getTime())) return false;
                const isAfterStart = start ? recordDate >= start : true;
                const isBeforeEnd = end ? recordDate <= end : true;
                return isAfterStart && isBeforeEnd;
            } catch (e) {
                return false;
            }
        });
    }, [allRecords, startDate, endDate]);

    const handleSelect = (id: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredRecords.map(r => r.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleDeleteClick = () => {
        if (selectedIds.size === 0) return;
        setShowConfirm(true);
    };

    const handleConfirmDelete = () => {
        onDelete(Array.from(selectedIds));
        setShowConfirm(false);
        onClose();
    };


    if (!isOpen) return null;

    const isAllSelected = filteredRecords.length > 0 && selectedIds.size === filteredRecords.length;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" role="dialog" aria-modal="true" aria-labelledby="bulk-delete-title">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col dark:bg-gray-800 dark:text-gray-100">
                    <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 id="bulk-delete-title" className="text-xl font-bold dark:text-white">Масове видалення записів</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 hover:dark:text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="p-6 flex-grow overflow-y-auto">
                        <div className="flex flex-wrap items-end gap-4 p-4 mb-4 border rounded-lg dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
                            <div className="flex-grow">
                                <label htmlFor="bulk-delete-start-date" className="text-sm font-medium text-gray-500 dark:text-gray-400">Показати записи з</label>
                                <input id="bulk-delete-start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-500" />
                            </div>
                            <div className="flex-grow">
                                <label htmlFor="bulk-delete-end-date" className="text-sm font-medium text-gray-500 dark:text-gray-400">по</label>
                                <input id="bulk-delete-end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-500" />
                            </div>
                        </div>
                        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 250px)' }}>
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} aria-label="Вибрати все" className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700" />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-200">Реєстр. №</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-200">Дата закінчення</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-200">Назва компанії</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-200">Експерт</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                    {filteredRecords.map(record => (
                                        <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-4 py-4">
                                                <input type="checkbox" checked={selectedIds.has(record.id)} onChange={() => handleSelect(record.id)} aria-labelledby={`record-label-${record.id}`} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700" />
                                            </td>
                                            <td id={`record-label-${record.id}`} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{record.registrationNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.endDate}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.companyName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.expert}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end items-center p-6 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                        <button onClick={onClose} type="button" className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 hover:dark:bg-gray-600">
                            Скасувати
                        </button>
                        <button onClick={handleDeleteClick} type="button" disabled={selectedIds.size === 0} className="ml-3 px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            Видалити вибране ({selectedIds.size})
                        </button>
                    </div>
                </div>
            </div>
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm dark:bg-gray-800">
                        <h3 id="confirm-delete-title" className="text-lg font-bold text-gray-900 dark:text-white">Підтвердження видалення</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            Ви дійсно хочете видалити {selectedIds.size} запис(ів)? Цю дію неможливо скасувати.
                        </p>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 hover:dark:bg-gray-600">
                                Скасувати
                            </button>
                            <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                Так, видалити
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BulkDeleteModal;