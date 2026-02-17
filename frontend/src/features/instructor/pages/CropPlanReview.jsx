import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import StatusBadge from '../../admin/components/StatusBadge';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import defaultCropCalendarImage from '../../../assets/crop-calendar-default.jpg';
import { getDownloadUrl, getFriendlyFileName } from '../../../utils/fileUtils';

const CropPlanReview = () => {
    const { showToast } = useOutletContext();
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

    // Crop Calendar States
    const [cropCalendars, setCropCalendars] = useState([]);
    const [currentCalendarId, setCurrentCalendarId] = useState('');
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    const currentCalendar = cropCalendars.find(cal => cal.id.toString() === currentCalendarId.toString());
    const cropCalendarImage = currentCalendar ? currentCalendar.image : defaultCropCalendarImage;

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
            const token = localStorage.getItem('token');
            const response = await fetch('/api/instructor/crop-plans', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                // Filter out demo data and specific incorrect entries
                const plans = data.data.filter(p =>
                    p.farmerId !== 'FARM-2026-DEMO' &&
                    !p.farmerName?.includes('(Demo)') &&
                    p.farmerId !== 'FARM-2026-NZSR' &&
                    p.farmerName !== 'Fred Hickle Jr.'
                );
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
            console.log('--- fetchCropCalendars Frontend Started ---');
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found in localStorage');
                return;
            }

            const response = await fetch('/api/instructor/crop-calendars', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('Response Status:', response.status);
            const data = await response.json();
            console.log('Full API Response Data:', data);
            
            if (data.success && Array.isArray(data.data)) {
                console.log(`Successfully received ${data.data.length} crops`);
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
                console.error('API Error or Invalid Format:', data);
                showToast(data.error?.message || 'Failed to load crop calendars', 'error');
            }
        } catch (error) {
            console.error('CRITICAL FRONTEND FETCH ERROR:', error);
            showToast('Network error while loading crops', 'error');
        }
    }, [showToast]);

    useEffect(() => {
        const loadInitialData = async () => {
            console.log('--- Initial Data Load Starting ---');
            await fetchPlans();
            await fetchCropCalendars();
            console.log('--- Initial Data Load Complete ---');
        };
        loadInitialData();
    }, [fetchPlans, fetchCropCalendars]);

    const handleReviewAction = async (action) => {
        if (!feedback.trim()) {
            showToast('Please enter feedback for the farmer', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
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
            const token = localStorage.getItem('token');
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
        if (!window.confirm('Are you sure you want to remove this crop calendar image?')) return;
        
        setIsSavingCalendar(true);
        try {
            const token = localStorage.getItem('token');
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

    const handleDeleteCrop = (cropId) => {
        setCropCalendars(prev => prev.filter(crop => crop.id !== cropId));
        if (currentCalendarId === cropId) {
            setCurrentCalendarId(cropCalendars[0]?.id || null);
        }
        showToast(`Crop ${cropId} deleted successfully!`, 'success');
    };



    const renderPlanDetails = (plan) => (
        <div className="instructor-detail-view">
            <div className="instructor-detail-header">
                <h3>{plan.cropName} Plan Details</h3>
                <button className="btn btn-secondary" onClick={() => setSelectedPlan(null)}>Close</button>
            </div>

            <div className="instructor-details-grid">
                <div className="instructor-detail-group">
                    <p><strong>Farmer:</strong> {plan.farmerName}</p>
                    <p><strong>ID:</strong> {plan.farmerId}</p>
                    <p><strong>Location:</strong> {plan.location}</p>
                    <p><strong>Submitted Date:</strong> {plan.submittedDate}</p>
                </div>
                <div className="instructor-detail-group">
                    <p><strong>Planting Date:</strong> {plan.plantDate}</p>
                    <p><strong>Expected Harvest:</strong> {plan.harvestDate}</p>
                    <p><strong>Status:</strong> <StatusBadge status={plan.status} type={plan.status === 'Approved' ? 'success' : plan.status === 'Pending Review' ? 'warning' : 'danger'} /></p>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <strong>Farmer's Notes:</strong>
                <div className="instructor-description-box">
                    {plan.cropNotes}
                </div>
                {plan.farmerFiles && plan.farmerFiles.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                        <strong>Farmer's Attachments:</strong>
                        <div className="instructor-attachment-list">
                            {plan.farmerFiles.map((file, idx) => (
                                <a
                                    key={idx}
                                    href={getDownloadUrl(file)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="instructor-attachment-item"
                                    style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}
                                    download
                                >
                                    <i className={file.endsWith('.pdf') ? 'fas fa-file-pdf' : 'fas fa-image'} style={{ marginRight: '8px' }}></i>
                                    <span style={{ fontSize: '0.9rem' }}>
                                        {getFriendlyFileName(file)}
                                    </span>
                                    <i className="fas fa-download" style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#666' }}></i>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {plan.status === 'Pending Review' ? (
                <div className="instructor-action-section">
                    <label>Your Feedback / Recommendations:</label>
                    <textarea
                        className="form-control"
                        rows="5"
                        placeholder="Provide your professional feedback, recommended adjustments, or approval comments..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                    ></textarea>

                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label>Attach Supporting Documents (Optional):</label>
                        <div className="file-upload" style={{ marginTop: '8px' }}>
                            <input
                                type="file"
                                className="form-control"
                                accept="image/*,.pdf,.doc,.docx"
                                onChange={(e) => setAttachment(e.target.files[0])}
                            />
                            <small className="file-hint" style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                                Upload cultivation guides or soil report templates for the farmer
                            </small>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                        <button className="btn btn-success" onClick={() => handleReviewAction('approve')}>
                            <i className="fas fa-check-circle"></i> Approve Plan
                        </button>
                        <button className="btn btn-warning" onClick={() => handleReviewAction('correction')}>
                            <i className="fas fa-undo"></i> Request Correction
                        </button>
                    </div>
                </div>
            ) : (
                <div className="instructor-action-section">
                    <strong>Your Feedback (on {plan.reviewedDate}):</strong>
                    <div className="instructor-history-box">
                        {plan.instructorFeedback}
                    </div>
                    {plan.attachments && plan.attachments.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                            <strong>Shared Documents:</strong>
                            <div className="instructor-attachment-list">
                                {plan.attachments.map((file, idx) => (
                                    <a
                                        key={idx}
                                        href={getDownloadUrl(file)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="instructor-attachment-item"
                                        style={{ color: '#2e7d32', borderColor: '#c8e6c9', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                                        download
                                    >
                                        <i className="fas fa-file-alt" style={{ marginRight: '8px' }}></i>
                                        <span style={{ fontSize: '0.9rem' }}>
                                            {getFriendlyFileName(file)}
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
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <>
            <div className="cards-grid">
                {/* New Plans for Review - The mirror of Farmer's 'Plans Sent to Review' */}
                <div className="card full-width-card">
                    <div className="card-header">
                        <div className="card-title">Pending Crop Plan Reviews</div>
                        <div className="card-icon"><i className="fas fa-hourglass-half"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="instructor-list-container">
                            {pendingPlans.map((plan) => (
                                <div className="instructor-list-item" key={plan.id} onClick={() => setSelectedPlan(plan)}>
                                    <div className="instructor-list-info">
                                        <h4>{plan.cropName}</h4>
                                        <div className="instructor-list-details">
                                            <p><strong>Farmer:</strong> {plan.farmerName} ({plan.farmerId})</p>
                                            <p><strong>Location:</strong> {plan.location}</p>
                                            <p>Planting: {plan.plantDate} • Submitted: {plan.submittedDate}</p>
                                        </div>
                                    </div>
                                    <div className="instructor-list-side">
                                        <StatusBadge status="Review Pending" type="warning" />
                                        <button className="btn btn-primary btn-sm">Review Plan</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Plan Detail View - The Review Bridge */}
                {selectedPlan && (
                    <div className="card full-width-card" style={{ border: '2px solid var(--primary)' }}>
                        {renderPlanDetails(selectedPlan)}
                    </div>
                )}

                {/* Reviewed History - The mirror of Farmer's 'Reviewed Plans' */}
                <div className="card full-width-card">
                    <div className="card-header">
                        <div className="card-title">Reviewed Plans History</div>
                        <div className="card-icon"><i className="fas fa-history"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="instructor-list-container">
                            {reviewedPlans.map((plan) => (
                                <div className="instructor-list-item" key={plan.id} onClick={() => setSelectedPlan(plan)}>
                                    <div className="instructor-list-info">
                                        <h4>{plan.cropName}</h4>
                                        <div className="instructor-list-details">
                                            <p><strong>Farmer:</strong> {plan.farmerName} ({plan.farmerId}) • {plan.location}</p>
                                            <p>Planting: {plan.plantDate} • Reviewed: {plan.reviewedDate}</p>
                                        </div>
                                    </div>
                                    <div className="instructor-list-side">
                                        <StatusBadge status={plan.status} type={plan.status === 'Approved' ? 'success' : 'danger'} />
                                        <button className="btn btn-primary btn-sm">View History</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Crop Calendar Card - Added at the bottom */}
                <div className="card full-width-card">
                    <div className="card-header">
                        <div className="card-title">Reference Crop Calendar</div>
                        <div className="card-actions" style={{ display: 'flex', gap: '10px', position: 'relative' }}>
                            <select
                                className="form-select"
                                value={currentCalendarId}
                                onChange={(e) => setCurrentCalendarId(e.target.value)}
                                style={{ 
                                    width: '150px',
                                    backgroundColor: 'white',
                                    color: '#333',
                                    border: '1px solid #ced4da',
                                    cursor: 'pointer'
                                }}
                            >
                                {cropCalendars.map(cal => (
                                <option key={cal.id} value={cal.id.toString()}>{cal.name}</option>
                            ))}
                            </select>
                            <button className="btn btn-secondary" onClick={toggleZoom} title="View Fullscreen">
                                <i className="fas fa-expand"></i>
                            </button>
                            <button className="btn btn-info" onClick={() => setShowManageModal(true)} title="Manage Crop Calendars">
                                <i className="fas fa-cog"></i> Manage
                            </button>
                        </div>
                    </div>
                    <div className="card-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                        {currentCalendar ? (
                            <img
                                src={currentCalendar.image}
                                alt={`${currentCalendar.name} Crop Calendar`}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '600px',
                                    borderRadius: '8px',
                                    objectFit: 'contain',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                                onClick={toggleZoom}
                            />
                        ) : (
                            <p>No crop calendar selected or available.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Fullscreen Zoom Modal */}
            {isZoomed && (
                <div className="instructor-fullscreen-overlay" onClick={toggleZoom}>
                    <div className="instructor-fullscreen-container" onClick={e => e.stopPropagation()}>
                        <div className="instructor-fullscreen-controls">
                            <div className="instructor-zoom-group">
                                <button className="btn btn-secondary" onClick={handleZoomOut} title="Zoom Out">
                                    <i className="fas fa-minus"></i>
                                </button>
                                <div className="instructor-zoom-level">
                                    {Math.round(zoomLevel * 100)}%
                                </div>
                                <button className="btn btn-secondary" onClick={handleZoomIn} title="Zoom In">
                                    <i className="fas fa-plus"></i>
                                </button>
                            </div>
                            <button className="btn btn-danger" onClick={toggleZoom}>
                                <i className="fas fa-times"></i> Close
                            </button>
                        </div>

                        <img
                            src={cropCalendarImage}
                            alt="Crop Calendar Fullscreen"
                            className="instructor-fullscreen-image"
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
                    <Modal.Title>Manage Crop Calendars</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ overflow: 'visible', minHeight: '300px' }}>
                    <div style={{ position: 'relative', zIndex: 1060 }}>
                        <h5>Update Crop Calendar Image</h5>
                        <Form.Group controlId="imageUpdateCropSelect" className="mb-3">
                            <Form.Label>Select Crop to Update Image</Form.Label>
                            <Form.Select
                                value={selectedCropForImageUpdate}
                                onChange={(e) => {
                                    console.log('Dropdown changed to:', e.target.value);
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
                                <option value="">Select a crop</option>
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
                        <Form.Label>Upload New Image</Form.Label>
                        <div className="d-flex align-items-center">
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImageFileToUpload(e.target.files[0])}
                                disabled={!selectedCropForImageUpdate || isSavingCalendar}
                            />
                            {selectedCropForImageUpdate && cropCalendars.find(crop => crop.id.toString() === selectedCropForImageUpdate.toString())?.image && (
                                <Button
                                    variant="outline-danger"
                                    className="ms-2"
                                    onClick={() => handleRemoveImage(selectedCropForImageUpdate)}
                                >
                                    Remove Image
                                </Button>
                            )}

                        </div>
                        <Form.Text className="text-muted">
                            Select a crop above before uploading a new image. If an image already exists, you must remove it first.
                        </Form.Text>
                    </Form.Group>

                    <h5 className="mt-4">Existing Crop Calendars</h5>
                    <ul className="list-group">
                        {cropCalendars.map(crop => (
                            <li key={crop.id} className="list-group-item d-flex justify-content-between align-items-center">
                                {crop.name}
                                {crop.image && (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleRemoveImage(crop.id)}
                                    >
                                        Remove Image
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
                        {isSavingCalendar ? <Spinner animation="border" size="sm" /> : 'Save'}
                    </Button>
                    <Button variant="secondary" onClick={() => setShowManageModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default CropPlanReview;
