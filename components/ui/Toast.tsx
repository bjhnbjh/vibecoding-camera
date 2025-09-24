'use client';

import { useEffect, useState } from 'react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ 
  message, 
  type, 
  duration = 5000, 
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // 애니메이션 완료 후 제거
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-yellow-500 text-black'
  };

  const typeIcons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  return (
    <div
      className={`
        fixed top-4 left-4 right-4 z-50 p-4 rounded-lg shadow-lg
        transform transition-all duration-300
        ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}
        ${typeStyles[type]}
        max-w-md mx-auto
      `}
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg">{typeIcons[type]}</span>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-lg hover:opacity-75 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );
}
