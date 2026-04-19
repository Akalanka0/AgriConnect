import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../styles/InstructorSettings.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import ConfirmModal from '@/components/common/feedback/ConfirmModal';
import { getAccessToken, clearAccessToken } from '@/utils/authStorage';
import { getStoredUser, setStoredUser, clearStoredUser } from '@/utils/userStorage';
const InstructorSettings = () => {
    const { openModal, showToast } = useOutletContext();
    const { t } = useTranslation('instructor');
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingPicture, setIsUpdatingPicture] = useState(false);
    const [isSavingProfessional, setIsSavingProfessional] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        type: 'warning',
        action: null
    });
    const fileInputRef = useRef(null);

    const openConfirm = ({ title, message, confirmText = '', type = 'warning', action }) => {
        setConfirmConfig({
            isOpen: true,
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

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Helper to format zone names (remove "Zone" suffix if present)
    const formatZoneName = (name) => {
        if (!name) return '-';
        // More robust removal: handle trailing spaces and case-insensitive "Zone"
        return name.toString().replace(/\s+Zone\s*$/i, '').trim();
    };

    const [hierarchyData, setHierarchyData] = useState({});

    // We need local state for settings since this page manages profile/settings editing locally
    const [profileData, setProfileData] = useState({
        fullName: '',
        email: '',
        phone: '',
        instructorId: '', // Add instructor ID field
        district: 'Anuradhapura',
        zone: '',
        assignedDivisions: [],
        takenDivisions: [],
        specialization: '',
        experience: 0,
        qualifications: '',
        profilePicture: ''
    });

    const fetchHierarchy = useCallback(async () => {
        try {
            const token = getAccessToken();
            const response = await fetch('/api/instructor/region-hierarchy', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setHierarchyData(result.data);
            }
        } catch (error) {
            console.error('Error fetching hierarchy:', error);
        }
    }, []);

    const fetchProfile = useCallback(async () => {
        try {
            const token = getAccessToken();
            const response = await fetch('/api/instructor/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                const user = result.data;
                const details = user.instructorDetail || {};
                setProfileData({
                    fullName: user.full_name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    instructorId: user.instructor_id || '', // Use generated instructor_id
                    district: details.district || 'Anuradhapura',
                    zone: details.zone || '',
                    assignedDivisions: Array.isArray(details.assigned_divisions)
                        ? details.assigned_divisions
                        : (typeof details.assigned_divisions === 'string'
                            ? JSON.parse(details.assigned_divisions || '[]')
                            : []),
                    takenDivisions: details.takenDivisions || [],
                    specialization: details.specialization || '',
                    experience: details.experience || 0,
                    qualifications: details.qualifications || '',
                    profilePicture: user.avatar || user.profile_picture || ''
                });
            } else {
                showToast(result.error?.message || t('settings.toastFetchFailed'), 'error');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            showToast(t('settings.toastFetchError'), 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchHierarchy();
        fetchProfile();
    }, [fetchHierarchy, fetchProfile]);

    const fetchTakenDivisions = async (zone) => {
        try {
            const token = getAccessToken();
            const response = await fetch(`/api/instructor/taken-divisions?zone=${encodeURIComponent(zone)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setProfileData(prev => ({ ...prev, takenDivisions: result.data }));
            }
        } catch (error) {
            console.error('Error fetching taken divisions:', error);
        }
    };

    const handleProfileChange = (field, value) => {
        if (field === 'zone') {
            setProfileData({
                ...profileData,
                [field]: value,
                assignedDivisions: [], // Reset divisions when area changes
                takenDivisions: [] // Temporarily clear while fetching
            });
            fetchTakenDivisions(value);
        } else {
            setProfileData({ ...profileData, [field]: value });
        }
    };

    // Handle profile picture upload
    const handlePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            showToast(t('settings.toastInvalidFileType'), 'error');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            showToast(t('settings.toastFileTooLarge'), 'error');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUpdatingPicture(true);
        const formData = new FormData();
        formData.append('profile_picture', file);

        try {
            const token = getAccessToken();
            const response = await fetch('/api/instructor/profile/picture', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Update local state
                setProfileData(prev => ({
                    ...prev,
                    profilePicture: result.data.profile_picture
                }));

                // Update local storage user data to reflect change immediately in layout
                const user = getStoredUser();
                if (user) {
                    user.profile_picture = result.data.profile_picture;
                    user.avatar = result.data.profile_picture;
                    setStoredUser(user);
                    window.dispatchEvent(new Event('storage'));
                }

                showToast(t('settings.toastPictureUpdated'), 'success');
            } else {
                showToast(result.error?.message || t('settings.toastPictureUpdateFailed'), 'error');
            }
        } catch (error) {
            console.error('Error updating profile picture:', error);
            showToast(t('settings.toastPictureUpdateError'), 'error');
        } finally {
            setIsUpdatingPicture(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const toggleDivision = (division) => {
        const currentDivisions = [...profileData.assignedDivisions];
        const index = currentDivisions.indexOf(division);

        if (index === -1) {
            currentDivisions.push(division);
        } else {
            currentDivisions.splice(index, 1);
        }

        setProfileData({ ...profileData, assignedDivisions: currentDivisions });
    };

    const saveProfile = async () => {
        try {
            const token = getAccessToken();
            const response = await fetch('/api/instructor/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_name: profileData.fullName,
                    email: profileData.email,
                    phone: profileData.phone,
                    district: profileData.district,
                    zone: profileData.zone,
                    assigned_divisions: profileData.assignedDivisions,
                    specialization: profileData.specialization,
                    experience: profileData.experience,
                    qualifications: profileData.qualifications
                })
            });
            const result = await response.json();
            if (result.success) {
                // Update localStorage with new profile info
                try {
                    const user = getStoredUser() || {};
                    user.full_name = profileData.fullName;
                    user.email = profileData.email;
                    user.phone = profileData.phone;
                    setStoredUser(user);
                } catch (error) {
                    console.error('Error updating user profile in storage:', error);
                }

                // Notify layout
                window.dispatchEvent(new Event('userProfileUpdated'));
                window.dispatchEvent(new Event('user-updated'));

                showToast(t('settings.toastProfileSaved'), 'success');
            } else {
                showToast(result.error?.message || t('settings.toastProfileSaveFailed'), 'error');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            showToast(t('settings.toastProfileSaveError'), 'error');
        }
    };

    const saveProfessionalDetails = async () => {
        setIsSavingProfessional(true);
        try {
            const token = getAccessToken();
            const response = await fetch('/api/instructor/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    specialization: profileData.specialization,
                    experience: profileData.experience,
                    qualifications: profileData.qualifications
                })
            });
            const result = await response.json();
            if (result.success) {
                showToast(t('settings.toastProfessionalSaved'), 'success');
            } else {
                showToast(result.error?.message || t('settings.toastProfessionalSaveFailed'), 'error');
            }
        } catch (error) {
            console.error('Error saving professional details:', error);
            showToast(t('settings.toastProfessionalSaveError'), 'error');
        } finally {
            setIsSavingProfessional(false);
        }
    };

    const changePassword = async () => {
        if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
            showToast(t('settings.toastFillAllPasswords'), 'error');
            return;
        }

        if (passwords.newPassword.length < 8) {
            showToast(t('settings.toastPasswordTooShort'), 'error');
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            showToast(t('settings.toastPasswordMismatch'), 'error');
            return;
        }

        try {
            const token = getAccessToken();
            const response = await fetch('/api/instructor/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword
                })
            });
            const result = await response.json();
            if (result.success) {
                showToast(t('settings.toastPasswordChanged'), 'success');
                setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                showToast(result.error?.message || t('settings.toastPasswordChangeFailed'), 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showToast(t('settings.toastPasswordChangeError'), 'error');
        }
    };

    // Handle profile picture removal
    const handlePictureRemove = async () => {
        setIsUpdatingPicture(true);
        try {
            const token = getAccessToken();
            const response = await fetch('/api/instructor/profile/picture', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                // Update local state
                setProfileData(prev => ({
                    ...prev,
                    profilePicture: null
                }));

                // Update local storage user data
                const user = getStoredUser();
                if (user) {
                    user.profile_picture = null;
                    user.avatar = null;
                    setStoredUser(user);
                    window.dispatchEvent(new Event('storage'));
                    window.dispatchEvent(new Event('user-updated'));
                    window.dispatchEvent(new Event('userProfileUpdated'));
                }

                showToast(t('settings.toastPictureRemoved'), 'success');
            } else {
                showToast(result.error?.message || t('settings.toastPictureRemoveFailed'), 'error');
            }
        } catch (error) {
            console.error('Error removing profile picture:', error);
            showToast(t('settings.toastPictureRemoveError'), 'error');
        } finally {
            setIsUpdatingPicture(false);
        }
    };

    const requestPictureRemove = () => {
        openConfirm({
            title: t('settings.removeProfilePictureTitle'),
            message: t('settings.removeProfilePictureMsg'),
            confirmText: t('settings.removeProfilePictureConfirm'),
            type: 'warning',
            action: handlePictureRemove
        });
    };

    const requestDeleteAccount = () => {
        openConfirm({
            title: t('settings.deleteAccountTitle'),
            message: t('settings.deleteAccountMsg'),
            confirmText: t('settings.deleteAccountConfirm'),
            type: 'danger',
            action: async () => {
                try {
                    const token = getAccessToken();
                    const res = await fetch('/api/instructor/profile', {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.success) {
                        clearAccessToken();
                        clearStoredUser();
                        showToast(t('settings.toastAccountDeletion'), 'success');
                        setTimeout(() => navigate('/login'), 1000);
                    } else {
                        showToast(data.error?.message || 'Failed to delete account', 'error');
                    }
                } catch (error) {
                    console.error('Delete account error:', error);
                    showToast('Failed to delete account', 'error');
                }
            }
        });
    };

    if (isLoading) {
        return <div className={styles.loadingContainer}>{t('settings.loading')}</div>;
    }

    return (
        <>
            <div className={styles.settingsContainer}>
                {/* Profile Settings */}
                <div className={styles.settingsSection}>
                    <div className={styles.settingsHeader}>
                        <i className="fas fa-user-circle"></i>
                        <h3>{t('settings.profileSettings')}</h3>
                    </div>

                    <div className={styles.profilePicture}>
                        {profileData.profilePicture ? (
                            <img
                                src={profileData.profilePicture.startsWith('http') ? profileData.profilePicture : `/${profileData.profilePicture}`}
                                alt={t('settings.profileAlt')}
                                className={styles.settingsProfileImg}
                            />
                        ) : (
                            <div className={styles.profileAvatarPlaceholder}>
                                {(profileData.fullName || 'Instructor')
                                    .split(' ')
                                    .map((name) => name[0])
                                    .join('')
                                    .substring(0, 2)
                                    .toUpperCase()}
                            </div>
                        )}
                        <div className={`${styles.profilePictureActions} ${commonBtnStyles.btnGroup}`}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className={styles.fileInputHidden}
                                onChange={handlePictureUpload}
                                accept="image/*"
                            />
                            <button
                                className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUpdatingPicture}
                            >
                                <i className={`fas ${isUpdatingPicture ? 'fa-spinner fa-spin' : 'fa-upload'}`}></i>
                                {isUpdatingPicture ? ` ${t('settings.uploading')}` : ` ${t('settings.uploadPhoto')}`}
                            </button>
                            <button
                                className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`}
                                onClick={requestPictureRemove}
                                disabled={isUpdatingPicture || !profileData.profilePicture}
                            >
                                <i className="fas fa-trash"></i> {t('settings.removePhoto')}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t('settings.instructorId')}</label>
                        <input
                            type="text"
                            className={`form-control ${styles.inputDisabled}`}
                            value={profileData.instructorId}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('settings.fullName')}</label>
                        <input
                            type="text"
                            className="form-control"
                            value={profileData.fullName}
                            onChange={(e) => handleProfileChange('fullName', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('settings.email')}</label>
                        <input
                            type="email"
                            className={`form-control ${styles.inputDisabled}`}
                            value={profileData.email}
                            disabled
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('settings.phone')}</label>
                        <input
                            type="text"
                            className="form-control"
                            value={profileData.phone}
                            onChange={(e) => handleProfileChange('phone', e.target.value)}
                        />
                    </div>

                    <div className={`form-row ${styles.settingsFormRow}`}>
                        <div className="form-group">
                            <label>{t('settings.district')}</label>
                            <input
                                type="text"
                                className={`form-control ${styles.inputDisabled}`}
                                value={profileData.district}
                                disabled
                            />
                            <small className={styles.settingsHelperText}>{t('settings.districtNote')}</small>
                        </div>
                        <div className="form-group">
                            <label>{t('settings.zone')}</label>
                            <select
                                value={profileData.zone}
                                onChange={(e) => handleProfileChange('zone', e.target.value)}
                                className={styles.zoneSelect}
                            >
                                <option value="" disabled>{t('settings.selectZone')}</option>
                                {Object.keys(hierarchyData).map(zone => (
                                    <option key={zone} value={zone}>{zone}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t('settings.assignedDivisions')}</label>
                        <div className={`${styles.divisionsGridContainer}`}>
                            {profileData.zone && hierarchyData[profileData.zone] ? (
                                hierarchyData[profileData.zone].map(division => {
                                    const isTaken = profileData.takenDivisions.includes(division);
                                    const isActive = profileData.assignedDivisions.includes(division);

                                    return (
                                        <div
                                            key={division}
                                            className={`${styles.divisionChip} ${isActive ? styles.active : ''} ${isTaken ? styles.taken : ''}`}
                                            onClick={() => !isTaken && toggleDivision(division)}
                                            title={isTaken ? 'This division is already assigned to another instructor' : ''}
                                        >
                                            <i className={`fas ${isActive ? 'fa-circle-check' : (isTaken ? 'fa-lock' : 'fa-circle')}`}></i>
                                            {division}
                                        </div>
                                    );
                                })
                            ) : (
                                <p className={styles.noDivisionsText}>
                                    {profileData.zone ? t('settings.noDivisionsForZone') : t('settings.selectZoneFirst')}
                                </p>
                            )}
                        </div>
                        <small className={styles.divisionsSelectionNote}>
                            {t('settings.divisionsNote')} {profileData.zone}.
                        </small>
                    </div>

                    <div className={styles.sectionActions}>
                        <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} onClick={saveProfile}>
                            <i className="fas fa-save"></i> {t('settings.saveChanges')}
                        </button>
                    </div>
                </div>

                {/* Professional Details (New attractive section) */}
                <div className={styles.settingsSection}>
                    <div className={styles.settingsHeader}>
                        <i className="fas fa-briefcase"></i>
                        <h3>{t('settings.professionalDetails')}</h3>
                    </div>

                    <div className="form-group">
                        <label>{t('settings.specialization')}</label>
                        <input
                            type="text"
                            className="form-control"
                            value={profileData.specialization}
                            onChange={(e) => handleProfileChange('specialization', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('settings.experience')}</label>
                        <input
                            type="number"
                            className="form-control"
                            value={profileData.experience}
                            onChange={(e) => handleProfileChange("experience", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('settings.qualifications')}</label>
                        <textarea
                            className="form-control"
                            rows="4"
                            value={profileData.qualifications}
                            onChange={(e) => handleProfileChange("qualifications", e.target.value)}
                        ></textarea>
                    </div>

                    <div className={styles.sectionActions}>
                        <button
                            className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`}
                            onClick={saveProfessionalDetails}
                            disabled={isSavingProfessional}
                        >
                            <i className={`fas ${isSavingProfessional ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
                            {isSavingProfessional ? ` ${t('settings.saving')}` : ` ${t('settings.saveProfessional')}`}
                        </button>
                    </div>
                </div>

                {/* Security Settings */}
                <div className={styles.settingsSection}>
                    <div className={styles.settingsHeader}>
                        <i className="fas fa-shield-alt"></i>
                        <h3>{t('settings.security')}</h3>
                    </div>
                    <div className="form-group">
                        <label>{t('settings.currentPassword')}</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder={t('settings.currentPasswordPlaceholder')}
                            value={passwords.currentPassword}
                            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('settings.newPassword')}</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder={t('settings.newPasswordPlaceholder')}
                            value={passwords.newPassword}
                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('settings.confirmPassword')}</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder={t('settings.confirmPasswordPlaceholder')}
                            value={passwords.confirmPassword}
                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        />
                    </div>
                    <div className={styles.sectionActions}>
                        <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`} onClick={changePassword}>
                            <i className="fas fa-key"></i> {t('settings.changePassword')}
                        </button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className={styles.settingsSection}>
                    <div className={styles.settingsHeader}>
                        <i className="fas fa-exclamation-triangle"></i>
                        <h3>{t('settings.dangerZone')}</h3>
                    </div>

                    <p className={styles.dangerZoneText}>
                        {t('settings.dangerZoneText')}
                    </p>
                    <div className={styles.dangerZoneActions}>
                        <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnDanger}`} onClick={requestDeleteAccount}>
                            <i className="fas fa-trash"></i> {t('settings.deleteAccount')}
                        </button>
                    </div>
                </div>

            </div>

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={closeConfirm}
                onConfirm={executeConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                type={confirmConfig.type}
            />
        </>
    );
};

export default InstructorSettings;
