import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FarmerStatusBadge from '../components/modals/FarmerStatusBadge';
import styles from '../styles/Harvest.module.css';
import commonStyles from '../styles/FarmerCommon.module.css';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import ConfirmModal from '@/components/common/feedback/ConfirmModal';
import { getAccessToken } from '@/utils/authStorage';

// Reusing NotesDisplay component from CropPlans.jsx for consistency
const NotesDisplay = ({ notes, t }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const MAX_LENGTH = 100;

    if (notes.length <= MAX_LENGTH) {
        return <p className={styles.planNotes}><strong>{t('harvest.notes')}:</strong> {notes}</p>;
    }

    return (
        <p className={styles.planNotes}>
            <strong>{t('harvest.notes')}:</strong> {isExpanded ? notes : `${notes.substring(0, MAX_LENGTH)}...`}
            <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnLink} ${commonBtnStyles.btnSm} ${styles.readMoreButton}`} onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? t('harvest.showLess') : t('harvest.readMore')}
            </button>
        </p>
    );
};

const Harvest = () => {
    const { showToast } = useOutletContext();
    const { t } = useTranslation('farmer');
    const [harvestForm, setHarvestForm] = useState({
        harvestCrop: '',
        harvestLocation: '',
        instructorDivision: '',
        harvestDate: '',
        harvestQuantity: '',
        harvestQuality: '',
        harvestNotes: ''
    });

    const [harvestRecords, setHarvestRecords] = useState([]);
    const [availableLocations, setAvailableLocations] = useState([]);
    const [availableCrops, setAvailableCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleHarvestCount, setVisibleHarvestCount] = useState(3); // Initially show 3 records
    const recordsToShowIncrement = 3; // Number of records to show each time "Show More" is clicked
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });

    // Fetch data on mount
    const fetchData = async () => {
        try {
            const token = getAccessToken();

            // Fetch harvest records
            const recordsRes = await fetch('/api/farmer/harvest-records', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const recordsData = await recordsRes.json();
            if (recordsRes.ok && recordsData.success) {
                setHarvestRecords(recordsData.data);
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

    const handleShowMoreHarvests = () => {
        setVisibleHarvestCount(prevCount => prevCount + recordsToShowIncrement);
    };

    const handleHarvestSubmit = async () => {
        if (!harvestForm.harvestCrop || !harvestForm.harvestLocation || !harvestForm.harvestDate || !harvestForm.harvestQuantity) {
            showToast(t('common.fillRequired'), 'error');
            return;
        }

        try {
            const token = getAccessToken();
            const res = await fetch('/api/farmer/harvest-records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    crop: harvestForm.harvestCrop,
                    location: harvestForm.harvestLocation,
                    harvest_date: harvestForm.harvestDate,
                    quantity: harvestForm.harvestQuantity,
                    quality: harvestForm.harvestQuality,
                    notes: harvestForm.harvestNotes,
                    instructorDivision: harvestForm.instructorDivision
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(t('harvest.recordSuccess'));
                setHarvestForm({
                    harvestCrop: '',
                    harvestLocation: '',
                    instructorDivision: '',
                    harvestDate: '',
                    harvestQuantity: '',
                    harvestQuality: '',
                    harvestNotes: ''
                });
                fetchData(); // Refresh list
            } else {
                showToast(data.error?.message || 'Failed to record harvest', 'error');
            }
        } catch (error) {
            console.error('Error submitting harvest:', error);
            showToast(t('harvest.recordError'), 'error');
        }
    };

    const handleDeleteHarvest = async (id) => {
        try {
            const token = getAccessToken();
            const res = await fetch(`/api/farmer/harvest-records/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(t('harvest.deleteSuccess'));
                fetchData(); // Refresh list
            } else {
                showToast(data.error?.message || 'Failed to delete harvest record', 'error');
            }
        } catch (error) {
            console.error('Error deleting harvest record:', error);
            showToast(t('harvest.deleteError'), 'error');
        }
    };

    const requestDeleteHarvest = (id) => setConfirmConfig({ isOpen: true, id });
    const closeConfirm = () => setConfirmConfig({ isOpen: false, id: null });
    const executeDeleteHarvest = async () => {
        await handleDeleteHarvest(confirmConfig.id);
        closeConfirm();
    };

    return (
        <div className={`page active ${styles.pageDisplay}`} id="harvest">
            <div className={commonStyles.pageTitle}>
                <i className="fas fa-boxes"></i>
                <h2>{t('harvest.title')}</h2>
            </div>

            <div className={`${commonStyles.cardsGrid} ${styles.harvestGrid}`}>
                {/* Record Harvest Card */}
                <div className={`${commonCardStyles.card} ${styles.harvestCard}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('harvest.recordHarvest')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-pen-to-square"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={commonStyles.formGroup}>
                            <label>{t('harvest.crop')}</label>
                            <select
                                className={commonStyles.formControl}
                                value={harvestForm.harvestCrop}
                                onChange={(e) => setHarvestForm({ ...harvestForm, harvestCrop: e.target.value })}
                            >
                                <option value="">{t('harvest.selectCrop')}</option>
                                {availableCrops.map((crop) => (
                                    <option key={crop.id} value={crop.name}>
                                        {crop.name}
                                    </option>
                                ))}
                                <option value="other">{t('harvest.other')}</option>
                            </select>
                        </div>
                        <div className={commonStyles.formGroup}>
                            <label>{t('harvest.location')}</label>
                            <input
                                type="text"
                                className={commonStyles.formControl}
                                placeholder={t('harvest.locationPlaceholder')}
                                value={harvestForm.harvestLocation}
                                onChange={(e) => setHarvestForm({ ...harvestForm, harvestLocation: e.target.value })}
                            />
                        </div>
                        <div className={commonStyles.formGroup}>
                            <label>{t('harvest.instructorDiv')}</label>
                            <select
                                className={commonStyles.formControl}
                                value={harvestForm.instructorDivision}
                                onChange={(e) => setHarvestForm({ ...harvestForm, instructorDivision: e.target.value })}
                            >
                                <option value="">{t('harvest.selectDiv')}</option>
                                {availableLocations.map((loc, idx) => (
                                    <option key={idx} value={`${loc.zone} - ${loc.division || loc.instructorDivision}`}>
                                        {loc.zone} - {loc.division || loc.instructorDivision}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={commonStyles.formGroup}>
                            <label>{t('harvest.harvestDate')}</label>
                            <input
                                type="date"
                                className={commonStyles.formControl}
                                value={harvestForm.harvestDate}
                                onChange={(e) => setHarvestForm({ ...harvestForm, harvestDate: e.target.value })}
                            />
                        </div>
                        <div className={commonStyles.formGroup}>
                            <label>{t('harvest.quantity')}</label>
                            <input
                                type="number"
                                className={commonStyles.formControl}
                                placeholder={t('harvest.quantityPlaceholder')}
                                value={harvestForm.harvestQuantity}
                                onChange={(e) => setHarvestForm({ ...harvestForm, harvestQuantity: e.target.value })}
                            />
                        </div>
                        <div className={commonStyles.formGroup}>
                            <label>{t('harvest.qualityRating')}</label>
                            <select
                                className={commonStyles.formControl}
                                value={harvestForm.harvestQuality}
                                onChange={(e) => setHarvestForm({ ...harvestForm, harvestQuality: e.target.value })}
                            >
                                <option value="">{t('harvest.selectQuality')}</option>
                                <option value="excellent">{t('harvest.excellent')}</option>
                                <option value="good">{t('harvest.good')}</option>
                                <option value="average">{t('harvest.average')}</option>
                                <option value="poor">{t('harvest.poor')}</option>
                            </select>
                        </div>
                        <div className={commonStyles.formGroup}>
                            <label>{t('harvest.notes')}</label>
                            <textarea
                                className={commonStyles.formControl}
                                placeholder={t('harvest.notesPlaceholder')}
                                rows="3"
                                value={harvestForm.harvestNotes}
                                onChange={(e) => setHarvestForm({ ...harvestForm, harvestNotes: e.target.value })}
                            />
                        </div>
                        <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} onClick={handleHarvestSubmit}>
                            <i className="fas fa-save"></i> {t('harvest.recordBtn')}
                        </button>
                    </div>
                </div>

                {/* Harvest Records Card */}
                <div className={`${commonCardStyles.card} ${styles.harvestCard}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('harvest.harvestRecords')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-boxes"></i></div>
                    </div>
                    <div className={`${commonCardStyles.cardContent} ${styles.scrollableContent}`}>
                        <div className="harvest-list">
                            {loading ? (
                                <div className={styles.loadingState}>{t('harvest.loading')}</div>
                            ) : harvestRecords.length > 0 ? (
                                harvestRecords.slice(0, visibleHarvestCount).map((harvest) => (
                                    <div className={`harvest-item ${styles.harvestItem}`} key={harvest.id}>
                                        <div className={styles.harvestItemHeader}>
                                            <h4>{harvest.crop}</h4>
                                            <span className={styles.harvestDate}>{new Date(harvest.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className={styles.harvestDetails}>
                                            <p><strong>{t('harvest.location')}:</strong> {harvest.location}</p>
                                            <p><strong>{t('harvest.instructorDiv')}:</strong> {harvest.instructor_division || harvest.instructorDivision}</p>
                                            <p><strong>{t('harvest.quantity')}:</strong> {harvest.quantity}</p>
                                            <p><strong>{t('harvest.qualityRating')}:</strong> <FarmerStatusBadge status={harvest.quality} type={harvest.quality?.toLowerCase() === 'excellent' || harvest.quality?.toLowerCase() === 'good' ? 'success' : 'warning'} /></p>
                                        </div>
                                        <div className={styles.harvestBottomRow}>
                                            <div className={styles.harvestNotesCol}>
                                                {harvest.notes && <NotesDisplay notes={harvest.notes} t={t} />}
                                            </div>
                                            <div className={styles.harvestActions}>
                                                <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`} onClick={() => requestDeleteHarvest(harvest.id)}>{t('common.delete')}</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.emptyState}>
                                    {t('harvest.noRecords')}
                                </div>
                            )}
                        </div>
                        {visibleHarvestCount < harvestRecords.length && (
                            <div className={styles.showMoreContainer}>
                                <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSuccess}`} onClick={handleShowMoreHarvests}>
                                    {t('harvest.showMore')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={closeConfirm}
                onConfirm={executeDeleteHarvest}
                title={t('harvest.deleteModal.title')}
                message={t('harvest.deleteModal.message')}
                confirmText={t('harvest.deleteModal.confirm')}
                type="danger"
            />
        </div>
    );
};

export default Harvest;
