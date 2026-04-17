import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { instructorAPI } from '../../../../services/instructorService.js';
import styles from '../../styles/InstructorModals.module.css';
import commonStyles from '../../styles/InstructorCommon.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';

const FarmerDetailsModal = ({ isOpen, onClose, farmerId }) => {
    const { t } = useTranslation('instructor');
    const [farmer, setFarmer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchDetails = async () => {
            if (!farmerId) return;
            setLoading(true);
            setError(null);

            try {
                const response = await instructorAPI.getFarmer(farmerId);

                if (isMounted) {
                    if (response.success) {
                        setFarmer(response.data);
                    } else {
                        setError(response.error?.message || 'Failed to fetch details');
                    }
                }
            } catch (err) {
                console.error('Fetch error:', err);
                if (isMounted) {
                    setError('Failed to fetch farmer details');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        if (isOpen && farmerId) {
            fetchDetails();
        }

        return () => {
            isMounted = false;
        };
    }, [isOpen, farmerId]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className={styles.instructorModalFlex}
            onClick={onClose}
        >
            <div className={`${styles.instructorModalContent} ${styles.instructorModalContentLarge} ${commonStyles.customScrollbar}`} onClick={e => e.stopPropagation()}>
                <div className={styles.instructorModalHeader}>
                    <h3 className={styles.instructorModalTitle}>{t('farmerDetails.title')}</h3>
                    <span className={styles.instructorClose} onClick={onClose}><i className="fas fa-xmark"></i></span>
                </div>

                <div className={`${styles.instructorModalBody} ${commonStyles.customScrollbar}`}>
                    {loading ? (
                        <div className={styles.farmerLoading}>
                            <i className={`fas fa-spinner fa-spin ${styles.farmerLoadingIcon}`}></i>
                            <p>{t('farmerDetails.loading')}</p>
                        </div>
                    ) : error ? (
                        <div className="alert alert-danger">{error}</div>
                    ) : farmer ? (
                        <div>
                            <div className={styles.farmerProfileHeader}>
                                <div className={styles.farmerAvatarContainer}>
                                    {farmer.profilePicture ? (
                                        <img
                                            src={farmer.profilePicture.startsWith('http') ? farmer.profilePicture : `/${farmer.profilePicture}`}
                                            alt={farmer.name}
                                            className={styles.farmerAvatarImg}
                                        />
                                    ) : (
                                        <i className="fas fa-user"></i>
                                    )}
                                </div>
                                <div>
                                    <h2 className={styles.farmerName}>{farmer.name}</h2>
                                    <div className="badge bg-success">{t('farmerDetails.active')}</div>
                                    <div className={styles.farmerId}>ID: {farmer.displayId}</div>
                                </div>
                            </div>

                            <div className={styles.farmerInfoGrid}>
                                <div className={styles.infoItem}>
                                    <label className={styles.farmerLabel}>{t('farmerDetails.emailAddress')}</label>
                                    <div className={styles.farmerValue}>{farmer.email}</div>
                                </div>
                                <div className={styles.infoItem}>
                                    <label className={styles.farmerLabel}>{t('farmerDetails.phoneNumber')}</label>
                                    <div className={styles.farmerValue}>{farmer.phone}</div>
                                </div>
                                <div className={styles.infoItem}>
                                    <label className={styles.farmerLabel}>{t('farmerDetails.nic')}</label>
                                    <div className={styles.farmerValue}>{farmer.nic || 'N/A'}</div>
                                </div>
                                <div className={styles.infoItem}>
                                    <label className={styles.farmerLabel}>{t('farmerDetails.joinedDate')}</label>
                                    <div className={styles.farmerValue}>{new Date(farmer.joined).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <hr className={styles.farmerDivider} />

                            <h4 className={styles.farmerSectionTitle}>
                                <i className={`fas fa-location-dot ${styles.farmerSectionIcon}`}></i>
                                {t('farmerDetails.locationLand')}
                            </h4>

                            <div className={styles.farmerLocationRow}>
                                <div>
                                      <span className={styles.farmerLocationLabel}>{t('farmerDetails.zone')}</span> <strong>{farmer.locations?.length > 0 ? Array.from(new Set(farmer.locations.map(loc => loc.zone).filter(Boolean))).join(', ') || 'N/A' : farmer.zone}</strong>                                  </div>
                              </div>
                            {farmer.locations && farmer.locations.length > 0 && (
                                <div className="land-locations">
                                    <label className={styles.farmerRegisteredLandsLabel}>{t('farmerDetails.registeredLands')}</label>
                                    <div className={styles.farmerLocationsList}>
                                        {farmer.locations.map((loc, idx) => (
                                            <div key={idx} className={styles.farmerLocationItem}>
                                                <div>
                                                    <span className={styles.farmerVillageText}>
                                                        {loc.village ? `${loc.village} - ` : ''}
                                                    </span>
                                                    <strong>{loc.instructorDivision || loc.division}</strong>
                                                </div>
                                                {loc.isMain && <span className={`badge bg-primary ${styles.farmerBadgeMain}`}>{t('farmerDetails.main')}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                <div className={styles.instructorModalFooter}>
                    <button type="button" className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`} onClick={onClose}>{t('farmerDetails.close')}</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

FarmerDetailsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    farmerId: PropTypes.number
};

export default FarmerDetailsModal;