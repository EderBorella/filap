import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import Toast, { ToastType } from './Toast';
import './Toast.scss';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  delay: number;
}

interface ToastContextType {
  showSuccess: (message: string, delay?: number) => number;
  showError: (message: string, delay?: number) => number;
  showInfo: (message: string, delay?: number) => number;
  clearAll: () => void;
}

interface ToastProviderProps {
  children: ReactNode;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string, delay: number = 5000): number => {
    const id = Date.now() + Math.random(); // Simple unique ID
    const newToast: ToastItem = { id, type, message, delay };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id: string | number): void => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, delay?: number): number => addToast('success', message, delay), [addToast]);
  const showError = useCallback((message: string, delay?: number): number => addToast('error', message, delay), [addToast]);
  const showInfo = useCallback((message: string, delay?: number): number => addToast('info', message, delay), [addToast]);

  const clearAll = useCallback((): void => {
    setToasts([]);
  }, []);

  const value = useMemo(() => ({
    showSuccess, showError, showInfo, clearAll
  }), [showSuccess, showError, showInfo, clearAll]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              type={toast.type}
              message={toast.message}
              delay={toast.delay}
              onClose={removeToast}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};