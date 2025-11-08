
import React, { useState, useEffect } from 'react';
import type { Firm } from '../types';
import type { View, AppMode } from '../App';
import { generateFirmsHtml } from '../utils/generateOrderHtml';

interface FirmsProps {
    setCurrentView: (view: View) => void;
    firms: Firm[];
    onAddFirm: (newFirm: Omit<Firm, 'id'>) => void;
    onUpdateFirm: (updatedFirm: Firm) => void;
    onDeleteFirm: (id: number) => void;
    onCopyFirm: (firm: Firm) => void;
    activeMode: AppMode;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const BackArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3l-4 4-4-4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3" />
    </svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 hover:text-green-700" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const PrintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
);


const initialFormState: Omit<Firm, 'id'> = {
    name: '',
    address: '',
    directorName: '',
    edrpou: '',
    taxNumber: '',
    productName: '',
};

const Firms: React.FC<FirmsProps> = ({ setCurrentView, firms, onAddFirm, onUpdateFirm, onDeleteFirm, onCopyFirm, activeMode, showToast }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formState, setFormState] = useState<Omit<Firm, 'id'> | Firm>(initialFormState);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [firmToDelete, setFirmToDelete] = useState<number | null>(null);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [firmToCopy, setFirmToCopy] = useState<Firm | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleEditClick = (firm: Firm) => {
        setIsEditing(true);
        setFormState(firm);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormState(initialFormState);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, address, directorName, edrpou, taxNumber, productName } = formState;
        if (!name.trim() || !address.trim() || !directorName.trim() || !edrpou.trim() || !taxNumber.trim() || !productName.trim()) return;

        if (isEditing) {
            onUpdateFirm(formState as Firm);
            showToast('Дані оновлено');
        } else {
            onAddFirm(formState as Omit<Firm, 'id'>);
            showToast('Дані збережено');
        }
        handleCancel();
    };

    const handleOpenDeleteModal = (id: number) => {
        setFirmToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setFirmToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const handleConfirmDelete = () => {
        if (firmToDelete !== null) {
            onDeleteFirm(firmToDelete);
        }
        handleCloseDeleteModal();
    };

    const handleOpenCopyModal = (firm: Firm) => {
        setFirmToCopy(firm);
        setIsCopyModalOpen(true);
    };

    const handleCloseCopyModal = () => {
        setFirmToCopy(null);
        setIsCopyModalOpen(false);
    };

    const handleConfirmCopy = () => {
        if (firmToCopy) {
            onCopyFirm(firmToCopy);
        }
        handleCloseCopyModal();
    };

    const handlePrintFirms = () => {
        const html = generateFirmsHtml(firms, activeMode);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        } else {
            showToast('Не вдалося відкрити нове вікно. Будь ласка, дозвольте спливаючі вікна для цього сайту.', 'error');
        }
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md dark:bg-gray-800 dark:text-gray-100">
            <button onClick={() => setCurrentView('dashboard')} className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 dark:text-gray-300 hover:dark:text-white">
                <BackArrowIcon />
                Повернутися назад
            </button>

            <h1 className="text-2xl font-bold mb-6 dark:text-white">Управління фірмами</h1>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8 dark:bg-gray-700 dark:border-gray-600">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">{isEditing ? 'Редагувати фірму' : 'Додати нову фірму'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Назва фірми *</label>
                            <input type="text" id="name" name="name" value={formState.name} onChange={handleInputChange} placeholder="Введіть назву фірми" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Адреса *</label>
                            <input type="text" id="address" name="address" value={formState.address} onChange={handleInputChange} placeholder="Введіть адресу" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="directorName" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">ПІБ директора *</label>
                            <input type="text" id="directorName" name="directorName" value={formState.directorName} onChange={handleInputChange} placeholder="Введіть ПІБ директора" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="edrpou" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Код ЄДРПОУ *</label>
                            <input type="text" id="edrpou" name="edrpou" value={formState.edrpou} onChange={handleInputChange} placeholder="Введіть код ЄДРПОУ" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="taxNumber" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">ІПН *</label>
                            <input type="text" id="taxNumber" name="taxNumber" value={formState.taxNumber} onChange={handleInputChange} placeholder="Введіть ІПН" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                        </div>
                         <div>
                            <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Найменування товару *</label>
                            <input type="text" id="productName" name="productName" value={formState.productName} onChange={handleInputChange} placeholder="Введіть найменування" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 space-x-3">
                        {isEditing && (
                            <button type="button" onClick={handleCancel} className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 hover:dark:bg-gray-600">
                                Скасувати
                            </button>
                        )}
                        <button type="submit" className="flex items-center justify-center px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                            <SaveIcon />
                            {isEditing ? 'Оновити' : 'Додати'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold dark:text-white">Список фірм</h2>
                    <button
                        onClick={handlePrintFirms}
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-600 dark:text-gray-100 hover:dark:bg-gray-500"
                    >
                        <PrintIcon />
                        Роздрукувати
                    </button>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">Назва фірми</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">Найменування товару</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">Адреса</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">ПІБ директора</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">ЄДРПОУ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">ІПН</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">Дії</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            {firms.map((firm) => (
                                <tr key={firm.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{firm.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{firm.productName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{firm.address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{firm.directorName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{firm.edrpou}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{firm.taxNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-3">
                                            <button onClick={() => handleEditClick(firm)} title="Редагувати" className="focus:outline-none"><EditIcon /></button>
                                            <button onClick={() => handleOpenCopyModal(firm)} title={`Копіювати до ${activeMode === 'conclusions' ? 'Сертифікатів' : 'Висновків'}`} className="focus:outline-none"><CopyIcon /></button>
                                            <button onClick={() => handleOpenDeleteModal(firm.id)} title="Видалити" className="focus:outline-none"><DeleteIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm dark:bg-gray-800 dark:text-gray-100">
                        <h3 id="delete-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">Підтвердження видалення</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Ви впевнені, що хочете видалити цю фірму? Цю дію неможливо буде скасувати.</p>
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
            {isCopyModalOpen && firmToCopy && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" role="dialog" aria-modal="true" aria-labelledby="copy-modal-title">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm dark:bg-gray-800 dark:text-gray-100">
                        <h3 id="copy-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">Підтвердження копіювання</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            Ви впевнені, що хочете скопіювати фірму "{firmToCopy.name}" до списку "{activeMode === 'conclusions' ? 'Сертифікати' : 'Висновки'}"?
                        </p>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button 
                                onClick={handleCloseCopyModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 hover:dark:bg-gray-600"
                            >
                                Скасувати
                            </button>
                            <button 
                                onClick={handleConfirmCopy}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Копіювати
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Firms;
