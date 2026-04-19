import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../styles/Activities.module.css';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import ConfirmModal from '@/components/common/feedback/ConfirmModal';
import { getAccessToken } from '@/utils/authStorage';

const Activities = () => {
    const { showToast } = useOutletContext();
    const { t } = useTranslation('farmer');
    const [activities, setActivities] = useState([]);
    const [availableLocations, setAvailableLocations] = useState([]);
    const [availableCrops, setAvailableCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });
    const [activityForm, setActivityForm] = useState({
        activityType: '',
        activityCrop: '',
        instructorDivision: '',
        fieldLocation: '',
        activityDate: new Date().toISOString().split('T')[0],
        activityNotes: ''
    });

    // Fetch activities and profile data
    const fetchData = async () => {
        try {
            const token = getAccessToken();

            // Fetch activities
            const actRes = await fetch('/api/farmer/activities', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const actData = await actRes.json();
            if (actRes.ok && actData.success) {
                setActivities(actData.data);
            }

            // Fetch profile for locations
            const profRes = await fetch('/api/farmer/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const profData = await profRes.json();
            if (profRes.ok && profData.success) {
                let locations = profData.data.locations;
                if (typeof locations === 'string') {
                    try {
                        locations = JSON.parse(locations);
                    } catch (e) {
                        locations = [];
                    }
                }
                setAvailableLocations(Array.isArray(locations) ? locations : []);
            }

            // Fetch crops from database
            const cropsRes = await fetch('/api/farmer/crop-calendars', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const cropsData = await cropsRes.json();
            if (cropsRes.ok && cropsData.success) {
                setAvailableCrops(cropsData.data || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast(t('common.loadError'), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleActivitySubmit = async () => {
        if (!activityForm.activityType || !activityForm.activityCrop || !activityForm.activityDate) {
            showToast(t('common.fillRequired'), 'error');
            return;
        }

        try {
            const token = getAccessToken();
            const res = await fetch('/api/farmer/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    activity_type: activityForm.activityType,
                    crop: activityForm.activityCrop,
                    activity_date: activityForm.activityDate,
                    notes: activityForm.activityNotes,
                    fieldLocation: activityForm.fieldLocation,
                    instructorDivision: activityForm.instructorDivision
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(t('activities.logSuccess'));
                setActivityForm({
                    activityType: '',
                    activityCrop: '',
                    instructorDivision: '',
                    fieldLocation: '',
                    activityDate: new Date().toISOString().split('T')[0],
                    activityNotes: ''
                });
                fetchData(); // Refresh list
            } else {
                showToast(data.error?.message || 'Failed to log activity', 'error');
            }
        } catch (error) {
            console.error('Error submitting activity:', error);
            showToast(t('activities.logError'), 'error');
        }
    };

    const handleDeleteActivity = async (id) => {
        try {
            const token = getAccessToken();
            const res = await fetch(`/api/farmer/activities/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(t('activities.deleteSuccess'));
                fetchData(); // Refresh list
            } else {
                showToast(data.error?.message || 'Failed to delete activity', 'error');
            }
        } catch (error) {
            console.error('Error deleting activity:', error);
            showToast(t('activities.deleteError'), 'error');
        }
    };

    const requestDeleteActivity = (id) => setConfirmConfig({ isOpen: true, id });
    const closeConfirm = () => setConfirmConfig({ isOpen: false, id: null });
    const executeDeleteActivity = async () => {
        await handleDeleteActivity(confirmConfig.id);
        closeConfirm();
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageTitle}>
                <i className="fas fa-tasks"></i>
                <h2>{t('activities.title')}</h2>
            </div>

            <div className={styles.cardsGrid}>
                <div className={commonCardStyles.card}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('activities.logActivity')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-tasks"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={styles.formGroup}>
                            <label>{t('activities.activityType')}</label>
                            <select
                                className={styles.formControl}
                                value={activityForm.activityType}
                                onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value })}
                            >
                                <option value="">{t('activities.selectType')}</option>
                                <option value="planting">{t('activities.planting')}</option>
                                <option value="irrigation">{t('activities.irrigation')}</option>
                                <option value="fertilizing">{t('activities.fertilizing')}</option>
                                <option value="pest_control">{t('activities.pestControl')}</option>
                                <option value="harvesting">{t('activities.harvesting')}</option>
                                <option value="other">{t('activities.other')}</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('activities.crop_label')}</label>
                            <select
                                className={styles.formControl}
                                value={activityForm.activityCrop}
                                onChange={(e) => setActivityForm({ ...activityForm, activityCrop: e.target.value })}
                            >
                                <option value="">{t('activities.selectCrop')}</option>
                                {availableCrops.map((crop) => (
                                    <option key={crop.id} value={crop.name}>
                                        {crop.name}
                                    </option>
                                ))}
                                <option value="other">{t('activities.other')}</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('activities.instructorDivision')}</label>
                            <select
                                className={styles.formControl}
                                value={activityForm.instructorDivision}
                                onChange={(e) => {
                                    const selectedValue = e.target.value;
                                    setActivityForm(prev => ({
                                        ...prev,
                                        instructorDivision: selectedValue,
                                    }));
                                }}
                            >
                                <option value="">{t('activities.selectDiv')}</option>
                                {availableLocations.map((loc, idx) => (
                                    <option key={idx} value={`${loc.zone} - ${loc.division || loc.instructorDivision}`}>
                                        {loc.zone} - {loc.division || loc.instructorDivision}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('activities.location')}</label>
                            <input
                                type="text"
                                className={styles.formControl}
                                value={activityForm.fieldLocation}
                                onChange={(e) => setActivityForm({ ...activityForm, fieldLocation: e.target.value })}
                                placeholder={t('activities.locationPlaceholder')}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('activities.date')}</label>
                            <input
                                type="date"
                                className={styles.formControl}
                                value={activityForm.activityDate}
                                onChange={(e) => setActivityForm({ ...activityForm, activityDate: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('activities.notes')}</label>
                            <textarea
                                className={styles.formControl}
                                value={activityForm.activityNotes}
                                onChange={(e) => setActivityForm({ ...activityForm, activityNotes: e.target.value })}
                            />
                        </div>
                        <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} onClick={handleActivitySubmit}>
                            <i className="fas fa-save"></i> {t('activities.logBtn')}
                        </button>
                    </div>
                </div>

                {/* Recent Activities Card */}
                <div className={`${commonCardStyles.card} ${styles.widerCard}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('activities.recentActivities')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-clock-rotate-left"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={styles.activitiesList}>
                            {loading ? (
                                <div className={styles.activitiesLoading}>{t('activities.loading')}</div>
                            ) : activities.length > 0 ? (
                                activities.map((activity) => (
                                    <div className={styles.activityItem} key={activity.id}>
                                        <div className={styles.activityItemHeader}>
                                            <h4>{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</h4>
                                            <span className={styles.activityDate}>{new Date(activity.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className={styles.activityDetails}>
                                            <p><strong>{t('activities.crop_label')}:</strong> {activity.crop}</p>
                                            {activity.location && <p><strong>{t('activities.loc_label')}:</strong> {activity.location}</p>}
                                            {activity.instructor_division && <p><strong>{t('activities.div_label')}:</strong> {activity.instructor_division}</p>}
                                        </div>
                                        <div className={styles.activityBottomRow}>
                                            <div className={styles.activityNotesCol}>
                                                {activity.notes && <p className={styles.activityNotes}>{activity.notes}</p>}
                                            </div>
                                            <div className={styles.activityActions}>
                                                <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`} onClick={() => requestDeleteActivity(activity.id)}>{t('activities.delete')}</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.activitiesEmpty}>
                                    {t('activities.noActivities')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={closeConfirm}
                onConfirm={executeDeleteActivity}
                title={t('activities.deleteModal.title')}
                message={t('activities.deleteModal.message')}
                confirmText={t('activities.deleteModal.confirm')}
                type="danger"
            />
        </div>
    );
};

export default Activities;