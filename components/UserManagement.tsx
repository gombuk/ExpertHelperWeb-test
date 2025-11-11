import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import type { View } from '../App';

interface UserManagementProps {
    setCurrentView: (view: View) => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const BackArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 hover:text-blue-700" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 hover:text-red-700" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const UserManagement: React.FC<UserManagementProps> = ({ setCurrentView, showToast }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                throw new Error('Failed to fetch users');
            }
        } catch (error) {
            showToast('Помилка завантаження користувачів. Використовуються демонстраційні дані.', 'error');
            // Fallback for AI Studio
            setUsers([
              { id: 1, login: 'admin', fullName: 'admin', password: 'Admin2025!', role: 'admin' },
              { id: 2, login: 'Gomba', fullName: 'Гомба Ю.В.', password: 'Gomba2025!', role: 'user' },
              { id: 3, login: 'Dan', fullName: 'Дан Т.О.', password: 'Dan2025!', role: 'user' },
              { id: 4, login: 'Snietkov', fullName: 'Снєтков С.Ю.', password: 'Snietkov2025!', role: 'user' }
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleOpenModal = (user: User | null = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingUser(null);
        setIsModalOpen(false);
    };

    const handleSaveUser = async (user: Omit<User, 'id'> | User) => {
        const isEditing = 'id' in user;
        
        // AI Studio fallback logic
        if (isEditing) {
            setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? user : u));
            showToast('Користувача оновлено (демо-режим)');
        } else {
            const newUser = { ...user, id: Date.now() };
            setUsers(prevUsers => [...prevUsers, newUser]);
            showToast('Користувача створено (демо-режим)');
        }
        handleCloseModal();
    };

    const handleDeleteUser = async (id: number) => {
        if (window.confirm('Ви впевнені, що хочете видалити цього користувача?')) {
             // AI Studio fallback logic
            setUsers(prevUsers => prevUsers.filter(u => u.id !== id));
            showToast('Користувача видалено (демо-режим)');
        }
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md dark:bg-gray-800 dark:text-gray-100">
            <button onClick={() => setCurrentView('dashboard')} className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 dark:text-gray-300 hover:dark:text-white">
                <BackArrowIcon />
                Повернутися назад
            </button>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Управління користувачами</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    + Додати користувача
                </button>
            </div>

            {isLoading ? (
                <p>Завантаження...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-200">Логін</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-200">ПІБ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-200">Пароль</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-200">Роль</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-200">Дії</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.login}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.fullName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.password}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-4">
                                            <button onClick={() => handleOpenModal(user)} title="Редагувати"><EditIcon /></button>
                                            <button onClick={() => handleDeleteUser(user.id)} title="Видалити"><DeleteIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {isModalOpen && <UserModal user={editingUser} onSave={handleSaveUser} onClose={handleCloseModal} />}
        </div>
    );
};

// UserModal Component
interface UserModalProps {
    user: User | null;
    onSave: (user: Omit<User, 'id'> | User) => void;
    onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onSave, onClose }) => {
    const [login, setLogin] = useState(user?.login || '');
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [password, setPassword] = useState(user?.password || '');
    const [role, setRole] = useState<'admin' | 'user'>(user?.role || 'user');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const userData = { login, fullName, password, role };
        if (user) {
            onSave({ ...userData, id: user.id });
        } else {
            onSave(userData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md dark:bg-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{user ? 'Редагувати' : 'Створити'} користувача</h3>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Логін</label>
                            <input type="text" value={login} onChange={e => setLogin(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">ПІБ</label>
                            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Пароль</label>
                            <input type="text" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Роль</label>
                            <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'user')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="user">Користувач</option>
                                <option value="admin">Адміністратор</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 hover:dark:bg-gray-600">Скасувати</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Зберегти</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserManagement;