import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import '../styles/confirm-modal.css';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    loading = false
}) => {
    const confirmButtonRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Focus the confirm button when modal opens
            confirmButtonRef.current?.focus();

            // Handle ESC key
            const handleEscape = (e) => {
                if (e.key === 'Escape' && !loading) {
                    onClose();
                }
            };

            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose, loading]);

    if (!isOpen) return null;

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
        <div className="confirm-modal-overlay" onClick={handleCancel}>
            <div
                className="confirm-modal-content"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                aria-describedby="confirm-modal-message"
            >
                <div className="confirm-modal-header">
                    <div className={`confirm-modal-icon confirm-modal-icon-${type}`}>
                        {type === 'danger' && <i className="fas fa-exclamation-triangle"></i>}
                        {type === 'warning' && <i className="fas fa-exclamation-circle"></i>}
                        {type === 'info' && <i className="fas fa-info-circle"></i>}
                        {type === 'success' && <i className="fas fa-check-circle"></i>}
                    </div>
                    <h3 id="confirm-modal-title" className="confirm-modal-title">{title}</h3>
                </div>

                <div className="confirm-modal-body">
                    <p id="confirm-modal-message">{message}</p>
                </div>

                <div className="confirm-modal-footer">
                    <button
                        className="btn btn-secondary"
                        onClick={handleCancel}
                        disabled={loading}
                        type="button"
                    >
                        {cancelText}
                    </button>
                    <button
                        ref={confirmButtonRef}
                        className={`btn btn-${type}`}
                        onClick={handleConfirm}
                        disabled={loading}
                        type="button"
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Processing...
                            </>
                        ) : confirmText}
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
