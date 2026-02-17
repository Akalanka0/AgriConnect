import React, { createContext, useContext, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import '../styles/toast.css';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration
    setTimeout(() => {
      setToasts(prev => {
        const exists = prev.some(t => t.id === id);
        if (exists) {
          return prev.filter(t => t.id !== id);
        }
        return prev;
      });
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && ReactDOM.createPortal(
        <div className="toast-container">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`toast toast-${toast.type}`}
              onClick={() => removeToast(toast.id)}
            >
              <div className="toast-icon">
                {toast.type === 'success' && <i className="fas fa-check-circle"></i>}
                {toast.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
                {toast.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                {toast.type === 'info' && <i className="fas fa-info-circle"></i>}
              </div>
              <div className="toast-message">{toast.message}</div>
              <button
                className="toast-close"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                aria-label="Close notification"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default ToastProvider;
