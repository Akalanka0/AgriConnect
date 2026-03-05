import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import styles from '../styles/MessageModal.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';

const MessageModal = ({ isOpen, onClose, instructors = [], onSubmit }) => {
    const { t } = useTranslation('farmer');
    const [formData, setFormData] = useState({
        recipient_type: instructors.length === 1 ? 'instructor' : 'admin',
        recipient_id: instructors.length === 1 ? instructors[0].dbId : null,
        subject: '',
        content: '',
        attachment: null
    });

    const fileInputRef = useRef(null);
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleRecipientChange = (val) => {
        if (val === 'admin') {
            setFormData({ ...formData, recipient_type: 'admin', recipient_id: null });
        } else if (val.startsWith('instructor_')) {
            const dbId = parseInt(val.replace('instructor_', ''), 10);
            setFormData({ ...formData, recipient_type: 'instructor', recipient_id: dbId });
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size exceeds 10MB limit');
                return;
            }

            // Check file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                alert('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed');
                return;
            }

            setFormData({ ...formData, attachment: file });
        }
    };

    const removeAttachment = (e) => {
        e.stopPropagation();
        setFormData({ ...formData, attachment: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!formData.subject || !formData.content) {
            alert('Please fill in both subject and message fields');
            return;
        }

        // Validate recipient selection
        if (formData.recipient_type === 'instructor' && !formData.recipient_id) {
            alert('Please select a valid recipient');
            return;
        }

        setIsSending(true);

        // Use FormData for file upload support
        const data = new FormData();
        data.append('subject', formData.subject);
        data.append('content', formData.content);
        data.append('recipient_type', formData.recipient_type === 'instructor' ? 'select' : formData.recipient_type);

        // Handle recipient_ids for instructor type
        if (formData.recipient_type === 'instructor' && formData.recipient_id) {
            data.append('recipient_ids', JSON.stringify([formData.recipient_id]));
        }

        if (formData.attachment) {
            data.append('attachment', formData.attachment);
        }

        try {
            await onSubmit(data);
            setFormData({
                recipient_type: instructors.length === 1 ? 'instructor' : 'admin',
                recipient_id: instructors.length === 1 ? instructors[0].dbId : null,
                subject: '',
                content: '',
                attachment: null
            });
            onClose();
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    return createPortal(
        <div
            className={styles.modalOverlay}
            id="farmerMessageModal"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>{t('msgModal.title')}</div>
                    <button className={styles.modalCloseRound} onClick={onClose}>
                        <i className="fas fa-xmark"></i>
                    </button>
                </div>

                <div className={`${styles.modalBody} ${styles.customScrollbar}`}>
                    <div className={styles.formGroup}>
                        <label htmlFor="recipientType">{t('msgModal.sendTo')}</label>
                        <select
                            id="recipientType"
                            className={styles.formControl}
                            value={
                                formData.recipient_type === 'instructor' && formData.recipient_id
                                    ? `instructor_${formData.recipient_id}`
                                    : 'admin'
                            }
                            onChange={(e) => handleRecipientChange(e.target.value)}
                        >
                            {instructors.length === 0 ? (
                                <option value="admin">{t('msgModal.systemAdmin')}</option>
                            ) : (
                                <>
                                    {instructors.length > 1 && (
                                        <optgroup label="Your Instructors">
                                            {instructors.map(inst => (
                                                <option key={inst.dbId} value={`instructor_${inst.dbId}`}>
                                                    {inst.name} ({inst.id})
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                    {instructors.length === 1 && (
                                        <option value={`instructor_${instructors[0].dbId}`}>
                                            {instructors[0].name} ({instructors[0].id})
                                        </option>
                                    )}
                                    <option value="admin">{t('msgModal.systemAdmin')}</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="messageSubject">{t('msgModal.subject')}</label>
                        <input
                            type="text"
                            id="messageSubject"
                            className={styles.formControl}
                            placeholder={t('msgModal.subjectPlaceholder')}
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="messageContent">{t('msgModal.messageContent')}</label>
                        <textarea
                            id="messageContent"
                            className={styles.formControl}
                            rows="6"
                            placeholder={t('msgModal.messagePlaceholder')}
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        ></textarea>
                    </div>

                    <div className={styles.formGroup}>
                        <label>{t('msgModal.attachment')}</label>
                        <div
                            className={styles.fileUploadZone}
                            onClick={() => fileInputRef.current.click()}
                        >
                            <div className={styles.uploadIconWrapper}>
                                <i className="fas fa-cloud-upload-alt"></i>
                            </div>
                            <div className={styles.uploadTextPrimary}>{t('msgModal.addAttachment')}</div>
                            <div className={styles.uploadTextSecondary}>{t('msgModal.attachmentHint')}</div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className={styles.fileInputHidden}
                                onChange={handleFileSelect}
                            />
                        </div>
                        {formData.attachment && (
                            <div className={styles.fileInfoCard}>
                                <div className={styles.fileIcon}>
                                    <i className="fas fa-file-lines"></i>
                                </div>
                                <div className={styles.fileDetails}>
                                    <span className={styles.fileName}>{formData.attachment.name}</span>
                                    <span className={styles.fileSize}>{(formData.attachment.size / 1024).toFixed(1)} KB</span>
                                </div>
                                {formData.attachment.type.startsWith('image/') && (
                                    <div className={styles.filePreview}>
                                        <img
                                            src={URL.createObjectURL(formData.attachment)}
                                            alt={t('msgModal.preview')}
                                            className={styles.filePreviewImage}
                                        />
                                    </div>
                                )}
                                <button type="button" className={styles.btnRemoveFile} onClick={removeAttachment}>
                                    <i className="fas fa-trash-can"></i>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`} onClick={onClose} disabled={isSending}>{t('msgModal.cancel')}</button>
                    <button className={`${commonBtnStyles.btn} ${styles.btnSend}`} onClick={handleSubmit} disabled={isSending}>
                        {isSending ? (
                            <><i className="fas fa-spinner fa-spin"></i> {t('msgModal.sending')}</>
                        ) : (
                            <><i className="fas fa-paper-plane"></i> {t('msgModal.send')}</>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

MessageModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    instructors: PropTypes.arrayOf(PropTypes.shape({
        dbId: PropTypes.number,
        id: PropTypes.string,
        name: PropTypes.string
    })),
    onSubmit: PropTypes.func.isRequired
};

export default MessageModal;
