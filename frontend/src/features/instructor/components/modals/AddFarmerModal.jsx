import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import styles from '../../styles/InstructorModals.module.css';
import commonStyles from '../../styles/InstructorCommon.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';

const AddFarmerModal = ({ isOpen, onClose, onSubmit }) => {
    const { t } = useTranslation('instructor');
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        contact: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    return createPortal(
        <div
            className={styles.instructorModalFlex}
            onClick={onClose}
        >
            <div className={`${styles.instructorModalContent} ${commonStyles.customScrollbar}`} onClick={e => e.stopPropagation()}>
                <div className={styles.instructorModalHeader}>
                    <h3 className={styles.instructorModalTitle}>{t('addFarmer.title')}</h3>
                    <span className={styles.instructorClose} onClick={onClose}>&times;</span>
                </div>
                <div className={`${styles.instructorModalBody} ${commonStyles.customScrollbar}`}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group mb-3">
                            <label className="form-label">{t('addFarmer.nameLabel')}</label>
                            <input
                                type="text"
                                name="name"
                                className="form-control"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group mb-3">
                            <label className="form-label">{t('addFarmer.locationLabel')}</label>
                            <input
                                type="text"
                                name="location"
                                className="form-control"
                                value={formData.location}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group mb-4">
                            <label className="form-label">{t('addFarmer.contactNumber')}</label>
                            <input
                                type="text"
                                name="contact"
                                className="form-control"
                                value={formData.contact}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className={styles.instructorModalFooter}>
                            <button type="button" className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`} onClick={onClose}>{t('addFarmer.cancelBtn')}</button>
                            <button type="submit" className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSuccess}`}>{t('addFarmer.addBtn')}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};

AddFarmerModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};

export default AddFarmerModal;
