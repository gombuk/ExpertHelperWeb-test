
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto-close after 3 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const baseClasses = "fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-lg text-white flex items-center animate-fade-in-down";
  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
  };

  const Icon = () => {
      if (type === 'success') {
          return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
      }
      return null;
  }

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
        <Icon />
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white font-bold text-xl leading-none">&times;</button>
    </div>
  );
};

export default Toast;