import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StatusBadge from '../components/InstructorStatusBadge';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import defaultCropCalendarImage from '../../../assets/crop-calendar-default.jpg';
import { getDownloadUrl, getFriendlyFileName } from '../../../utils/fileUtils';
import ConfirmModal from '@/components/common/feedback/ConfirmModal';
import { getAccessToken } from '@/utils/authStorage';
import styles from '../styles/CropPlanReview.module.css';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';

const CropPlanReview = () => {
    const { showToast } = useOutletContext();
    const { t } = useTranslation('instructor');
    const [pendingPlans, setPendingPlans] = useState([]);
    const [reviewedPlans, setReviewedPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [showManageModal, setShowManageModal] = useState(false);
    const [selectedCropForImageUpdate, setSelectedCropForImageUpdate] = useState('');
    const [imageFileToUpload, setImageFileToUpload] = useState(null);
    const [isSavingCalendar, setIsSavingCalendar] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, cropId: null });

    // Crop Calendar States
    const [cropCalendars, setCropCalendars] = useState([]);
    const [currentCalendarId, setCurrentCalendarId] = useState('');
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    const currentCalendar = cropCalendars.find(cal => cal.id.toString() === currentCalendarId.toString());
    const cropCalendarImage = currentCalendar ? currentCalendar.image : defaultCropCalendarImage;

    useEffect(() => {
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const toggleZoom = () => {
        setIsZoomed(!isZoomed);
        setZoomLevel(1);
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

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        try {
            const token = getAccessToken();
            const response = await fetch('/api/instructor/crop-plans', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                const plans = data.data;
                // Correction status is moved to reviewedPlans as the instructor has already acted on it
                setPendingPlans(plans.filter(p => p.status === 'Pending Review'));
                setReviewedPlans(plans.filter(p => p.status === 'Approved' || p.status === 'Rejected' || p.status === 'Correction'));
            } else {
                showToast(data.error?.message || 'Failed to fetch crop plans', 'error');
            }
        } catch (error) {
            console.error('Error fetching crop plans:', error);
            showToast('An error occurred while fetching crop plans', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const fetchCropCalendars = useCallback(async () => {
        try {
            const token = getAccessToken();
            if (!token) {
                console.error('No auth token found');
                return;
            }

            const response = await fetch('/api/instructor/crop-calendars', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            
            if (data.success && Array.isArray(data.data)) {
                const mappedData = data.data.map(crop => ({
                    ...crop,
                    id: crop.id.toString(),
                    image: crop.image || defaultCropCalendarImage,
                    image_url: crop.image
                }));
                setCropCalendars(mappedData);
                
                if (mappedData.length > 0) {
                    setCurrentCalendarId(prev => {
                        if (prev) {
                            const exists = mappedData.some(c => c.id === prev);
                            return exists ? prev : mappedData[0].id;
                        }
                        return mappedData[0].id;
                    });
                }
            } else {
                showToast(data.error?.message || 'Failed to load crop calendars', 'error');
            }
        } catch (error) {
            console.error('Network error loading crop calendars:', error);
            showToast('Network error while loading crops', 'error');
        }
    }, [showToast]);

    useEffect(() => {
        const loadInitialData = async () => {
            await fetchPlans();
            await fetchCropCalendars();
        };
        loadInitialData();
    }, [fetchPlans, fetchCropCalendars]);

    const handleReviewAction = async (action) => {
        if (!feedback.trim()) {
            showToast('Please enter feedback for the farmer', 'error');
            return;
        }

        try {
            const token = getAccessToken();
            const status = action === 'approve' ? 'approved' : 'correction';

            const formData = new FormData();
            formData.append('status', status);
            formData.append('feedback', feedback);
            if (attachment) {
                formData.append('attachment', attachment);
            }

            const response = await fetch(`/api/instructor/crop-plans/${selectedPlan.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                showToast(`Plan ${action === 'approve' ? 'approved' : 'returned for correction'} successfully!`, 'success');
                setFeedback('');
                setAttachment(null);
                setSelectedPlan(null);
                fetchPlans();
            } else {
                showToast(data.error?.message || 'Failed to update plan status', 'error');
            }
        } catch (error) {
            console.error('Error updating plan status:', error);
            showToast('An error occurred while updating plan status', 'error');
        }
    };

    const handleImageUpdate = async (cropId, file) => {
        if (!cropId || !file) {
            showToast('Please select a crop and choose an image', 'error');
            return;
        }

        const selectedCrop = cropCalendars.find(c => c.id.toString() === cropId.toString());
        if (selectedCrop && selectedCrop.image && selectedCrop.image !== defaultCropCalendarImage) {
            showToast('Please remove the existing image before uploading a new one', 'error');
            return;
        }

        setIsSavingCalendar(true);
        try {
            const token = getAccessToken();
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`/api/instructor/crop-calendars/${cropId}/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                showToast('Crop calendar image updated successfully!', 'success');
                setImageFileToUpload(null);
                setSelectedCropForImageUpdate('');
                await fetchCropCalendars();
                setShowManageModal(false);
                // If we're currently viewing this crop, update currentCalendarId to trigger UI refresh
                if (currentCalendarId === cropId) {
                    setCurrentCalendarId(cropId);
                }
            } else {
                showToast(data.error?.message || 'Failed to update image', 'error');
            }
        } catch (error) {
            console.error('Error updating crop image:', error);
            showToast('An error occurred while updating the image', 'error');
        } finally {
            setIsSavingCalendar(false);
        }
    };

    const handleRemoveImage = async (cropId) => {
        setIsSavingCalendar(true);
        try {
            const token = getAccessToken();
            const response = await fetch(`/api/instructor/crop-calendars/${cropId}/remove-image`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                showToast('Image removed successfully!', 'success');
                fetchCropCalendars();
            } else {
                showToast(data.error?.message || 'Failed to remove image', 'error');
            }
        } catch (error) {
            console.error('Error removing crop image:', error);
            showToast('An error occurred while removing the image', 'error');
        } finally {
            setIsSavingCalendar(false);
        }
    };

    const requestRemoveImage = (cropId) => {
        setConfirmConfig({ isOpen: true, cropId });
    };

    const closeConfirm = () => {
        setConfirmConfig({ isOpen: false, cropId: null });
    };

    const executeRemoveImage = async () => {
        await handleRemoveImage(confirmConfig.cropId);
        closeConfirm();
    };

    const renderPlanDetails = (plan) => (
        <div className={styles.instructorDetailView}>
            <div className={styles.instructorDetailsGrid}>
                <div className={styles.instructorDetailGroup}>
                    <p><strong>{t('cropPlans.farmerLabel')}</strong> {plan.farmerName}</p>
                    <p><strong>ID:</strong> {plan.farmerId}</p>
                    <p><strong>{t('cropPlans.locationLabel')}</strong> {plan.location}</p>
                    <p><strong>{t('cropPlans.submittedDateLabel')}</strong> {plan.submittedDate}</p>
                </div>
                <div className={styles.instructorDetailGroup}>
                    <p><strong>{t('cropPlans.plantingDateLabel')}</strong> {plan.plantDate}</p>
                    <p><strong>{t('cropPlans.expectedHarvestLabel')}</strong> {plan.harvestDate}</p>
                    <p><strong>{t('cropPlans.statusLabel')}</strong> <StatusBadge status={plan.status} type={plan.status === 'Approved' ? 'success' : plan.status === 'Pending Review' ? 'warning' : 'danger'} /></p>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <strong>{t('cropPlans.farmersNotesLabel')}</strong>
                <div className={styles.instructorDescriptionBox}>
                    {plan.cropNotes}
                </div>
                {plan.farmerFiles && plan.farmerFiles.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                        <strong>{t('cropPlans.farmersAttachmentsLabel')}</strong>
                        <div className={styles.instructorAttachmentList}>
                            {plan.farmerFiles.map((file, idx) => (
                                <a
                                    key={idx}
                                    href={getDownloadUrl(file)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.instructorAttachmentItem}
                                    download
                                >
                                    <i className={`fas ${file.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' : (file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? 'fa-file-image' : 'fa-file')}`} style={{ marginRight: '8px' }}></i>
                                    <span style={{ fontSize: '0.9rem' }}>
                                        {plan.farmerFileNames?.[idx] || getFriendlyFileName(file)}
                                    </span>
                                    <i className="fas fa-download" style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#666' }}></i>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {plan.status === 'Pending Review' ? (
                <div className={styles.instructorActionSection}>
                    <label>{t('cropPlans.yourFeedbackLabel')}</label>
                    <textarea
                        className="form-control"
                        rows="5"
                        placeholder={t('cropPlans.feedbackPlaceholder')}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                    ></textarea>

                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label>{t('cropPlans.attachDocsLabel')}</label>
                        <div className={styles.fileUpload}>
                            <input
                                type="file"
                                className="form-control"
                                accept="image/*,.pdf,.doc,.docx"
                                onChange={(e) => setAttachment(e.target.files[0])}
                            />
                            <small className={styles.fileHint}>
                                {t('cropPlans.uploadHint')}
                            </small>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                        <button className="btn btn-success" onClick={() => handleReviewAction('approve')}>
                            <i className="fas fa-circle-check"></i> {t('cropPlans.approvePlan')}
                        </button>
                        <button className="btn btn-warning" onClick={() => handleReviewAction('correction')}>
                            <i className="fas fa-undo"></i> {t('cropPlans.requestCorrectionBtn')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className={styles.instructorActionSection}>
                    <strong>{t('cropPlans.yourFeedbackOn', { date: plan.reviewedDate })}</strong>
                    <div className={styles.instructorHistoryBox}>
                        {plan.instructorFeedback}
                    </div>
                    {plan.attachments && plan.attachments.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                            <strong>{t('cropPlans.sharedDocsLabel')}</strong>
                            <div className={styles.instructorAttachmentList}>
                                {plan.attachments.map((file, idx) => (
                                    <a
                                        key={idx}
                                        href={getDownloadUrl(file)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${styles.instructorAttachmentItem} ${styles.reviewedAttachmentItem}`}
                                        download
                                    >
                                        <i className={`fas ${file.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' : (file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? 'fa-file-image' : 'fa-file')}`} style={{ marginRight: '8px' }}></i>
                                        <span style={{ fontSize: '0.9rem' }}>
                                            {plan.attachmentNames?.[idx] || getFriendlyFileName(file)}
                                        </span>
                                        <i className="fas fa-download" style={{ marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.7 }}></i>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <>
            <div className={styles.cardsGrid}>
                {/* New Plans for Review - The mirror of Farmer's 'Plans Sent to Review' */}
                <div className={`${commonCardStyles.card} ${commonCardStyles.fullWidthCard}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('cropPlans.pendingReviews')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-hourglass-half"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={styles.instructorListContainer}>
                            {pendingPlans.map((plan) => (
                                <div className={styles.instructorListItem} key={plan.id} onClick={() => setSelectedPlan(plan)}>
                                    <div className={styles.instructorListInfo}>
                                        <h4>{plan.cropName}</h4>
                                        <div className={styles.instructorListDetails}>
                                            <p><strong>{t('cropPlans.farmerLabel')}</strong> {plan.farmerName} ({plan.farmerId})</p>
                                            <p><strong>{t('cropPlans.locationLabel')}</strong> {plan.location}</p>
                                            <p>{t('cropPlans.plantingLabel')} {plan.plantDate} • {t('cropPlans.submittedLabel')} {plan.submittedDate}</p>
                                        </div>
                                    </div>
                                    <div className={styles.instructorListSide}>
                                        <StatusBadge status={t('cropPlans.reviewPending')} type="warning" />
                                        <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary} ${commonBtnStyles.btnSm}`}>{t('cropPlans.reviewPlanBtn')}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Reviewed History - The mirror of Farmer's 'Reviewed Plans' */}
                <div className={`${commonCardStyles.card} ${commonCardStyles.fullWidthCard}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('cropPlans.reviewedHistory')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-clock-rotate-left"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={styles.instructorListContainer}>
                            {reviewedPlans.map((plan) => (
                                <div className={styles.instructorListItem} key={plan.id} onClick={() => setSelectedPlan(plan)}>
                                    <div className={styles.instructorListInfo}>
                                        <h4>{plan.cropName}</h4>
                                        <div className={styles.instructorListDetails}>
                                            <p><strong>{t('cropPlans.farmerLabel')}</strong> {plan.farmerName} ({plan.farmerId}) • {plan.location}</p>
                                            <p>{t('cropPlans.plantingLabel')} {plan.plantDate} • {t('cropPlans.reviewedLabel')} {plan.reviewedDate}</p>
                                        </div>
                                    </div>
                                    <div className={styles.instructorListSide}>
                                        <StatusBadge status={plan.status} type={plan.status === 'Approved' ? 'success' : 'danger'} />
                                        <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary} ${commonBtnStyles.btnSm}`}>{t('cropPlans.viewHistoryBtn')}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Crop Calendar Card - Added at the bottom */}
                <div className={`${commonCardStyles.card} ${commonCardStyles.fullWidthCard}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>Reference {t('cropPlans.cropCalendar')}</div>
                        <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
                            <select
                                className={`form-select ${styles.calendarSelect}`}
                                value={currentCalendarId}
                                onChange={(e) => setCurrentCalendarId(e.target.value)}
                            >
                                {cropCalendars.map(cal => (
                                <option key={cal.id} value={cal.id.toString()}>{cal.name}</option>
                            ))}
                            </select>
                            <button className="btn btn-secondary" onClick={toggleZoom} title={t('cropPlans.viewFullscreen')}>
                                <i className="fas fa-expand"></i>
                            </button>
                            <button className="btn btn-info" onClick={() => setShowManageModal(true)} title={t('cropPlans.manageCropCalendars')}>
                                <i className="fas fa-cog"></i> Manage
                            </button>
                        </div>
                    </div>
                    <div className={`${commonCardStyles.cardContent} ${styles.calendarDisplay}`}>
                        {currentCalendar ? (
                            <img
                                src={currentCalendar.image}
                                alt={`${currentCalendar.name} Crop Calendar`}
                                className={styles.calendarImage}
                                onClick={toggleZoom}
                            />
                        ) : (
                            <p className={styles.calendarNoData}>{t('cropPlans.noCalendarSelected')}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Plan Details Overlay Modal */}
            {selectedPlan && (
                <div className={styles.viewModalOverlay} onClick={() => setSelectedPlan(null)}>
                    <div className={styles.viewModalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.viewModalHeader}>
                            <h3 className={styles.viewModalTitle}>
                                <i className="fas fa-file-lines"></i> {selectedPlan.cropName} – Plan Details
                            </h3>
                            <button className={styles.viewModalCloseBtn} onClick={() => setSelectedPlan(null)}>
                                <i className="fas fa-xmark"></i>
                            </button>
                        </div>
                        <div className={styles.viewModalBody}>
                            {renderPlanDetails(selectedPlan)}
                        </div>
                        <div className={styles.viewModalFooter}>
                            <button
                                className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`}
                                onClick={() => setSelectedPlan(null)}
                            >
                                {t('cropPlans.closeBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Zoom Modal */}
            {isZoomed && (
                <div className={styles.instructorFullscreenOverlay} onClick={toggleZoom}>
                    <div className={styles.instructorFullscreenContainer} onClick={e => e.stopPropagation()}>
                        <div className={styles.instructorFullscreenControls}>
                            <div className={styles.instructorZoomGroup}>
                                <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`} onClick={handleZoomOut} title={t('cropPlans.zoomOut')}>
                                    <i className="fas fa-minus"></i>
                                </button>
                                <div className={styles.instructorZoomLevel}>
                                    {Math.round(zoomLevel * 100)}%
                                </div>
                                <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`} onClick={handleZoomIn} title={t('cropPlans.zoomIn')}>
                                    <i className="fas fa-plus"></i>
                                </button>
                            </div>
                            <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnDanger}`} onClick={toggleZoom}>
                                <i className="fas fa-xmark"></i> Close
                            </button>
                        </div>

                        <img
                            src={cropCalendarImage}
                            alt={`${t('cropPlans.cropCalendar')} Fullscreen`}
                            className={styles.instructorFullscreenImage}
                            style={{
                                width: zoomLevel > 1 ? `${zoomLevel * 90}vw` : 'auto',
                                height: `${zoomLevel * 90}vh`
                            }}
                        />
                    </div>
                </div>
            )}


            <Modal 
                show={showManageModal} 
                onHide={() => setShowManageModal(false)} 
                centered
                style={{ zIndex: 1050 }}
            >
                <Modal.Header closeButton>
                    <Modal.Title>{t('cropPlans.manageCropCalendars')}</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ overflow: 'visible', minHeight: '300px' }}>
                    <div style={{ position: 'relative', zIndex: 1060 }}>
                        <h5>{t('cropPlans.updateCalendarImage')}</h5>
                        <Form.Group controlId="imageUpdateCropSelect" className="mb-3">
                            <Form.Label>{t('cropPlans.selectCropToUpdate')}</Form.Label>
                            <Form.Select
                                value={selectedCropForImageUpdate}
                                onChange={(e) => {
                                    setSelectedCropForImageUpdate(e.target.value);
                                }}
                                style={{ 
                                    backgroundColor: 'white',
                                    color: '#333',
                                    cursor: 'pointer',
                                    display: 'block',
                                    width: '100%',
                                    border: '1px solid #ced4da'
                                }}
                            >
                                <option value="">{t('cropPlans.selectCropOption')}</option>
                                {cropCalendars.map(crop => (
                                    <option key={crop.id} value={crop.id.toString()}>{crop.name}</option>
                                ))}
                            </Form.Select>
                            {(!cropCalendars || cropCalendars.length === 0) && (
                                <div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>
                                    No crops found. Please check database connection.
                                </div>
                            )}
                        </Form.Group>
                    </div>
                    <Form.Group controlId="newCropImage" className="mb-3">
                        <Form.Label>{t('cropPlans.uploadNewImage')}</Form.Label>
                        <div className="d-flex align-items-center">
                            <Form.Control
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                                    const MAX_SIZE = 5 * 1024 * 1024;
                                    if (!ALLOWED_TYPES.includes(file.type)) {
                                        showToast('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.', 'error');
                                        e.target.value = '';
                                        return;
                                    }
                                    if (file.size > MAX_SIZE) {
                                        showToast('Image size exceeds 5 MB limit.', 'error');
                                        e.target.value = '';
                                        return;
                                    }
                                    setImageFileToUpload(file);
                                }}
                                disabled={!selectedCropForImageUpdate || isSavingCalendar}
                            />
                            {selectedCropForImageUpdate && cropCalendars.find(crop => crop.id.toString() === selectedCropForImageUpdate.toString())?.image && (
                                <Button
                                    variant="outline-danger"
                                    className="ms-2"
                                    onClick={() => requestRemoveImage(selectedCropForImageUpdate)}
                                >
                                    {t('cropPlans.removeImageConfirm')}
                                </Button>
                            )}
                        </div>
                        <Form.Text className="text-muted">
                            Select a crop above before uploading a new image. If an image already exists, you must remove it first.
                        </Form.Text>
                    </Form.Group>

                    <h5 className="mt-4">{t('cropPlans.existingCalendars')}</h5>
                    <ul className="list-group">
                        {cropCalendars.map(crop => (
                            <li key={crop.id} className="list-group-item d-flex justify-content-between align-items-center">
                                {crop.name}
                                {crop.image && (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => requestRemoveImage(crop.id)}
                                    >
                                        {t('cropPlans.removeImage')}
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="success"
                        onClick={() => {
                            handleImageUpdate(selectedCropForImageUpdate, imageFileToUpload);
                        }}
                        disabled={!selectedCropForImageUpdate || !imageFileToUpload || isSavingCalendar}
                    >
                            {isSavingCalendar ? <Spinner animation="border" size="sm" /> : t('cropPlans.save')}
                    </Button>
                    <Button variant="secondary" onClick={() => setShowManageModal(false)}>
                        {t('cropPlans.closeBtn')}
                    </Button>
                </Modal.Footer>
            </Modal>

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={closeConfirm}
                onConfirm={executeRemoveImage}
                title={t('cropPlans.removeImageTitle')}
                message="Are you sure you want to remove this crop calendar image?"
                confirmText={t('cropPlans.removeImageConfirm')}
                type="danger"
            />
        </>
    );
};

export default CropPlanReview;
