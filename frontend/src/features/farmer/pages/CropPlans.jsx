import React, { useState, useEffect, useRef } from 'react';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import defaultCropCalendarImage from '../components/Paddy-DRY-INTER-Wariposhitha-S-scaled.jpg';
import { getDownloadUrl, getFriendlyFileName } from '../../../utils/fileUtils';
import { getAccessToken } from '@/utils/authStorage';
import styles from '../styles/CropPlans.module.css';

const ALLOWED_ATTACHMENT_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
];
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB

const NotesDisplay = ({ notes }) => {
    const { t } = useTranslation('farmer');
    const [isExpanded, setIsExpanded] = useState(false);
    const MAX_LENGTH = 100;

    if (notes.length <= MAX_LENGTH) {
        return <p className={styles.planNotes}><strong>{t('activities.notes')}:</strong> {notes}</p>;
    }

    return (
        <p className={styles.planNotes}>
            <strong>{t('activities.notes')}:</strong> {isExpanded ? notes : `${notes.substring(0, MAX_LENGTH)}...`}
            <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnLink} ${commonBtnStyles.btnSm} ${styles.readMoreButton}`} onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? t('crops.showLess') : t('crops.readMore')}
            </button>
        </p>
    );
};

const CropPlans = () => {
    const { showToast } = useOutletContext();
    const { t } = useTranslation('farmer');
    const [selectedCropCalendar, setSelectedCropCalendar] = useState('');
    const [availableCropCalendars, setAvailableCropCalendars] = useState([]);

    const [availableCropPlans, setAvailableCropPlans] = useState([]);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedPlanData, setSelectedPlanData] = useState(null);
    const [cropForm, setCropForm] = useState({
        cropName: '',
        customCropName: '',
        fieldLocation: '',
        assignedInstructor: '',
        assignedInstructorId: '',
        assignedInstructorDisplayId: '',
        plantDate: '',
        harvestDate: '',
        cropNotes: ''
    });

    const [availableLocations, setAvailableLocations] = useState([]);

    // Fetch farmer's profile and crop plans on mount
    useEffect(() => {
        const fetchFarmerData = async () => {
            try {
                const token = getAccessToken();

                // Fetch farmer's profile to get registered lands
                const profileRes = await fetch('/api/farmer/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    if (profileData.success) {
                        // Handle both flattened and nested response formats
                        const farmerDetail = profileData.data.farmerDetail || profileData.data;

                        // Parse locations from farmer details
                        const locations = farmerDetail.locations || [];

                        const formattedLocations = locations.map((location, index) => ({
                            id: index + 1,
                            district: location.district || farmerDetail.district || '',
                            zone: location.zone,
                            instructorDivision: location.instructorDivision,
                            instructorName: location.instructorName || location.assignedInstructorName || '',
                            instructorId: location.instructorId || location.assignedInstructorId || '',
                            instructorDisplayId: location.assignedInstructorRefId || ''
                        })).filter(loc => loc.instructorName && loc.instructorId); // Only show locations with instructor info
                        setAvailableLocations(formattedLocations);
                    }
                }

                // Fetch crop plans
                const plansRes = await fetch('/api/farmer/crop-plans', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const plansData = await plansRes.json();
                if (plansRes.ok && plansData.success) {
                    setAvailableCropPlans(plansData.data);
                }

                // Fetch reference crop calendars
                const calendarsRes = await fetch('/api/farmer/crop-calendars', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const calendarsData = await calendarsRes.json();
                if (calendarsRes.ok && calendarsData.success) {
                    setAvailableCropCalendars(calendarsData.data.map(crop => ({
                        ...crop,
                        id: crop.id.toString(), // Ensure ID is a string for dropdown comparison
                        image: crop.image || defaultCropCalendarImage
                    })));
                    if (calendarsData.data.length > 0) {
                        setSelectedCropCalendar(calendarsData.data[0].id.toString());
                    }
                }
            } catch (error) {
                console.error('Error fetching farmer data:', error);
            }
        };
        fetchFarmerData();
    }, []);

    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    useEffect(() => {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];

        const harvestDate = new Date();
        harvestDate.setDate(today.getDate() + 90);
        const formattedHarvestDate = harvestDate.toISOString().split('T')[0];

        setCropForm(prev => ({
            ...prev,
            plantDate: formattedDate,
            harvestDate: formattedHarvestDate
        }));
    }, []);

    const handleLocationChange = (e) => {
        const selectedValue = e.target.value;

        // Extract the base location part (before the instructor name in parentheses)
        const baseLocation = selectedValue.split(' (')[0];

        const selectedLoc = availableLocations.find(loc =>
            `${loc.district || ''} - ${loc.zone} - ${loc.instructorDivision}` === baseLocation
        );

        setCropForm(prev => ({
            ...prev,
            fieldLocation: selectedValue,
            assignedInstructor: selectedLoc ? selectedLoc.instructorName : '',
            assignedInstructorId: selectedLoc ? selectedLoc.instructorId : '',
            assignedInstructorDisplayId: selectedLoc ? selectedLoc.instructorDisplayId : ''
        }));
    };

    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleCropSubmit = async () => {
        const finalCropName = cropForm.cropName === 'Custom' ? cropForm.customCropName : cropForm.cropName;

        // Extract base location part (before instructor name in parentheses)
        const baseLocation = cropForm.fieldLocation.split(' (')[0];
        const selectedLoc = availableLocations.find(loc =>
            `${loc.district || ''} - ${loc.zone} - ${loc.instructorDivision}` === baseLocation
        );

        if (!finalCropName || !cropForm.fieldLocation || !cropForm.plantDate || !cropForm.harvestDate) {
            showToast(t('common.fillRequired'), 'error');
            return;
        }

        try {
            const token = getAccessToken();
            const formData = new FormData();
            formData.append('cropName', finalCropName);
            formData.append('fieldLocation', cropForm.fieldLocation);
            formData.append('plantDate', cropForm.plantDate);
            formData.append('harvestDate', cropForm.harvestDate);
            formData.append('notes', cropForm.cropNotes);
            formData.append('instructorId', cropForm.assignedInstructorId || '');
            formData.append('instructorDivision', selectedLoc ? selectedLoc.instructorDivision : '');

            if (imageFile) {
                formData.append('attachment', imageFile);
            }

            const res = await fetch('/api/farmer/crop-plans', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showToast(t('crops.cropPlanCreated'));
                setCropForm(prev => ({
                    ...prev,
                    cropName: '',
                    customCropName: '',
                    fieldLocation: '',
                    assignedInstructor: '',
                    assignedInstructorId: '',
                    assignedInstructorDisplayId: '',
                    cropNotes: ''
                }));
                setImageFile(null);
                // Reset file input
                if (fileInputRef.current) fileInputRef.current.value = '';

                // Refresh crop plans
                const plansRes = await fetch('/api/farmer/crop-plans', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const plansData = await plansRes.json();
                if (plansRes.ok && plansData.success) {
                    setAvailableCropPlans(plansData.data);
                }
            } else {
                showToast(data.error?.message || 'Failed to create crop plan', 'error');
            }
        } catch (error) {
            console.error('Error submitting crop plan:', error);
            showToast(t('crops.cropPlanError'), 'error');
        }
    };

    const handleDownloadCalendar = () => {
        const currentCalendar = availableCropCalendars.find(calendar => calendar.id.toString() === selectedCropCalendar.toString());
        const imageToDownload = currentCalendar ? currentCalendar.image : defaultCropCalendarImage;
        const fileName = currentCalendar ? `${currentCalendar.name}.jpg` : 'Crop_Calendar.jpg';

        const link = document.createElement('a');
        link.href = imageToDownload;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const displayedCalendarImage = selectedCropCalendar
        ? availableCropCalendars.find(calendar => calendar.id.toString() === selectedCropCalendar.toString())?.image || defaultCropCalendarImage
        : defaultCropCalendarImage;

    const toggleZoom = () => {
        setIsZoomed(!isZoomed);
        setZoomLevel(1); // Reset zoom level when toggling
        // Toggle body scroll
        if (!isZoomed) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    };

    const handleZoomIn = (e) => {
        e.stopPropagation();
        setZoomLevel(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = (e) => {
        e.stopPropagation();
        setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
    };

    const handleOpenViewModal = (plan) => {
        setSelectedPlanData(plan);
        setIsViewModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedPlanData(null);
        document.body.style.overflow = 'auto';
    };

    return (
        <div className={`page active ${styles.pageContainer}`} id="crop">
            <div className={styles.pageTitle}>
                <i className="fas fa-clipboard-list"></i>
                <h2>{t('crops.pageTitle')}</h2>
            </div>

            <div className={styles.cardsGrid}>
                <div className={commonCardStyles.card}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('crops.createTitle')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-clipboard-list"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={styles.formGroup}>
                            <label>{t('crops.cropName')}</label>
                            <select
                                className={styles.formControl}
                                value={cropForm.cropName}
                                onChange={(e) => setCropForm({ ...cropForm, cropName: e.target.value })}
                            >
                                <option value="">{t('crops.selectCropOption')}</option>
                                {[...availableCropCalendars.map(cal => cal.name), 'Custom'].map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        {cropForm.cropName === 'Custom' && (
                            <div className={styles.formGroup}>
                                <label>{t('crops.customCrop')}</label>
                                <input
                                    type="text"
                                    className={styles.formControl}
                                    placeholder={t('crops.customCropPlaceholder')}
                                    value={cropForm.customCropName}
                                    onChange={(e) => setCropForm({ ...cropForm, customCropName: e.target.value })}
                                />
                            </div>
                        )}
                        <div className={styles.formGroup}>
                            <label>{t('crops.instructorDiv')}</label>
                            <select
                                className={styles.formControl}
                                value={cropForm.fieldLocation}
                                onChange={handleLocationChange}
                            >
                                <option value="">{t('crops.selectField')}</option>
                                {availableLocations.map(loc => (
                                    <option key={loc.id} value={`${loc.district || ''} - ${loc.zone} - ${loc.instructorDivision} (${loc.instructorName})`}>
                                        {loc.instructorDivision}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('crops.instructor')}</label>
                            <input
                                type="text"
                                className={`${styles.formControl} ${styles.disabledInput} ${cropForm.assignedInstructor ? styles.disabledInputActive : ''}`}
                                value={cropForm.assignedInstructor || ''}
                                disabled
                                placeholder={t('crops.autoAssignInstructor')}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('crops.instructorId')}</label>
                            <input
                                type="text"
                                className={`${styles.formControl} ${styles.disabledInput} ${cropForm.assignedInstructorDisplayId ? styles.disabledInputActive : ''}`}
                                value={cropForm.assignedInstructorDisplayId || ''}
                                disabled
                                placeholder={t('crops.autoAssignId')}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('crops.plantDateLabel')}</label>
                            <input
                                type="date"
                                className={styles.formControl}
                                value={cropForm.plantDate}
                                onChange={(e) => setCropForm({ ...cropForm, plantDate: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('crops.harvestDate')}</label>
                            <input
                                type="date"
                                className={styles.formControl}
                                value={cropForm.harvestDate}
                                onChange={(e) => setCropForm({ ...cropForm, harvestDate: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('crops.notesComments')}</label>
                            <textarea
                                className={styles.formControl}
                                rows="2"
                                value={cropForm.cropNotes}
                                onChange={(e) => setCropForm({ ...cropForm, cropNotes: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('crops.attachDoc')}</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className={styles.formControl}
                                accept="image/*,.pdf,.doc,.docx,.txt"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (!file) { setImageFile(null); return; }
                                    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
                                        showToast(t('crops.invalidFileType'), 'error');
                                        e.target.value = '';
                                        setImageFile(null);
                                        return;
                                    }
                                    if (file.size > MAX_ATTACHMENT_SIZE) {
                                        showToast(t('crops.fileSizeError'), 'error');
                                        e.target.value = '';
                                        setImageFile(null);
                                        return;
                                    }
                                    setImageFile(file);
                                }}
                            />
                        </div>
                        <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} onClick={handleCropSubmit}>
                            <i className="fas fa-paper-plane"></i> {t('crops.sendToReview')}
                        </button>
                    </div>
                </div>

                {/* Crop Calendar Card */}
                <div className={`${commonCardStyles.card} ${styles.widerCard}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('crops.calendarTitle')}</div>
                        <div className={`card-actions ${styles.cardActions}`}>
                            <select
                                className={styles.calendarSelect}
                                value={selectedCropCalendar}
                                onChange={(e) => setSelectedCropCalendar(e.target.value)}
                            >
                                <option value="">{t('crops.calendarSelect')}</option>
                                {availableCropCalendars.map((calendar) => (
                                    <option key={calendar.id} value={calendar.id.toString()}>
                                        {calendar.name}
                                    </option>
                                ))}
                            </select>
                            <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`} onClick={toggleZoom} title={t('crops.viewFullscreen')}>
                                <i className="fas fa-expand"></i>
                            </button>
                            <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} onClick={handleDownloadCalendar} title={t('crops.downloadCalendarBtn')}>
                                <i className="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                    <div className={`${commonCardStyles.cardContent} ${styles.cardContentCenter}`}>
                        <img
                            src={displayedCalendarImage}
                            alt={t('crops.calendarTitle')}
                            className={styles.calendarPreviewImage}
                            onClick={toggleZoom}
                        />
                    </div>
                </div>

                {/* Fullscreen Zoom Modal */}
                {isZoomed && (
                    <div className={styles.fullScreenOverlay} onClick={toggleZoom}>
                        <div className={styles.fullScreenContent} onClick={e => e.stopPropagation()}>
                            <div className={styles.fullScreenControls}>
                                <div className={`btn-group ${styles.zoomButtonGroup}`}>
                                    <button className={`btn btn-secondary ${styles.zoomBtn}`} onClick={handleZoomOut} title={t('crops.zoomOut')}>
                                        <i className="fas fa-minus"></i>
                                    </button>
                                    <div className={styles.zoomLevelDisplay}>
                                        {(zoomLevel * 100).toFixed(0)}%
                                    </div>
                                    <button className={`btn btn-secondary ${styles.zoomBtn}`} onClick={handleZoomIn} title={t('crops.zoomIn')}>
                                        <i className="fas fa-plus"></i>
                                    </button>
                                </div>
                                <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnDanger}`} onClick={toggleZoom}>
                                    <i className="fas fa-xmark"></i> Close
                                </button>
                            </div>
                            <div className={styles.zoomedImageContainer}>
                                <img
                                    src={displayedCalendarImage}
                                    alt={t('crops.calendarFullscreen')}
                                    className={`${styles.fullScreenImage} ${styles[`zoomLevel-${zoomLevel.toFixed(2).replace('.', '-')}`]}`}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className={`${commonCardStyles.card} ${styles.fullWidthCard}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('crops.plansSentToReview')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-clock"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={styles.plansReviewList}>
                            {availableCropPlans.filter(p => p.status === 'pending').length > 0 ? (
                                availableCropPlans.filter(p => p.status === 'pending').map((plan) => (
                                    <div className={styles.planReviewItem} key={plan.id}>
                                        <div className={styles.planInfo}>
                                            <div className={styles.planItemHeader}>
                                                <div className={styles.planTitleSection}>
                                                    <h4>{plan.crop_name} <span className={`${styles.statusBadge} ${styles.statusPending}`}>{t('crops.pendingBadge')}</span></h4>
                                                </div>
                                            </div>
                                            <div className={styles.planDetails}>
                                                <p><strong>Location:</strong> {plan.field_location?.split(' (')[0] || plan.field_location}</p>
                                                {(plan.instructor_name || plan.instructor_display_id) && (
                                                    <p><strong>{t('crops.instructorLabel')}</strong> {plan.instructor_name}{plan.instructor_display_id ? ` (${plan.instructor_display_id})` : ''}</p>
                                                )}
                                                <p><strong>{t('crops.plantingDateLabel')}</strong> {plan.plant_date}</p>
                                                {plan.notes && (
                                                    <NotesDisplay notes={plan.notes} />
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.planActions}>
                                            <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} onClick={() => handleOpenViewModal(plan)}>{t('crops.viewBtn')}</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>{t('crops.noPlansInReview')}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reviewed Plans Card */}
                <div className={`${commonCardStyles.card} ${styles.fullWidthCard}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('crops.reviewedPlans')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-circle-check"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={styles.reviewedPlansGrid}>
                            {availableCropPlans.filter(p => p.status === 'approved' || p.status === 'rejected' || p.status === 'correction').length > 0 ? (
                                availableCropPlans.filter(p => p.status === 'approved' || p.status === 'rejected' || p.status === 'correction').map((plan) => (
                                    <div className={styles.reviewedPlanItem} key={plan.id}>
                                        <div className={styles.planInfo}>
                                            <div className={styles.planItemHeader}>
                                                <div className={styles.planTitleSection}>
                                                    <h4>
                                                        {plan.crop_name}
                                                        <span className={`${styles.statusBadge} ${styles['status' + (plan.status === 'approved' ? 'Active' : (plan.status === 'correction' ? 'Warning' : 'Rejected'))]}`}>
                                                            {plan.status === 'correction' ? t('crops.correctionRequested') : (plan.status.charAt(0).toUpperCase() + plan.status.slice(1))}
                                                        </span>
                                                    </h4>
                                                </div>
                                            </div>
                                            <div className={styles.planDetails}>
                                                <p><strong>Location:</strong> {plan.field_location?.split(' (')[0] || plan.field_location}</p>
                                                {(plan.instructor_name || plan.instructor_display_id) && (
                                                    <p><strong>{t('crops.instructorLabel')}</strong> {plan.instructor_name}{plan.instructor_display_id ? ` (${plan.instructor_display_id})` : ''}</p>
                                                )}
                                                <p><strong>{t('crops.plantingDateLabel')}</strong> {plan.plant_date}</p>
                                                <p><strong>{t('crops.expectedHarvestLabel')}</strong> {plan.harvest_date}</p>
                                                {plan.notes && (
                                                    <NotesDisplay notes={plan.notes} />
                                                )}
                                                {plan.instructor_feedback && (
                                                    <div className={`feedback-section ${styles.planFeedbackInline} ${plan.status === 'correction' ? styles.planFeedbackCorrection : styles.planFeedbackNormal}`}>
                                                        <strong>{t('crops.instructorFeedbackLabel')}</strong>
                                                        <p className={styles.planFeedbackText}>{plan.instructor_feedback}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.planActions}>
                                            <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} onClick={() => handleOpenViewModal(plan)}>{t('crops.viewDetails')}</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>{t('crops.noReviewedPlans')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* View Plan Details Modal */}
            {isViewModalOpen && selectedPlanData && (
                <div className={styles.viewModalOverlay} onClick={handleCloseViewModal}>
                    <div className={styles.viewModalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.viewModalHeader}>
                            <h3 className={styles.viewModalTitle}>
                                <i className={`fas fa-file-lines ${styles.viewModalTitleIcon}`}></i>
                                {t('crops.modalTitle')}
                            </h3>
                            <button
                                onClick={handleCloseViewModal}
                                className={styles.viewModalCloseBtn}
                            >
                                <i className="fas fa-xmark"></i>
                            </button>
                        </div>

                        <div className={styles.viewModalBody}>
                            <div className={styles.viewModalGrid}>
                                <div>
                                    <h4 className={styles.viewModalSectionTitle}>{t('crops.planInfo')}</h4>
                                    <div className={styles.viewModalInfoList}>
                                        <p className={styles.viewModalInfoItem}><strong>{t('crops.cropLabel')}</strong> {selectedPlanData.crop_name}</p>
                                        <p className={styles.viewModalInfoItem}><strong>{t('crops.statusLabel')}</strong>
                                            <span className={`${styles.statusBadge} ${styles['status' + (selectedPlanData.status === 'approved' ? 'Active' : (selectedPlanData.status === 'pending' ? 'Pending' : (selectedPlanData.status === 'correction' ? 'Warning' : 'Rejected')))]} ${styles.statusBadgeMargin}`}>
                                                {selectedPlanData.status === 'correction' ? 'Correction Requested' : (selectedPlanData.status.charAt(0).toUpperCase() + selectedPlanData.status.slice(1))}
                                            </span>
                                        </p>
                                        <p className={styles.viewModalInfoItem}><strong>Location:</strong> {selectedPlanData.field_location?.split(' (')[0] || selectedPlanData.field_location}</p>
                                        {(selectedPlanData.instructor_name || selectedPlanData.instructor_display_id) && (
                                            <p className={styles.viewModalInfoItem}><strong>{t('crops.instructorLabel')}</strong> {selectedPlanData.instructor_name}{selectedPlanData.instructor_display_id ? ` (${selectedPlanData.instructor_display_id})` : ''}</p>
                                        )}
                                        <p className={styles.viewModalInfoItem}><strong>{t('crops.plantingDateLabel')}</strong> {selectedPlanData.plant_date}</p>
                                        <p className={styles.viewModalInfoItem}><strong>{t('crops.harvestDateLabel')}</strong> {selectedPlanData.harvest_date}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className={styles.viewModalSectionTitle}>{t('crops.farmerNotesTitle')}</h4>
                                    <div className={styles.viewModalNotes}>
                                        {selectedPlanData.notes || 'No notes provided.'}
                                    </div>
                                </div>
                            </div>

                            {selectedPlanData.instructor_feedback && (
                                <div className={styles.viewModalFeedbackContainer}>
                                    <h4 className={styles.feedbackSectionTitle}>{t('crops.instructorFeedbackTitle')}</h4>
                                    <div className={`${styles.feedbackContent} ${selectedPlanData.status === 'correction' ? styles.feedbackCorrection : styles.feedbackNormal}`}>
                                        <p className={styles.feedbackText}>"{selectedPlanData.instructor_feedback}"</p>
                                    </div>
                                </div>
                            )}

                            {(selectedPlanData.farmer_attachments?.length > 0 || selectedPlanData.instructor_attachments?.length > 0) && (
                                <div>
                                    <h4 className={styles.viewModalSectionTitle}>Attachments</h4>
                                    <div className={styles.attachmentsGrid}>
                                        {selectedPlanData.farmer_attachments?.length > 0 && (
                                            <div>
                                                <p className={styles.attachmentLabel}>{t('crops.yourAttachments')}</p>
                                                <div className={styles.attachmentList}>
                                                    {selectedPlanData.farmer_attachments.map((url, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={getDownloadUrl(url)}
                                                            download
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`${styles.attachmentLink} ${styles.attachmentLinkFarmer}`}
                                                        >
                                                            <i className={`fas ${url.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' : (url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? 'fa-file-image' : 'fa-file')}`}></i>
                                                            {selectedPlanData.farmer_attachment_names?.[idx] || getFriendlyFileName(url)}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {selectedPlanData.instructor_attachments?.length > 0 && (
                                            <div>
                                                <p className={styles.attachmentLabel}>{t('crops.instructorDocuments')}</p>
                                                <div className={styles.attachmentList}>
                                                    {selectedPlanData.instructor_attachments.map((url, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={getDownloadUrl(url)}
                                                            download
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`${styles.attachmentLink} ${styles.attachmentLinkInstructor}`}
                                                        >
                                                            <i className={`fas ${url.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' : (url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? 'fa-file-image' : 'fa-file')}`}></i>
                                                            {selectedPlanData.instructor_attachment_names?.[idx] || getFriendlyFileName(url)}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.viewModalFooter}>
                            <button
                                className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary} ${styles.viewModalCloseButton}`}
                                onClick={handleCloseViewModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CropPlans;
