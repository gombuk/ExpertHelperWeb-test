import React, { useState } from 'react';
import { CurrentUser, User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: CurrentUser) => void;
  users: User[]; // Pass users list for fallback
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, users }) => {
  const [view, setView] = useState<'login' | 'recover'>('login');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password }),
        });
        const data = await response.json();
        if (response.ok) {
            onLoginSuccess(data.user);
        } else {
            setError(data.error || 'Неправильний логін або пароль');
        }
    } catch (err) {
        console.warn('API call failed, using fallback authentication.');
        const savedUsersRaw = sessionStorage.getItem('users');
        const userList = savedUsersRaw ? JSON.parse(savedUsersRaw) : [
            { id: 1, login: 'admin', fullName: 'Адміністратор', password: 'Admin2025!', role: 'admin', email: 'admin@example.com' },
            { id: 2, login: 'Gomba', fullName: 'Гомба Ю.В.', password: 'Gomba2025!', role: 'user', email: 'gomba@example.com' },
            { id: 3, login: 'Dan', fullName: 'Дан Т.О.', password: 'Dan2025!', role: 'user', email: 'dan@example.com' },
            { id: 4, login: 'Snietkov', fullName: 'Снєтков С.Ю.', password: 'Snietkov2025!', role: 'user', email: 'snietkov@example.com' }
        ];

        const user = userList.find((u: User) => u.login === login && u.password === password);
        if (user) {
            onLoginSuccess({ login: user.login, fullName: user.fullName, role: user.role });
        } else {
            setError('Неправильний логін або пароль (демо)');
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
        const response = await fetch('/api/recover-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (response.ok) {
            setMessage(data.message);
        } else {
            setError(data.error || 'Помилка відновлення');
        }
    } catch (err) {
        console.warn('API call failed, using fallback recovery.');
        setMessage('Якщо такий e-mail існує, інструкції для відновлення було надіслано (демо).');
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-lg dark:bg-gray-800">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
          ExpertHelper Web
        </h1>
        {view === 'login' ? (
          <>
            <p className="text-center text-gray-500 dark:text-gray-400">
                Будь ласка, введіть логін та пароль
            </p>
            <form className="space-y-6" onSubmit={handleLoginSubmit}>
              <div>
                <label htmlFor="login" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Логін
                </label>
                <div className="mt-1">
                  <input
                    id="login"
                    name="login"
                    type="text"
                    autoComplete="username"
                    required
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Пароль
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-center text-red-600 dark:text-red-400">{error}</p>}
              {message && <p className="text-sm text-center text-green-600 dark:text-green-400">{message}</p>}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:focus:ring-offset-gray-800"
                >
                  {isLoading ? 'Вхід...' : 'Увійти'}
                </button>
              </div>
              <div className="text-center">
                <button type="button" onClick={() => setView('recover')} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                    Забули пароль?
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <p className="text-center text-gray-500 dark:text-gray-400">
                Введіть ваш e-mail для відновлення
            </p>
            <form className="space-y-6" onSubmit={handleRecoverySubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  E-mail
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-center text-red-600 dark:text-red-400">{error}</p>}
              {message && <p className="text-sm text-center text-green-600 dark:text-green-400">{message}</p>}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:focus:ring-offset-gray-800"
                >
                  {isLoading ? 'Відновлення...' : 'Відновити пароль'}
                </button>
              </div>
              <div className="text-center">
                <button type="button" onClick={() => { setView('login'); setError(''); setMessage(''); }} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                    Повернутися до входу
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;