import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import styles from '../styles/ConfirmModal.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    type = 'danger',
    loading = false
}) => {
    const { t } = useTranslation('common');
    const resolvedConfirmText = confirmText ?? t('confirm');
    const resolvedCancelText = cancelText ?? t('cancel');
    const confirmButtonRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            confirmButtonRef.current?.focus();

            const handleEscape = (event) => {
                if (event.key === 'Escape' && !loading) {
                    onClose();
                }
            };

            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose, loading]);

    if (!isOpen) return null;

    const getBtnClass = (btnType) => {
        switch (btnType) {
            case 'danger': return commonBtnStyles.btnDanger;
            case 'warning': return commonBtnStyles.btnWarning;
            case 'info': return commonBtnStyles.btnInfo;
            case 'success': return commonBtnStyles.btnSuccess;
            default: return commonBtnStyles.btnPrimary;
        }
    };

    const handleConfirm = () => {
        if (!loading) {
            onConfirm();
        }
    };

    const handleCancel = () => {
        if (!loading) {
            onClose();
        }
    };

    return ReactDOM.createPortal(
        <div className={styles.overlay} onClick={handleCancel}>
            <div
                className={styles.content}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                aria-describedby="confirm-modal-message"
            >
                <div className={styles.header}>
                    <div className={`${styles.icon} ${styles[`icon${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}>
                        {type === 'danger' && <i className="fas fa-exclamation-triangle"></i>}
                        {type === 'warning' && <i className="fas fa-circle-exclamation"></i>}
                        {type === 'info' && <i className="fas fa-circle-info"></i>}
                        {type === 'success' && <i className="fas fa-circle-check"></i>}
                    </div>
                    <h3 id="confirm-modal-title" className={styles.title}>{title}</h3>
                </div>

                <div className={styles.body}>
                    <p id="confirm-modal-message">{message}</p>
                </div>

                <div className={styles.footer}>
                    <button
                        className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`}
                        onClick={handleCancel}
                        disabled={loading}
                        type="button"
                    >
                        {resolvedCancelText}
                    </button>
                    <button
                        ref={confirmButtonRef}
                        className={`${commonBtnStyles.btn} ${getBtnClass(type)}`}
                        onClick={handleConfirm}
                        disabled={loading}
                        type="button"
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> {t('processing')}
                            </>
                        ) : resolvedConfirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

ConfirmModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    type: PropTypes.oneOf(['danger', 'warning', 'info', 'success']),
    loading: PropTypes.bool
};

export default ConfirmModal;
