import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import StatusBadge from '../../admin/components/StatusBadge';
import cropCalendarImage from '../components/Paddy-DRY-INTER-Wariposhitha-S-scaled.jpg';

const CropPlanReview = () => {
    const { showToast } = useOutletContext();
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [feedback, setFeedback] = useState('');

    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    const handleDownloadCalendar = () => {
        const link = document.createElement('a');
        link.href = cropCalendarImage;
        link.download = 'Crop_Calendar.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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

    // Mock Data for Instructor's view (Perfectly aligned with Farmer's CropPlans fields)
    const pendingPlans = [
        { 
            id: 1,
            farmerName: 'Sunil Perera',
            farmerId: 'FARM-2026-0045',
            location: 'Rajanganaya - Yaya 4',
            submittedDate: '2025-10-15',
            cropName: 'Rice Paddy',
            plantDate: '2025-11-01',
            harvestDate: '2026-02-15',
            cropNotes: 'Standard rice paddy cultivation plan for the upcoming Maha season. Planning to use organic fertilizers primarily.',
            status: 'Pending Review',
            farmerFiles: ['soil_report_yaya4.pdf', 'land_layout.jpg']
        },
        { 
            id: 2,
            farmerName: 'Kamala Fernando',
            farmerId: 'FARM-2026-0082',
            location: 'Vilachchiya - Track 4',
            submittedDate: '2025-10-14',
            cropName: 'Tomatoes',
            plantDate: '2025-10-25',
            harvestDate: '2026-01-10',
            cropNotes: 'Greenhouse tomato cultivation. Need advice on irrigation frequency.',
            status: 'Pending Review',
            farmerFiles: ['greenhouse_specs.pdf']
        }
    ];

    const reviewedPlans = [
        { 
            id: 3,
            farmerName: 'Nimal Rajapaksa',
            farmerId: 'FARM-2026-0012',
            location: 'Rajanganaya - Yaya 4',
            submittedDate: '2025-10-10',
            cropName: 'Corn',
            plantDate: '2025-10-15',
            harvestDate: '2026-01-20',
            cropNotes: 'Hybrid corn variety. Soil test completed.',
            status: 'Approved',
            instructorFeedback: 'Soil test results look good. Ensure nitrogen levels are maintained during the growth phase.',
            reviewedDate: '2025-10-12',
            farmerFiles: ['soil_test_results.pdf'],
            attachments: ['Rice_Cultivation_Guide.pdf']
        }
    ];

    const handleReviewAction = (action) => {
        if (!feedback.trim()) {
            showToast('Please enter feedback for the farmer', 'error');
            return;
        }
        showToast(`Plan ${action === 'approve' ? 'approved' : 'returned for correction'} successfully!`);
        setFeedback('');
        setSelectedPlan(null);
    };

    const renderPlanDetails = (plan) => (
        <div className="plan-detail-view" style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>{plan.cropName} Plan Details</h3>
                <button className="btn btn-secondary" onClick={() => setSelectedPlan(null)}>Close</button>
            </div>
            
            <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="detail-group">
                    <p style={{ marginBottom: '8px' }}><strong>Farmer:</strong> {plan.farmerName}</p>
                    <p style={{ marginBottom: '8px' }}><strong>ID:</strong> {plan.farmerId}</p>
                    <p style={{ marginBottom: '8px' }}><strong>Location:</strong> {plan.location}</p>
                    <p style={{ marginBottom: '8px' }}><strong>Submitted Date:</strong> {plan.submittedDate}</p>
                </div>
                <div className="detail-group">
                    <p style={{ marginBottom: '8px' }}><strong>Planting Date:</strong> {plan.plantDate}</p>
                    <p style={{ marginBottom: '8px' }}><strong>Expected Harvest:</strong> {plan.harvestDate}</p>
                    <p style={{ marginBottom: '8px' }}><strong>Status:</strong> <StatusBadge status={plan.status} type={plan.status === 'Approved' ? 'success' : plan.status === 'Pending Review' ? 'warning' : 'danger'} /></p>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <strong>Farmer's Notes:</strong>
                <p style={{ 
                    backgroundColor: '#fff', 
                    padding: '15px', 
                    borderRadius: '6px', 
                    borderLeft: '4px solid var(--primary)', 
                    marginTop: '8px',
                    lineHeight: '1.5',
                    color: '#444'
                }}>
                    {plan.cropNotes}
                </p>
                {plan.farmerFiles && plan.farmerFiles.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                        <strong>Farmer's Attachments:</strong>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                            {plan.farmerFiles.map((file, idx) => (
                                <div key={idx} style={{ 
                                    padding: '8px 12px', 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #ddd', 
                                    borderRadius: '4px',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--primary)',
                                    cursor: 'pointer'
                                }}>
                                    <i className={file.endsWith('.pdf') ? 'fas fa-file-pdf' : 'fas fa-image'}></i>
                                    {file}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {plan.status === 'Pending Review' ? (
                <div className="review-section" style={{ borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '10px' }}><strong>Your Feedback / Recommendations:</strong></label>
                    <textarea 
                        className="form-control" 
                        rows="5" 
                        placeholder="Provide your professional feedback, recommended adjustments, or approval comments..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                    ></textarea>
                    
                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label><strong>Attach Supporting Documents (Optional):</strong></label>
                        <div className="file-upload" style={{ marginTop: '8px' }}>
                            <input type="file" className="form-control" accept="image/*,.pdf,.doc,.docx" />
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
                <div className="feedback-history-section" style={{ borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                    <strong>Your Feedback (on {plan.reviewedDate}):</strong>
                    <p style={{ 
                        backgroundColor: '#e8f5e9', 
                        padding: '15px', 
                        borderRadius: '6px', 
                        marginTop: '8px',
                        color: '#2e7d32',
                        lineHeight: '1.5'
                    }}>
                        {plan.instructorFeedback}
                    </p>
                    {plan.attachments && plan.attachments.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                            <strong>Shared Documents:</strong>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                {plan.attachments.map((file, idx) => (
                                    <div key={idx} style={{ 
                                        padding: '8px 12px', 
                                        backgroundColor: '#fff', 
                                        border: '1px solid #c8e6c9', 
                                        borderRadius: '4px',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: '#2e7d32'
                                    }}>
                                        <i className="fas fa-file-alt"></i>
                                        {file}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="page active">
            <div className="page-title">
                <i className="fas fa-clipboard-list"></i>
                <h2>Crop Plan Management</h2>
            </div>

            <div className="cards-grid">
                {/* New Plans for Review - The mirror of Farmer's 'Plans Sent to Review' */}
                <div className="card full-width-card">
                    <div className="card-header">
                        <div className="card-title">Pending Crop Plan Reviews</div>
                        <div className="card-icon"><i className="fas fa-hourglass-half"></i></div>
                    </div>
                    <div className="card-content" style={{ maxHeight: '550px', overflowY: 'auto' }}>
                        <div className="plans-review-list">
                            {pendingPlans.map((plan) => (
                                <div className="plan-review-item" key={plan.id} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '18px', 
                                    borderBottom: '1px solid #eee',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }} onClick={() => setSelectedPlan(plan)}>
                                    <div className="plan-info">
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>{plan.cropName}</h4>
                                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                            <strong>{plan.farmerName}</strong> ({plan.farmerId})
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                                            {plan.location}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
                                            Planting: {plan.plantDate} • Submitted: {plan.submittedDate}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
                        <div className="reviewed-plans-grid">
                            {reviewedPlans.map((plan) => (
                                <div className="reviewed-plan-item" key={plan.id} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'flex-start', 
                                    padding: '20px', 
                                    borderBottom: '1px solid #eee' 
                                }}>
                                    <div className="plan-info" style={{ flex: '1' }}>
                                        <div className="plan-header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{plan.cropName}</h4>
                                            <span className="reviewed-date" style={{ color: '#888', fontSize: '0.85rem' }}>Reviewed on: {plan.reviewedDate}</span>
                                        </div>
                                        <div className="plan-details" style={{ fontSize: '0.9rem' }}>
                                            <p style={{ margin: '0 0 5px 0' }}><strong>Farmer:</strong> {plan.farmerName} ({plan.farmerId}) • {plan.location}</p>
                                            <p style={{ margin: '0 0 5px 0' }}><strong>Planting Date:</strong> {plan.plantDate}</p>
                                            <p style={{ margin: '0 0 5px 0' }}><strong>Expected Harvest:</strong> {plan.harvestDate}</p>
                                            <p style={{ margin: '0' }}><strong>Submitted Date:</strong> {plan.submittedDate}</p>
                                        </div>
                                    </div>
                                    <div className="reviewed-plan-side" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '15px' }}>
                                        <StatusBadge status={plan.status} type={plan.status === 'Approved' ? 'success' : 'danger'} />
                                        <button className="btn btn-primary" onClick={() => setSelectedPlan(plan)}>
                                            View Full History
                                        </button>
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
                        <div className="card-actions" style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-secondary" onClick={toggleZoom} title="View Fullscreen">
                                <i className="fas fa-expand"></i>
                            </button>
                            <button className="btn btn-primary" onClick={handleDownloadCalendar} title="Download Calendar">
                                <i className="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                    <div className="card-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                        <img 
                            src={cropCalendarImage} 
                            alt="Crop Calendar" 
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
                    </div>
                </div>
            </div>

            {/* Fullscreen Zoom Modal */}
            {isZoomed && (
                <div style={{ 
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 9999,
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'auto',
                    padding: '40px'
                }} onClick={toggleZoom}>
                    <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            position: 'fixed',
                            top: '20px',
                            right: '20px',
                            zIndex: 10001,
                            display: 'flex',
                            gap: '10px'
                        }}>
                            <div className="btn-group" style={{ display: 'flex', background: 'white', borderRadius: '4px', overflow: 'hidden' }}>
                                <button className="btn btn-secondary" onClick={handleZoomOut} style={{ borderRadius: 0, padding: '8px 12px', color: '#333' }} title="Zoom Out">
                                    <i className="fas fa-minus"></i>
                                </button>
                                <div style={{ padding: '8px 12px', background: '#f8f9fa', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd', fontWeight: 'bold', color: '#333' }}>
                                    {Math.round(zoomLevel * 100)}%
                                </div>
                                <button className="btn btn-secondary" onClick={handleZoomIn} style={{ borderRadius: 0, padding: '8px 12px', color: '#333' }} title="Zoom In">
                                    <i className="fas fa-plus"></i>
                                </button>
                            </div>
                            <button 
                                className="btn btn-danger" 
                                onClick={toggleZoom}
                            >
                                <i className="fas fa-times"></i> Close
                            </button>
                        </div>
                        
                        <img 
                            src={cropCalendarImage} 
                            alt="Crop Calendar Fullscreen" 
                            style={{ 
                                maxWidth: 'none',
                                width: zoomLevel > 1 ? `${zoomLevel * 90}vw` : 'auto',
                                height: `${zoomLevel * 90}vh`,
                                borderRadius: '8px',
                                boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                                objectFit: 'contain',
                                transition: 'all 0.2s ease-out'
                            }} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CropPlanReview;
