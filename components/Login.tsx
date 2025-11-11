import React, { useState } from 'react';
import { CurrentUser } from '../types';

interface LoginProps {
  onLoginSuccess: (user: CurrentUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ login, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            onLoginSuccess(data.user);
        } else {
            setError(data.error || 'Неправильний логін або пароль');
        }
    } catch (err) {
        setError('Помилка підключення до сервера. Спробуйте пізніше.');
        console.error('Login failed:', err);
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
        <p className="text-center text-gray-500 dark:text-gray-400">
            Будь ласка, введіть логін та пароль
        </p>
        <form className="space-y-6" onSubmit={handleSubmit}>
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

          {error && (
            <p className="text-sm text-center text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:focus:ring-offset-gray-800"
            >
              {isLoading ? 'Вхід...' : 'Увійти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;