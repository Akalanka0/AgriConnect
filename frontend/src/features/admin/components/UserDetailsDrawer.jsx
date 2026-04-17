import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import StatusBadge from './StatusBadge';

import styles from '../styles/UserDetailsDrawer.module.css';

const UserDetailsDrawer = ({ isOpen, onClose, user, activeTab }) => {
    const { t } = useTranslation('admin');
    return (
        <div className={`${styles.drawerOverlay} ${isOpen ? styles.open : ''}`} onClick={onClose}>
            <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
                <div className={styles.drawerHeader}>
                    <h3>{t('users.drawerTitle')}</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <i className="fas fa-xmark"></i>
                    </button>
                </div>
                {user && (
                    <div className={styles.drawerContent}>
                        <div className={styles.infoGroup}>
                            <div className={styles.infoLabel}>{t('users.drawerFullName')}</div>
                            <div className={styles.infoValue}>{user.name}</div>
                        </div>
                        <div className={styles.infoGroup}>
                            <div className={styles.infoLabel}>{t('users.drawerEmailAddress')}</div>
                            <div className={styles.infoValue}>{user.email}</div>
                        </div>
                        <div className={styles.infoGroup}>
                            <div className={styles.infoLabel}>{t('users.drawerPhoneNumber')}</div>
                            <div className={styles.infoValue}>{user.phone}</div>
                        </div>
                        <div className={styles.infoGroup}>
                            <div className={styles.infoLabel}>{t('users.drawerNic')}</div>
                            <div className={styles.infoValue}>{user.nic}</div>
                        </div>
                        <div className={styles.infoGroup}>
                            <div className={styles.infoLabel}>{t('users.drawerRegistrationId')}</div>
                            <div className={styles.infoValue}>{user.displayId || user.id}</div>
                        </div>
                        <div className={styles.infoGroup}>
                            <div className={styles.infoLabel}>{t('users.drawerCurrentStatus')}</div>
                            <StatusBadge status={user.status} />
                        </div>
                        {activeTab === 'farmers' ? (
                            <>
                                <div className={styles.infoGroup}>
                                    <div className={styles.infoLabel}>{t('users.drawerDistrict')}</div>
                                    <div className={styles.infoValue}>{user.district}</div>
                                </div>
                                <div className={styles.infoGroup}>
                                    <div className={styles.infoLabel}>{t('users.drawerZone')}</div>
                                    <div className={styles.infoValue}>
                                        {user.farmerLocations && user.farmerLocations.length > 0 ? (
                                            Array.from(new Set(
                                                user.farmerLocations
                                                    .map(loc => loc.zone || loc.location)
                                                    .filter(Boolean)
                                                    .map(z => z.toString().replace(/\s+Zone\s*$/i, '').trim())
                                            )).join(', ') || user.location || '-'
                                        ) : (
                                            user.location || '-'
                                        )}
                                    </div>
                                </div>
                                <div className={styles.infoGroup}>
                                    <div className={styles.infoLabel}>{t('users.drawerInstructorDivisions')}</div>
                                    <div className={styles.infoValue}>
                                        {user.farmerLocations && user.farmerLocations.length > 0 ? (
                                            <div className={styles.divisionTagsWrapper}>
                                                {user.farmerLocations.map((loc, idx) => (
                                                    <span key={idx} className={styles.divisionTag}>
                                                        {loc.instructorDivision || loc.instructor_division || '-'}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            user.instructorDivision
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.infoGroup}>
                                    <div className={styles.infoLabel}>{t('users.drawerDistrict')}</div>
                                    <div className={styles.infoValue}>{user.district}</div>
                                </div>
                                <div className={styles.infoGroup}>
                                    <div className={styles.infoLabel}>{t('users.drawerZone')}</div>
                                    <div className={styles.infoValue}>{user.zone}</div>
                                </div>
                                <div className={styles.infoGroup}>
                                    <div className={styles.infoLabel}>{t('users.drawerInstructorDivisions')}</div>
                                    <div className={styles.infoValue}>
                                        <div className={styles.divisionTagsWrapper}>
                                            {user.divisions && user.divisions.map((div, idx) => (
                                                <span key={idx} className={styles.divisionTag}>
                                                    {div}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDetailsDrawer;

UserDetailsDrawer.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    user: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        displayId: PropTypes.string,
        name: PropTypes.string,
        email: PropTypes.string,
        phone: PropTypes.string,
        nic: PropTypes.string,
        status: PropTypes.string,
        district: PropTypes.string,
        location: PropTypes.string,
        zone: PropTypes.string,
        instructorDivision: PropTypes.string,
        farmerLocations: PropTypes.arrayOf(PropTypes.object),
        divisions: PropTypes.arrayOf(PropTypes.string)
    }),
    activeTab: PropTypes.string.isRequired
};
