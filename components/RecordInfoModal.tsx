import React from 'react';
import type { Record as AppRecord } from '../types';
import type { AppMode } from '../App';

interface RecordInfoModalProps {
    record: AppRecord & { sumWithoutDiscount: number, sumWithDiscount: number };
    onClose: () => void;
    activeMode: AppMode;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        const day = String(adjustedDate.getDate()).padStart(2, '0');
        const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
        const year = adjustedDate.getFullYear();
        return `${day}.${month}.${year}`;
    } catch (e) {
        return dateStr;
    }
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100 dark:border-gray-700">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="col-span-2 text-sm text-gray-900 dark:text-white font-semibold">{value}</dd>
    </div>
);

const RecordInfoModal: React.FC<RecordInfoModalProps> = ({ record, onClose, activeMode }) => {
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="info-modal-title"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col dark:bg-gray-800 dark:text-gray-100"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 id="info-modal-title" className="text-lg font-bold dark:text-white">Інформація про запис</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 hover:dark:text-gray-300" aria-label="Закрити">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <dl>
                        <InfoRow label="Реєстраційний номер" value={record.registrationNumber} />
                        <InfoRow label="Дата початку" value={formatDate(record.startDate)} />
                        <InfoRow label="Дата закінчення" value={formatDate(record.endDate)} />
                        <InfoRow label="Назва компанії" value={record.companyName} />
                        <InfoRow label={activeMode === 'conclusions' ? 'Сума без знижки' : 'Сума без ПДВ'} value={formatCurrency(record.sumWithoutDiscount)} />
                        {activeMode === 'conclusions' && (
                           <InfoRow label="Сума зі знижкою" value={formatCurrency(record.sumWithDiscount)} />
                        )}
                        <InfoRow label="ПІБ експерта" value={record.expert} />
                    </dl>
                </div>

                <div className="flex justify-end items-center p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl dark:border-gray-700 dark:bg-gray-700/50">
                    <button onClick={onClose} type="button" className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                        Закрити
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecordInfoModal;
