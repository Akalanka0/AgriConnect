import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../styles/Settings.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import ConfirmModal from '@/components/common/feedback/ConfirmModal';
import { getAccessToken, clearAccessToken } from '@/utils/authStorage';
import { getStoredUser, setStoredUser, clearStoredUser } from '@/utils/userStorage';

const ALLOWED_PICTURE_TYPES = ['image/jpeg', 'image/png'];
const MAX_PICTURE_SIZE = 2 * 1024 * 1024; // 2 MB

const Settings = () => {
    const { showToast } = useOutletContext();
    const { t } = useTranslation('farmer');
    const navigate = useNavigate();

    const [settings, setSettings] = useState({
        farmerId: '',
        district: 'Anuradhapura',
        zone: '', // Initialize zone field
        locations: [],
        fullName: '',
        email: '',
        phone: '',
        profilePicture: null
    });
    const [loading, setLoading] = useState(true);
    const [isUpdatingPicture, setIsUpdatingPicture] = useState(false);
    const [hierarchyData, setHierarchyData] = useState({});
    const [instructors, setInstructors] = useState([]);
    const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        type: 'warning',
        action: null
    });
    const fileInputRef = React.useRef(null);

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

    // Fetch farmer profile and other data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = getAccessToken();
                const headers = { 'Authorization': `Bearer ${token}` };

                // Fetch Profile, Hierarchy, and Instructors in parallel
                const [profileRes, hierarchyRes, instructorsRes] = await Promise.all([
                    fetch('/api/farmer/profile', { headers }),
                    fetch('/api/farmer/region-hierarchy', { headers }),
                    fetch('/api/farmer/instructors', { headers })
                ]);

                const [profileData, hierarchyData, instructorsData] = await Promise.all([
                    profileRes.json(),
                    hierarchyRes.json(),
                    instructorsRes.json()
                ]);

                if (profileData.success) {
                    const profile = profileData.data;
                    const locations = (profile.locations || []).map(loc => {
                        // If assignedInstructorRefId is missing, it might be an old record
                        // where assignedInstructorId was the reference ID
                        const refId = loc.assignedInstructorRefId || (typeof loc.assignedInstructorId === 'string' && loc.assignedInstructorId.startsWith('INST-') ? loc.assignedInstructorId : '');
                        const dbId = typeof loc.assignedInstructorId === 'number' ? loc.assignedInstructorId : (loc.assignedInstructorDbId || '');

                        return {
                            ...loc,
                            assignedInstructorRefId: refId,
                            assignedInstructorId: dbId
                        };
                    });

                    setSettings({
                        farmerId: profile.farmer_id || '', // Use generated farmer_id instead of internal id
                        district: profile.district || 'Anuradhapura',
                        zone: profile.zone || 'Not set',
                        locations: locations,
                        fullName: profile.full_name || profile.name || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        profilePicture: profile.avatar || profile.profile_picture || null
                    });
                }

                if (hierarchyData.success) {
                    setHierarchyData(hierarchyData.data);
                }

                if (instructorsData.success) {
                    setInstructors(instructorsData.data);
                }

            } catch (error) {
                console.error('Error fetching data:', error);
                showToast(t('settings.toastLoadFailed'), 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showToast]);

    const handlePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!ALLOWED_PICTURE_TYPES.includes(file.type)) {
            showToast(t('settings.toastInvalidFileType'), 'warning');
            return;
        }
        if (file.size > MAX_PICTURE_SIZE) {
            showToast(t('settings.toastFileTooLarge'), 'warning');
            return;
        }

        setIsUpdatingPicture(true);
        const formData = new FormData();
        formData.append('profile_picture', file);

        try {
            const token = getAccessToken();
            const response = await fetch('/api/farmer/profile/picture', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Update local state
                setSettings(prev => ({
                    ...prev,
                    profilePicture: result.data.profile_picture
                }));

                // Update local storage user data
                const user = getStoredUser();
                if (user) {
                    user.profile_picture = result.data.profile_picture;
                    user.avatar = result.data.profile_picture;
                    setStoredUser(user);
                    // Notify layout
                    window.dispatchEvent(new Event('storage'));
                    window.dispatchEvent(new Event('user-updated'));
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

    // Handle profile picture removal
    const handlePictureRemove = async () => {
        setIsUpdatingPicture(true);
        try {
            const token = getAccessToken();
            const response = await fetch('/api/farmer/profile/picture', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                // Update local state
                setSettings(prev => ({
                    ...prev,
                    profilePicture: null
                }));

                // Update local storage user data
                const user = getStoredUser();
                if (user) {
                    user.profile_picture = null;
                    user.avatar = null;
                    setStoredUser(user);
                    // Notify layout
                    window.dispatchEvent(new Event('storage'));
                    window.dispatchEvent(new Event('user-updated'));
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
            title: t('settings.removePhotoConfirmTitle'),
            message: t('settings.removePhotoConfirmMsg'),
            confirmText: t('settings.removePhotoConfirmBtn'),
            type: 'warning',
            action: handlePictureRemove
        });
    };

    const requestDeleteAccount = () => {
        openConfirm({
            title: t('settings.deleteAccount'),
            message: t('settings.deleteAccountConfirmMsg'),
            confirmText: t('settings.deleteAccountConfirmBtn'),
            type: 'danger',
            action: async () => {
                try {
                    const token = getAccessToken();
                    const res = await fetch('/api/farmer/profile', {
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

    const handleLocationChange = (index, field, value) => {
        const updatedLocations = [...settings.locations];
        const location = { ...updatedLocations[index] };

        if (field === 'zone') {
            // Reset division when zone changes
            const availableDivisions = getAvailableDivisions(value, index);
            const defaultDivision = availableDivisions.length > 0 ? availableDivisions[0] : '';

            location.zone = value;
            location.instructorDivision = defaultDivision;

            // Find instructor for this division - check all assigned divisions
            const instructor = instructors.find(inst =>
                inst.assigned_divisions &&
                inst.assigned_divisions.some(div => div.startsWith(defaultDivision))
            );
            location.assignedInstructorId = instructor ? instructor.dbId : 'Pending';
            location.assignedInstructorName = instructor ? instructor.name : t('settings.noInstructorAssigned');
            location.assignedInstructorRefId = instructor ? instructor.id : '';
        } else if (field === 'instructorDivision') {
            location.instructorDivision = value;
            // Find instructor for this division - check all assigned divisions
            const instructor = instructors.find(inst =>
                inst.assigned_divisions &&
                inst.assigned_divisions.some(div => div.startsWith(value))
            );
            location.assignedInstructorId = instructor ? instructor.dbId : 'Pending';
            location.assignedInstructorName = instructor ? instructor.name : t('settings.noInstructorAssigned');
            location.assignedInstructorRefId = instructor ? instructor.id : '';
        }

        updatedLocations[index] = location;
        setSettings({ ...settings, locations: updatedLocations });
    };

    const addLocation = () => {
        const newLocation = {
            id: Date.now(),
            zone: '', // Let user select
            instructorDivision: '', // Let user select
            assignedInstructorId: '', // Let user select
            assignedInstructorName: t('settings.selectDivisionFirst'), // Let user select
            assignedInstructorRefId: ''
        };

        setSettings({
            ...settings,
            locations: [
                ...settings.locations,
                newLocation
            ]
        });
    };

    const getAvailableDivisions = (zone, currentIndex) => {
        const allDivisions = hierarchyData[zone] || [];
        const usedDivisions = settings.locations
            .filter((loc, i) => i !== currentIndex && loc.zone === zone && loc.instructorDivision)
            .map(loc => loc.instructorDivision);
        return allDivisions.filter(div => !usedDivisions.includes(div));
    };

    const removeLocation = (index) => {
        if (settings.locations.length > 1) {
            const updatedLocations = settings.locations.filter((_, i) => i !== index);
            setSettings({ ...settings, locations: updatedLocations });
        } else {
            showToast(t('settings.toastAtLeastOneLocation'));
        }
    };

    const saveProfile = async () => {
        try {
            const token = getAccessToken();
            const res = await fetch('/api/farmer/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_name: settings.fullName,
                    email: settings.email,
                    phone: settings.phone
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(t('settings.toastProfileUpdated'));
            } else {
                showToast(data.error?.message || t('settings.toastProfileFailed'), 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast(t('settings.toastProfileFailed'), 'error');
        }
    };

    const saveLocationDetails = async () => {
        try {
            const token = getAccessToken();

            // Determine primary instructor division from the first location if available
            const primaryDivision = settings.locations.length > 0 ? settings.locations[0].instructorDivision : '';
            const primaryZone = settings.locations.length > 0 ? settings.locations[0].zone : '';

            const res = await fetch('/api/farmer/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    locations: settings.locations,
                    district: settings.district,
                    instructor_division: primaryDivision,
                    zone: primaryZone
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(t('settings.toastLocationSaved'));
            } else {
                showToast(data.error?.message || t('settings.toastLocationFailed'), 'error');
            }
        } catch (error) {
            console.error('Error saving locations:', error);
            showToast(t('settings.toastLocationFailed'), 'error');
        }
    };

    const changePassword = async () => {
        if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
            showToast(t('settings.toastFillAllPasswords'), 'error');
            return;
        }
        if (passwordForm.next !== passwordForm.confirm) {
            showToast(t('settings.toastPasswordMismatch'), 'error');
            return;
        }
        if (passwordForm.next.length < 8) {
            showToast(t('settings.toastPasswordTooShort'), 'error');
            return;
        }

        try {
            const token = getAccessToken();
            const res = await fetch('/api/farmer/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.current,
                    newPassword: passwordForm.next
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(t('settings.toastPasswordUpdated'));
                setPasswordForm({ current: '', next: '', confirm: '' });
            } else {
                showToast(data.error?.message || t('settings.toastProfileFailed'), 'error');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            showToast(t('settings.toastProfileFailed'), 'error');
        }
    };

    return (
        <div className={`page active ${styles.pageDisplay}`} id="settings">
            <div className={styles.pageTitle}>
                <i className="fas fa-cog"></i>
                <h2>{t('settings.title')}</h2>
            </div>

            <div className={styles.settingsContainer}>
                {/* Profile Settings */}
                <div className={styles.settingsSection}>
                    <div className={styles.settingsHeader}>
                        <i className="fas fa-user"></i>
                        <h3>{t('settings.profileSettings')}</h3>
                    </div>

                    <div className={styles.profilePicture}>
                        <div className={styles.profileImageContainer}>
                            {settings.profilePicture ? (
                                <img
                                    src={settings.profilePicture.startsWith('http') ? settings.profilePicture : `/${settings.profilePicture}`}
                                    alt={t('settings.profileAlt')}
                                    className={styles.profileImage}
                                />
                            ) : (
                                <div className={styles.profileAvatarPlaceholder}>
                                    {settings.fullName ? settings.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'F'}
                                </div>
                            )}
                            {isUpdatingPicture && (
                                <div className={styles.loadingOverlay}>
                                    <i className="fas fa-spinner fa-spin text-white"></i>
                                </div>
                            )}
                        </div>
                        <div className={styles.profilePictureActions}>
                            <button
                                className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUpdatingPicture}
                            >
                                <i className={`fas ${isUpdatingPicture ? 'fa-spinner fa-spin' : 'fa-upload'}`}></i>
                                {isUpdatingPicture ? ` ${t('settings.uploading')}` : ` ${t('settings.uploadPhoto')}`}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePictureUpload}
                                className={styles.hiddenInput}
                                accept="image/*"
                            />
                            <button
                                className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`}
                                onClick={requestPictureRemove}
                                disabled={isUpdatingPicture || !settings.profilePicture}
                            >
                                <i className="fas fa-trash"></i> {t('settings.removePhoto')}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="farmerId">{t('settings.farmerId')}</label>
                        <input
                            type="text"
                            id="farmerId"
                            className="form-control"
                            value={settings.farmerId}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="fullName">{t('settings.fullName')}</label>
                        <input
                            type="text"
                            id="fullName"
                            className="form-control"
                            value={settings.fullName}
                            onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">{t('settings.emailAddress')}</label>
                        <input
                            type="email"
                            id="email"
                            className="form-control"
                            value={settings.email}
                            disabled
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone">{t('settings.phoneNumber')}</label>
                        <input
                            type="tel"
                            id="phone"
                            className="form-control"
                            value={settings.phone}
                            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        />
                    </div>

                    <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} onClick={saveProfile}>
                        <i className="fas fa-save"></i> {t('settings.updateProfile')}
                    </button>
                </div>

                {/* Location & Land Details */}
                <div className={styles.settingsSection}>
                    <div className={styles.settingsHeader}>
                        <i className="fas fa-location-dot"></i>
                        <h3>{t('settings.locationLandDetails')}</h3>
                    </div>

                    <div className="form-group">
                        <label htmlFor="district">{t('settings.district')}</label>
                        <input
                            type="text"
                            id="district"
                            className="form-control"
                            value={settings.district}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('settings.farmingLocations')}</label>
                        <div className={styles.locationsList}>
                            {settings.locations.map((location, index) => (
                                <div key={index} className={`${commonCardStyles.card} ${styles.locationCard}`}>
                                    <div className={styles.locationHeader}>
                                        <h4 className={styles.locationTitle}>{t('settings.locationNum')} {index + 1}</h4>
                                        {settings.locations.length > 1 && (
                                            <button
                                                className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnDanger} ${styles.removeButton}`}
                                                onClick={() => removeLocation(index)}
                                            >
                                                <i className="fas fa-trash"></i> {t('settings.removeLocation')}
                                            </button>
                                        )}
                                    </div>

                                    <div className={`form-group ${styles.formGroupSmallMargin}`}>
                                        <label className={styles.smallLabel}>{t('settings.zone')}</label>
                                        <select
                                            className="form-control"
                                            value={location.zone || ''}
                                            onChange={(e) => handleLocationChange(index, 'zone', e.target.value)}
                                        >
                                            <option value="">{t('settings.selectZone')}</option>
                                            {Object.keys(hierarchyData).map(zoneName => (
                                                <option key={zoneName} value={zoneName}>
                                                    {zoneName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={`form-group ${styles.formGroupSmallMargin}`}>
                                        <label className={styles.smallLabel}>{t('settings.instructorDiv')}</label>
                                        <select
                                            className="form-control"
                                            value={location.instructorDivision || ''}
                                            onChange={(e) => handleLocationChange(index, 'instructorDivision', e.target.value)}
                                            disabled={!location.zone}
                                        >
                                            <option value="">{t('settings.selectDiv')}</option>
                                            {getAvailableDivisions(location.zone, index).map(division => (
                                                <option key={division} value={division}>
                                                    {division}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={`form-group ${styles.formGroupNoMargin}`}>
                                        <label className={styles.smallLabel}>{t('settings.assignedInstructor')}</label>
                                        <input
                                            type="text"
                                            className={`form-control ${styles.disabledInput}`}
                                            value={(location.assignedInstructorRefId ? `${location.assignedInstructorName || ''} (${location.assignedInstructorRefId})` : location.assignedInstructorName) || ''}
                                            disabled
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary} ${styles.fullWidthButton}`}
                            onClick={addLocation}
                        >
                            <i className="fas fa-plus"></i> {t('settings.addAnotherLocation')}
                        </button>
                        <button
                            className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary} ${styles.fullWidthButton}`}
                            onClick={saveLocationDetails}
                        >
                            <i className="fas fa-save"></i> {t('settings.saveLocationDetails')}
                        </button>
                    </div>
                </div>

                {/* Security Settings */}
                <div className={styles.settingsSection}>
                    <div className={styles.settingsHeader}>
                        <i className="fas fa-shield-alt"></i>
                        <h3>{t('settings.securitySettings')}</h3>
                    </div>

                    <div className="form-group">
                        <label htmlFor="currentPassword">{t('settings.currentPassword')}</label>
                        <input
                            type="password"
                            id="currentPassword"
                            className="form-control"
                            placeholder={t('settings.currentPasswordPlaceholder')}
                            value={passwordForm.current}
                            onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="newPassword">{t('settings.newPassword')}</label>
                        <input
                            type="password"
                            id="newPassword"
                            className="form-control"
                            placeholder={t('settings.newPasswordPlaceholder')}
                            value={passwordForm.next}
                            onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">{t('settings.confirmPassword')}</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="form-control"
                            placeholder={t('settings.confirmPasswordPlaceholder')}
                            value={passwordForm.confirm}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        />
                    </div>
                    <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} onClick={changePassword}>
                        <i className="fas fa-key"></i> {t('settings.changePassword')}
                    </button>
                </div>


                {/* Danger Zone */}
                <div className={styles.settingsSection}>
                    <div className={styles.settingsHeader}>
                        <i className="fas fa-exclamation-triangle"></i>
                        <h3>{t('settings.dangerZone')}</h3>
                    </div>

                    <p className={styles.dangerText}>
                        {t('settings.dangerText')}
                    </p>
                    <div className={styles.settingsActions}>
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
        </div>
    );
};

export default Settings;
