import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '@/services/adminService';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import styles from '../styles/AdminSettings.module.css';
import ConfirmModal from '@/components/common/feedback/ConfirmModal';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import { getStoredUser, setStoredUser } from '@/utils/userStorage';

// Portal Component for Absolute Isolation
const ModalPortal = ({ children }) => {
    return ReactDOM.createPortal(children, document.body);
};

const Settings = () => {
    // State for Profile Settings
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        role: '',
        avatar: null
    });

    // State for Password Change
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // State for System Config (Super Admin Only)
    const [systemConfig, setSystemConfig] = useState({
        maintenanceMode: false,
        allowRegistration: true,
        debugMode: false,
        emailNotifications: true
    });

    // State for Admin Management (Super Admin Only)
    const [admins, setAdmins] = useState([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '' });
    const fileInputRef = useRef(null);

    // Context and State
    const { showToast } = useOutletContext();
    const { t } = useTranslation('admin');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [isAddingAdmin, setIsAddingAdmin] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        id: null,
        name: '',
        title: '',
        message: '',
        confirmText: '',
        type: 'warning',
        action: null
    });

    const openConfirm = ({ title, message, confirmText = '', type = 'warning', action, id = null, name = '' }) => {
        setConfirmConfig({
            isOpen: true,
            id,
            name,
            title,
            message,
            confirmText,
            type,
            action
        });
    };

    const closeConfirm = () => {
        setConfirmConfig({
            isOpen: false,
            id: null,
            name: '',
            title: '',
            message: '',
            confirmText: '',
            type: 'warning',
            action: null
        });
    };

    const executeConfirm = async () => {
        if (typeof confirmConfig.action === 'function') {
            await confirmConfig.action();
        }
        closeConfirm();
    };

    // Fetch Admins
    const fetchAdmins = async () => {
        setLoadingAdmins(true);
        try {
            const data = await adminAPI.getUsers('?role=admin');
            
            // Map backend data to frontend format
            const adminData = data.data || data;
            if (Array.isArray(adminData)) {
                const mappedAdmins = adminData.map(admin => ({
                    id: admin.id,
                    name: admin.full_name,
                    email: admin.email,
                    role: admin.is_super_admin ? 'Super Admin' : 'Admin',
                    status: admin.status ? admin.status.charAt(0).toUpperCase() + admin.status.slice(1) : 'Active'
                }));
                setAdmins(mappedAdmins);
            }
        } catch (error) {
            console.error('Error fetching admins:', error);
            showToast(error.message || t('settings.toastConnectFailed'), 'error');
        } finally {
            setLoadingAdmins(false);
        }
    };

    // Mapping between camelCase state keys and snake_case DB keys
    const settingsKeyMap = {
        maintenance_mode: 'maintenanceMode',
    };
    const reverseSettingsKeyMap = Object.fromEntries(
        Object.entries(settingsKeyMap).map(([k, v]) => [v, k])
    );

    // Fetch System Settings
    const fetchSystemSettings = async () => {
        try {
            const data = await adminAPI.getSystemSettings();
            const rawSettings = data.data || data;
            const mappedSettings = {};
            Object.keys(rawSettings).forEach(key => {
                const stateKey = settingsKeyMap[key] || key;
                mappedSettings[stateKey] = rawSettings[key];
            });
            setSystemConfig(prev => ({ ...prev, ...mappedSettings }));
        } catch (error) {
            console.error('Error fetching system settings:', error);
        }
    };

    useEffect(() => {
        // Load real user data from storage
        const user = getStoredUser();
        if (user) {
            setProfile({
                name: user.full_name || 'Admin User',
                email: user.email || '',
                role: user.role === 'admin' ? 'Admin' : user.role,
                avatar: user.avatar || user.profile_picture || null
            });
        }
        fetchAdmins();
        fetchSystemSettings();
    }, []);

    // Handlers
    const handleProfileUpdate = async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            showToast(t('settings.toastNoChanges'), 'info');
            return;
        }

        setIsUpdatingProfile(true);
        try {
            const formData = new FormData();
            formData.append('avatar', selectedFile);

            const data = await adminAPI.updateProfile(formData);
            
            // Map the avatar URL from the response (Admin response uses profile_picture)
            const responseData = data?.data || data;
            const avatarUrl = responseData?.profile_picture || responseData?.avatar;

            showToast(t('settings.toastPhotoUpdated'), 'success');

            // Update local storage user data
            const userData = getStoredUser();
            if (userData) {
                userData.avatar = avatarUrl;
                userData.profile_picture = avatarUrl;
                setStoredUser(userData);
            }

            // Update state
            setProfile(prev => ({ ...prev, avatar: avatarUrl }));
            setSelectedFile(null);

            // Notify layout
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('user-updated'));
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast(error.message || t('settings.toastProfileUpdateFailed'), 'error');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            showToast(t('settings.toastPasswordMismatch'), 'error');
            return;
        }

        setIsUpdatingPassword(true);
        try {
            await adminAPI.updatePassword({
                currentPassword: passwordData.current,
                newPassword: passwordData.new
            });

            showToast(t('settings.toastPasswordUpdated'), 'success');
            setPasswordData({ current: '', new: '', confirm: '' });
        } catch (error) {
            console.error('Error updating password:', error);
            showToast(error.message || t('settings.toastPasswordFailed'), 'error');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleSystemToggle = async (key) => {
        const newValue = !systemConfig[key];
        const dbKey = reverseSettingsKeyMap[key] || key;

        const applyToggle = async () => {
            setSystemConfig(prev => ({ ...prev, [key]: newValue }));
            try {
                await adminAPI.updateSetting(dbKey, newValue);
                showToast(
                    newValue ? t('settings.maintenanceEnabledToast') : t('settings.maintenanceDisabledToast'),
                    newValue ? 'warning' : 'success'
                );
            } catch (error) {
                console.error(`Error updating ${key}:`, error);
                setSystemConfig(prev => ({ ...prev, [key]: !newValue }));
                showToast(error.message || t('settings.toastSettingFailed'), 'error');
            }
        };

        // Show confirmation only when enabling maintenance mode
        if (key === 'maintenanceMode' && newValue === true) {
            openConfirm({
                title: t('settings.enableMaintenanceTitle'),
                message: t('settings.enableMaintenanceMsg'),
                confirmText: t('settings.enableMaintenanceConfirm'),
                type: 'warning',
                action: applyToggle
            });
        } else {
            await applyToggle();
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();

        if (!newAdmin.name || !newAdmin.email) {
            showToast(t('settings.toastFillAllFields'), 'warning');
            return;
        }

        setIsAddingAdmin(true);
        try {
            await adminAPI.inviteAdmin({
                fullName: newAdmin.name,
                email: newAdmin.email
            });

            showToast(t('settings.toastInvitationSent', { email: newAdmin.email }), 'success');
            setIsAddAdminModalOpen(false);
            setNewAdmin({ name: '', email: '' });
            fetchAdmins(); // Refresh the list
        } catch (error) {
            console.error('Error inviting admin:', error);
            showToast(error.message || t('settings.toastInviteFailed'), 'error');
        } finally {
            setIsAddingAdmin(false);
        }
    };

    const handleDeleteAdmin = (id, name) => {
        openConfirm({
            title: t('settings.removeAdminTitle'),
            message: t('settings.removeAdminMsg', { name }),
            confirmText: t('settings.removeAdminConfirm'),
            type: 'danger',
            id,
            name,
            action: confirmDeleteAdmin
        });
    };

    const confirmDeleteAdmin = async () => {
        try {
            const id = confirmConfig.id;
            await adminAPI.deleteUser(id);
            setAdmins(admins.filter(admin => admin.id !== id));
            showToast(t('settings.toastAdminRemoved', { name: confirmConfig.name }), 'success');
            closeConfirm();
        } catch (error) {
            console.error('Error deleting admin:', error);
            showToast(error.message || t('settings.toastRemoveFailed'), 'error');
        }
    };

    const handlePhotoClick = () => {
        fileInputRef.current.click();
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast(t('settings.toastFileTooLarge'), 'warning');
                return;
            }
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                showToast(t('settings.toastInvalidFileType'), 'warning');
                return;
            }

            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = async () => {
        try {
            await adminAPI.removeProfilePicture();

            showToast(t('settings.toastPictureRemoved'), 'success');

            // Update local storage
            const userData = getStoredUser();
            if (userData) {
                userData.avatar = null;
                setStoredUser(userData);
            }

            // Update state
            setProfile(prev => ({ ...prev, avatar: null }));
            setSelectedFile(null);

            // Notify layout
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('user-updated'));
        } catch (error) {
            console.error('Error removing profile picture:', error);
            showToast(error.message || t('settings.toastPictureRemoveFailed'), 'error');
        }
    };

    const requestRemovePhoto = () => {
        openConfirm({
            title: t('settings.removeProfilePicture'),
            message: t('settings.removeProfilePictureMsg'),
            confirmText: t('settings.removeBtn'),
            type: 'warning',
            action: handleRemovePhoto
        });
    };

    return (
        <div className={`${styles.page} ${styles.active}`} id="settings">
            <div className={styles.pageTitle}>
                <i className="fas fa-cog"></i>
                <h2>{t('settings.title')}</h2>
            </div>

            <div className={`${styles.dashboardGrid} ${styles.twoColumns}`}>

                {/* 1. Profile Settings */}
                <div className={commonCardStyles.card}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('settings.myProfile')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-user-circle"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <form onSubmit={handleProfileUpdate}>
                            <div className={styles.profileHeader}>
                                <div
                                    className={`${styles.profileAvatarLarge} ${profile.avatar ? styles.hasAvatar : styles.noAvatar}`}
                                >
                                    {profile.avatar ? (
                                        <img src={profile.avatar} alt={t('settings.profileAlt')} className={styles.profileAvatarImg} />
                                    ) : (
                                        profile.name.charAt(0)
                                    )}
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className={styles.hiddenFileInput}
                                        accept="image/jpeg, image/png"
                                        onChange={handlePhotoChange}
                                    />
                                    <div className={styles.profileActions}>
                                        <button type="button" className={`${commonBtnStyles.btn} ${commonBtnStyles.btnOutline} ${commonBtnStyles.btnSm}`} onClick={handlePhotoClick}>
                                            <i className="fas fa-camera"></i> {t('settings.changePicture')}
                                        </button>
                                        {profile.avatar && (
                                            <button type="button" className={`${commonBtnStyles.btn} ${commonBtnStyles.btnOutline} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnDangerOutline}`} onClick={requestRemovePhoto}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                    <div className={styles.profileHint}>{t('settings.profileHint')}</div>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>{t('settings.nameLabel')}</label>
                                <input
                                    type="text"
                                    className={`${styles.formControl} ${styles.inputDisabled}`}
                                    value={profile.name}
                                    disabled
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>{t('settings.emailLabel')}</label>
                                <input
                                    type="email"
                                    className={`${styles.formControl} ${styles.inputDisabled}`}
                                    value={profile.email}
                                    disabled
                                />
                            </div>
                            <button type="submit" className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} disabled={isUpdatingProfile}>
                                {isUpdatingProfile ? <><i className="fas fa-spinner fa-spin"></i> {t('settings.updating')}</> : t('settings.updateProfile')}
                            </button>
                        </form>
                    </div>
                </div>

                {/* 2. Security Settings */}
                <div className={commonCardStyles.card}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('settings.security')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-lock"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <form onSubmit={handlePasswordChange}>
                            <div className={styles.formGroup}>
                                <label>{t('settings.currentPassword')}</label>
                                <input
                                    type="password"
                                    className={styles.formControl}
                                    value={passwordData.current}
                                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>{t('settings.newPassword')}</label>
                                <input
                                    type="password"
                                    className={styles.formControl}
                                    value={passwordData.new}
                                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>{t('settings.confirmPassword')}</label>
                                <input
                                    type="password"
                                    className={styles.formControl}
                                    value={passwordData.confirm}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                />
                            </div>
                            <button type="submit" className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} disabled={isUpdatingPassword}>
                                {isUpdatingPassword ? <><i className="fas fa-spinner fa-spin"></i> {t('settings.updating')}</> : t('settings.updatePassword')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* 3. Admin Management */}
            {profile.role && (
                <div className={`${commonCardStyles.card} ${styles.settingsCardMargin}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('settings.adminTeam')}</div>
                        <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnPrimary}`} onClick={() => setIsAddAdminModalOpen(true)}>
                            <i className="fas fa-plus"></i> {t('settings.addNewAdmin')}
                        </button>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={`${styles.dashboardGrid} ${styles.dashboardGridNoMargin} ${styles.settingsStatsMargin}`}>
                            <StatCard
                                label={t('settings.totalAdmins')}
                                value={admins.length}
                                icon="fas fa-user-shield"
                                color="blue"
                            />
                        </div>
                        <div className={styles.tableContainer}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>{t('settings.colName')}</th>
                                        <th>{t('settings.colEmail')}</th>
                                        <th>{t('settings.colRole')}</th>
                                        <th>{t('settings.colStatus')}</th>
                                        <th>{t('settings.colActions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admins.map(admin => (
                                        <tr key={admin.id}>
                                            <td className={styles.adminNameCell}>{admin.name}</td>
                                            <td>{admin.email}</td>
                                            <td>
                                                <span className={`${styles.userRole} ${admin.role === 'Super Admin' ? styles.roleAdmin : styles.roleInstructor}`}>
                                                    {admin.role}
                                                </span>
                                            </td>
                                            <td><StatusBadge status={admin.status} /></td>
                                            <td>
                                                {admin.role !== 'Super Admin' && (
                                                    <button
                                                        className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnDanger} ${commonBtnStyles.btnIconOnly}`}
                                                        onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. System Configuration */}
            {profile.role && (
                <div className={`${commonCardStyles.card} ${styles.settingsCardMargin}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('settings.systemConfig')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-cogs"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={`${styles.dashboardGrid} ${styles.dashboardGridNoMargin}`}>
                            <div className={styles.statusItem}>
                                <div className={styles.statusInfo}>
                                    <span className={styles.statusLabel}>{t('settings.maintenanceMode')}</span>
                                    <span className={styles.statusValue}>{systemConfig.maintenanceMode ? t('settings.maintenanceEnabled') : t('settings.maintenanceDisabled')}</span>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={systemConfig.maintenanceMode}
                                        onChange={() => handleSystemToggle('maintenanceMode')}
                                    />
                                    <span className={`${styles.slider} ${styles.round}`}></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={closeConfirm}
                onConfirm={executeConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                type={confirmConfig.type}
            />

            {/* Add Admin Modal */}
            {isAddAdminModalOpen && (
                <ModalPortal>
                    <div className={`${styles.modalOverlay} ${styles.active}`}>
                        <div className={`${styles.modal} ${styles.modalContentSmall}`}>
                            <div className={styles.modalHeader}>
                                <div className={styles.modalTitle}>{t('settings.addAdminTitle')}</div>
                                <button className={styles.modalCloseRound} onClick={() => setIsAddAdminModalOpen(false)}>
                                    <i className="fas fa-xmark"></i>
                                </button>
                            </div>
                            <form onSubmit={handleAddAdmin}>
                                <div className={styles.modalBody}>
                                    <div className={styles.formGroup}>
                                        <label>{t('settings.inviteAdminName')}</label>
                                        <input
                                            type="text"
                                            className={styles.formControl}
                                            required
                                            value={newAdmin.name}
                                            onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>{t('settings.inviteAdminEmail')}</label>
                                        <input
                                            type="email"
                                            className={styles.formControl}
                                            required
                                            value={newAdmin.email}
                                            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className={styles.modalFooter}>
                                    <button
                                        type="button"
                                        className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`}
                                        onClick={() => setIsAddAdminModalOpen(false)}
                                        disabled={isAddingAdmin}
                                    >
                                        {t('settings.cancelBtn')}
                                    </button>
                                    <button
                                        type="submit"
                                        className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`}
                                        disabled={isAddingAdmin}
                                    >
                                        {isAddingAdmin ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i> {t('settings.sending')}
                                            </>
                                        ) : (
                                            t('settings.sendInvitation')
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={closeConfirm}
                onConfirm={executeConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                type={confirmConfig.type}
            />
        </div>
    );
};

export default Settings;
