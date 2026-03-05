import React, { createContext, useContext, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import styles from '../styles/Toast.module.css';

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
    const newToast = { id, message, type, visible: true };

    setToasts(prev => [...prev, newToast]);

    const fadeDuration = Math.min(300, duration);

    setTimeout(() => {
      setToasts(prev => prev.map(t => (t.id === id ? { ...t, visible: false } : t)));
    }, duration - fadeDuration);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getToastClass = (type) => {
    switch (type) {
      case 'success': return styles.toastSuccess;
      case 'error': return styles.toastError;
      case 'warning': return styles.toastWarning;
      case 'info': return styles.toastInfo;
      default: return styles.toastInfo;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && ReactDOM.createPortal(
        <div className={styles.toastContainer}>
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`${styles.toast} ${getToastClass(toast.type)} ${toast.visible ? styles.toastShow : ''}`}
              onClick={() => removeToast(toast.id)}
            >
              <div className={styles.toastIcon}>
                {toast.type === 'success' && <i className="fas fa-circle-check"></i>}
                {toast.type === 'error' && <i className="fas fa-circle-exclamation"></i>}
                {toast.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                {toast.type === 'info' && <i className="fas fa-circle-info"></i>}
              </div>
              <div className={styles.toastMessage}>{toast.message}</div>
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
