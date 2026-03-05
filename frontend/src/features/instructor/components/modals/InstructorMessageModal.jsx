import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import styles from '../../styles/InstructorMessageModal.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import { getAccessToken } from '@/utils/authStorage';

const InstructorMessageModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        recipient_type: 'farmers', // Backend ENUM: 'all', 'farmers', 'instructors', 'select'
        recipient_ids: [], // We'll handle multiple recipients by mapping to individual rows in the backend
        subject: '',
        content: '',
        attachment: null
    });

    const [farmers, setFarmers] = useState([]);
    const [isLoadingFarmers, setIsLoadingFarmers] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fileInputRef = useRef(null);
    const [isSending, setIsSending] = useState(false);

    const { t } = useTranslation('instructor');

    const filteredFarmers = farmers.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.displayId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleFarmerSelection = (id) => {
        setFormData(prev => {
            const recipient_ids = prev.recipient_ids.includes(id)
                ? prev.recipient_ids.filter(rid => rid !== id)
                : [...prev.recipient_ids, id];
            return { ...prev, recipient_ids };
        });
    };

    const toggleSelectAll = () => {
        const allFilteredIds = filteredFarmers.map(f => f.id);
        const areAllSelected = allFilteredIds.every(id => formData.recipient_ids.includes(id));

        if (areAllSelected) {
            setFormData(prev => ({
                ...prev,
                recipient_ids: prev.recipient_ids.filter(id => !allFilteredIds.includes(id))
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                recipient_ids: Array.from(new Set([...prev.recipient_ids, ...allFilteredIds]))
            }));
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

    const removeAttachment = () => {
        setFormData({ ...formData, attachment: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!formData.subject.trim() || !formData.content.trim()) {
            alert('Please fill in both subject and message fields');
            return;
        }

        if (formData.recipient_type === 'farmers' && formData.recipient_ids.length === 0) {
            alert('Please select at least one farmer recipient');
            return;
        }

        setIsSending(true);

        const data = new FormData();
        data.append('subject', formData.subject);
        data.append('content', formData.content);

        if (formData.recipient_type === 'farmers') {
            data.append('recipient_type', 'select');
            data.append('recipient_ids', JSON.stringify(formData.recipient_ids));
        } else {
            data.append('recipient_type', formData.recipient_type);
        }

        if (formData.attachment) {
            data.append('attachment', formData.attachment);
        }

        try {
            await onSubmit(data);
            setFormData({
                recipient_type: 'farmers',
                recipient_ids: [],
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

    useEffect(() => {
        let isMounted = true;

        const fetchFarmers = async () => {
            if (!isMounted) return;
            try {
                const res = await fetch('/api/instructor/farmers', {
                    headers: { 'Authorization': `Bearer ${getAccessToken()}` }
                });
                const data = await res.json();
                if (data.success && isMounted) {
                    setFarmers(data.data.map(f => ({
                        id: f.id,
                        name: f.name,
                        displayId: f.displayId || `FARM-${f.id.toString().padStart(4, '0')}`
                    })));
                }
            } catch (error) {
                if (isMounted) console.error('Error fetching farmers:', error);
            } finally {
                if (isMounted) setIsLoadingFarmers(false);
            }
        };

        if (isOpen) fetchFarmers();

        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className={styles.instructorModalActive}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className={`${styles.instructorModalContent} ${styles.customScrollbar}`}>
                <div className={styles.instructorModalHeader}>
                    <div className={styles.instructorModalTitle}>{t('msgModal.title')}</div>
                    <button className={styles.instructorModalCloseRound} onClick={onClose}>
                        <i className="fas fa-xmark"></i>
                    </button>
                </div>

                <div className={`${styles.instructorModalBody} ${styles.customScrollbar}`}>
                    <div className={styles.instructorFormGroup}>
                        <label htmlFor="recipientType">{t('msgModal.sendTo')}</label>
                        <select
                            id="recipientType"
                            className={styles.instructorFormControl}
                            value={formData.recipient_type}
                            onChange={(e) => setFormData({ ...formData, recipient_type: e.target.value })}
                        >
                            <option value="farmers">{t('msgModal.registeredFarmers')}</option>
                            <option value="admin">{t('msgModal.systemAdmins')}</option>
                        </select>
                    </div>

                    {formData.recipient_type === 'farmers' && (
                        <div className={styles.instructorFormGroup}>
                            <label>Recipients ({formData.recipient_ids.length} selected):</label>
                            <div className={`${styles.userSelectionContainer} ${styles.customScrollbar}`}>
                                <div className={styles.farmerSearchContainer}>
                                    <input
                                        type="text"
                                        className={styles.instructorFormControl}
                                        placeholder={t('msgModal.searchFarmers')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <i className={`fas fa-search ${styles.searchIcon}`}></i>
                                </div>

                                <div className={styles.selectAllContainer}>
                                    <label className={styles.userCheckboxItem}>
                                        <input
                                            type="checkbox"
                                            checked={filteredFarmers.length > 0 && filteredFarmers.every(f => formData.recipient_ids.includes(f.id))}
                                            onChange={toggleSelectAll}
                                        />
                                        <span>Select All Filtered ({filteredFarmers.length})</span>
                                    </label>
                                </div>

                                <div className={`${styles.farmerList} ${styles.customScrollbar}`}>
                                    {filteredFarmers.length > 0 ? (
                                        filteredFarmers.map(farmer => (
                                            <div
                                                key={farmer.id}
                                                className={styles.userCheckboxItem}
                                                onClick={() => toggleFarmerSelection(farmer.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.recipient_ids.includes(farmer.id)}
                                                    onChange={() => { }}
                                                />
                                                <span>{farmer.name} ({farmer.displayId})</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className={styles.messageEmptyText}>{t('msgModal.noFarmers')}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.instructorFormGroup}>
                        <label htmlFor="messageSubject">{t('msgModal.subject')}</label>
                        <input
                            type="text"
                            id="messageSubject"
                            className={styles.instructorFormControl}
                            placeholder={t('msgModal.subjectPlaceholder')}
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        />
                    </div>

                    <div className={styles.instructorFormGroup}>
                        <label htmlFor="messageContent">{t('msgModal.messageContent')}</label>
                        <textarea
                            id="messageContent"
                            className={styles.instructorFormControl}
                            rows="6"
                            placeholder={t('msgModal.messagePlaceholder')}
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        ></textarea>
                    </div>

                    <div className={styles.instructorFormGroup}>
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
                                className={styles.hidden}
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
                                    <div className={styles.fileSize}>{(formData.attachment.size / 1024).toFixed(1)} KB</div>
                                </div>
                                {formData.attachment.type.startsWith('image/') && (
                                    <div className={styles.filePreview}>
                                        <img
                                            src={URL.createObjectURL(formData.attachment)}
                                            alt={t('msgModal.preview')}
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

                <div className={styles.instructorModalFooter}>
                    <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`} onClick={onClose} disabled={isSending}>{t('msgModal.cancel')}</button>
                    <button className={styles.btnSend} onClick={handleSubmit} disabled={isSending}>
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

InstructorMessageModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};

export default InstructorMessageModal;
