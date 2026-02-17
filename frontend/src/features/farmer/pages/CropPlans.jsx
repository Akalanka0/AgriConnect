import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import defaultCropCalendarImage from '../components/Paddy-DRY-INTER-Wariposhitha-S-scaled.jpg';
import { getDownloadUrl } from '../../../utils/fileUtils';

const NotesDisplay = ({ notes }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const MAX_LENGTH = 100; // You can adjust this value

    if (notes.length <= MAX_LENGTH) {
        return <p className="plan-notes"><strong>Notes:</strong> {notes}</p>;
    }

    return (
        <p className="plan-notes">
            <strong>Notes:</strong> {isExpanded ? notes : `${notes.substring(0, MAX_LENGTH)}...`}
            <button className="btn btn-link btn-sm" onClick={() => setIsExpanded(!isExpanded)} style={{ marginLeft: '5px' }}>
                {isExpanded ? 'Show Less' : 'Read More'}
            </button>
        </p>
    );
};

const CropPlans = () => {
    const { showToast } = useOutletContext();
    const [selectedCropCalendar, setSelectedCropCalendar] = useState('');
    const [availableCropCalendars, setAvailableCropCalendars] = useState([]);

    const [selectedCropPlan, setSelectedCropPlan] = useState('');
    const [availableCropPlans, setAvailableCropPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedPlanData, setSelectedPlanData] = useState(null);
    const [cropForm, setCropForm] = useState({
        cropName: '',
        customCropName: '',
        fieldLocation: '',
        assignedInstructor: '',
        assignedInstructorId: '',
        plantDate: '',
        harvestDate: '',
        cropNotes: ''
    });

    const cropOptions = [
        'Paddy',
        'Chilli',
        'Finger Millet',
        'Maize',
        'Soya Beans',
        'Custom'
    ];

    const [isNotesExpanded, setIsNotesExpanded] = useState(false);
    const MAX_NOTES_LENGTH = 100;

    const [availableLocations, setAvailableLocations] = useState([]);

    // Fetch farmer's profile and crop plans on mount
    useEffect(() => {
        const fetchFarmerData = async () => {
            try {
                const token = localStorage.getItem('token');
                
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
                            instructorId: location.instructorId || location.assignedInstructorId || ''
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
            } finally {
                setLoading(false);
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
            assignedInstructorId: selectedLoc ? selectedLoc.instructorId : ''
        }));
    };

    const [imageFile, setImageFile] = useState(null);

    const handleCropSubmit = async () => {
        const finalCropName = cropForm.cropName === 'Custom' ? cropForm.customCropName : cropForm.cropName;
        
        // Extract base location part (before instructor name in parentheses)
        const baseLocation = cropForm.fieldLocation.split(' (')[0];
        const selectedLoc = availableLocations.find(loc => 
            `${loc.district || ''} - ${loc.zone} - ${loc.instructorDivision}` === baseLocation
        );

        if (!finalCropName || !cropForm.fieldLocation || !cropForm.plantDate || !cropForm.harvestDate) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
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
                showToast('Crop plan created successfully!');
                setCropForm(prev => ({
                    ...prev,
                    cropName: '',
                    customCropName: '',
                    fieldLocation: '',
                    assignedInstructor: '',
                    assignedInstructorId: '',
                    cropNotes: ''
                }));
                setImageFile(null);
                // Reset file input
                const fileInput = document.querySelector('input[type="file"]');
                if (fileInput) fileInput.value = '';

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
            showToast('Failed to create crop plan', 'error');
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
        <div className="page active" id="crop" style={{ display: 'block' }}>
            <div className="page-title">
                <i className="fas fa-clipboard-list"></i>
                <h2>Crop Plan Management</h2>
            </div>

            <div className="cards-grid">
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Create Crop Plan</div>
                        <div className="card-icon"><i className="fas fa-clipboard-list"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="form-group">
                            <label>Crop Name</label>
                            <select
                                className="form-control"
                                value={cropForm.cropName}
                                onChange={(e) => setCropForm({ ...cropForm, cropName: e.target.value })}
                            >
                                <option value="">Select a crop...</option>
                                {cropOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        {cropForm.cropName === 'Custom' && (
                            <div className="form-group">
                                <label>Custom Crop Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter custom crop name"
                                    value={cropForm.customCropName}
                                    onChange={(e) => setCropForm({ ...cropForm, customCropName: e.target.value })}
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Instructor Division (Select from your registered lands)</label>
                            <select
                                className="form-control"
                                value={cropForm.fieldLocation}
                                onChange={handleLocationChange}
                            >
                                <option value="">Select a field...</option>
                                {availableLocations.map(loc => (
                                    <option key={loc.id} value={`${loc.district || ''} - ${loc.zone} - ${loc.instructorDivision} (${loc.instructorName})`}>
                                        {loc.district || ''} - {loc.zone} - {loc.instructorDivision} ({loc.instructorName})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Assigned Instructor</label>
                            <input
                                type="text"
                                className="form-control"
                                value={cropForm.assignedInstructor || ''}
                                disabled
                                placeholder="Instructor will be assigned automatically"
                                style={{ 
                                    backgroundColor: cropForm.assignedInstructor ? '#f8f9fa' : '#e9ecef', 
                                    cursor: 'not-allowed'
                                }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Instructor ID</label>
                            <input
                                type="text"
                                className="form-control"
                                value={cropForm.assignedInstructorId || ''}
                                disabled
                                placeholder="Instructor ID will be assigned automatically"
                                style={{ 
                                    backgroundColor: cropForm.assignedInstructorId ? '#f8f9fa' : '#e9ecef', 
                                    cursor: 'not-allowed'
                                }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Planting Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={cropForm.plantDate}
                                onChange={(e) => setCropForm({ ...cropForm, plantDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Expected Harvest Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={cropForm.harvestDate}
                                onChange={(e) => setCropForm({ ...cropForm, harvestDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Notes / Comments</label>
                            <textarea
                                className="form-control"
                                rows="2"
                                value={cropForm.cropNotes}
                                onChange={(e) => setCropForm({ ...cropForm, cropNotes: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Attach Image/Document</label>
                            <input 
                                type="file" 
                                className="form-control" 
                                onChange={(e) => setImageFile(e.target.files[0])}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={handleCropSubmit}>
                            <i className="fas fa-paper-plane"></i> Send to Review
                        </button>
                    </div>
                </div>

                {/* Crop Calendar Card */}
                <div className="card wider-card">
                    <div className="card-header">
                        <div className="card-title">Crop Calendar</div>
                        <div className="card-actions" style={{ display: 'flex', gap: '10px' }}>
                            <select
                                className="form-control"
                                style={{ width: '200px' }}
                                value={selectedCropCalendar}
                                onChange={(e) => setSelectedCropCalendar(e.target.value)}
                            >
                                <option value="">Select Crop Calendar</option>
                                {availableCropCalendars.map((calendar) => (
                                    <option key={calendar.id} value={calendar.id.toString()}>
                                        {calendar.name}
                                    </option>
                                ))}
                            </select>
                            <button className="btn btn-secondary" onClick={toggleZoom} title="View Fullscreen">
                                <i className="fas fa-expand"></i>
                            </button>
                            <button className="btn btn-primary" onClick={handleDownloadCalendar} title="Download Calendar">
                                <i className="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                    <div className="card-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img
                            src={displayedCalendarImage}
                            alt="Crop Calendar"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '500px',
                                borderRadius: '8px',
                                objectFit: 'contain',
                                cursor: 'pointer'
                            }}
                            onClick={toggleZoom}
                        />
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
                                    <button className="btn btn-secondary" onClick={handleZoomOut} style={{ borderRadius: 0, padding: '8px 12px' }} title="Zoom Out">
                                        <i className="fas fa-minus"></i>
                                    </button>
                                    <div style={{ padding: '8px 12px', background: '#f8f9fa', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd', fontWeight: 'bold' }}>
                                        {Math.round(zoomLevel * 100)}%
                                    </div>
                                    <button className="btn btn-secondary" onClick={handleZoomIn} style={{ borderRadius: 0, padding: '8px 12px' }} title="Zoom In">
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
                                src={displayedCalendarImage}
                                alt="Crop Calendar Fullscreen"
                                style={{
                                    maxWidth: 'none',
                                    height: `${zoomLevel * 90}vh`,
                                    borderRadius: '8px',
                                    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                                    objectFit: 'contain',
                                    transition: 'height 0.2s ease-out'
                                }}
                            />
                        </div>
                    </div>
                )}

                <div className="card full-width-card">
                    <div className="card-header">
                        <div className="card-title">Plans Sent to Review</div>
                        <div className="card-icon"><i className="fas fa-clock"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="plans-review-list">
                            {availableCropPlans.filter(p => p.status === 'pending').length > 0 ? (
                                availableCropPlans.filter(p => p.status === 'pending').map((plan) => (
                                    <div className="plan-review-item" key={plan.id}>
                                        <div className="plan-info">
                                            <div className="plan-header">
                                                <div className="plan-title-section">
                                                    <h4>{plan.crop_name} <span className="status-badge status-pending">Pending Review</span></h4>
                                                </div>
                                            </div>
                                            <div className="plan-details">
                                                <p><strong>Location:</strong> {plan.field_location}</p>
                                                <p><strong>Planting Date:</strong> {plan.plant_date}</p>
                                                {plan.notes && (
                                                    <NotesDisplay notes={plan.notes} />
                                                )}
                                            </div>
                                        </div>
                                        <div className="plan-actions">
                                            <button className="btn btn-primary" onClick={() => handleOpenViewModal(plan)}>View</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>No plans currently in review.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reviewed Plans Card */}
                <div className="card full-width-card">
                    <div className="card-header">
                        <div className="card-title">Reviewed Plans</div>
                        <div className="card-icon"><i className="fas fa-check-circle"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="reviewed-plans-grid">
                            {availableCropPlans.filter(p => p.status === 'approved' || p.status === 'rejected' || p.status === 'correction').length > 0 ? (
                                availableCropPlans.filter(p => p.status === 'approved' || p.status === 'rejected' || p.status === 'correction').map((plan) => (
                                    <div className="reviewed-plan-item" key={plan.id}>
                                        <div className="plan-info">
                                            <div className="plan-header">
                                                <div className="plan-title-section">
                                                    <h4>
                                                        {plan.crop_name} 
                                                        <span className={`status-badge status-${plan.status === 'approved' ? 'active' : (plan.status === 'correction' ? 'warning' : 'rejected')}`}>
                                                            {plan.status === 'correction' ? 'Correction Requested' : (plan.status.charAt(0).toUpperCase() + plan.status.slice(1))}
                                                        </span>
                                                    </h4>
                                                </div>
                                            </div>
                                            <div className="plan-details">
                                                <p><strong>Location:</strong> {plan.field_location}</p>
                                                <p><strong>Planting Date:</strong> {plan.plant_date}</p>
                                                <p><strong>Expected Harvest:</strong> {plan.harvest_date}</p>
                                                {plan.notes && (
                                                    <NotesDisplay notes={plan.notes} />
                                                )}
                                                {plan.instructor_feedback && (
                                                    <div className="feedback-section" style={{ 
                                                        marginTop: '10px', 
                                                        padding: '10px', 
                                                        backgroundColor: plan.status === 'correction' ? '#fff3cd' : '#f8f9fa', 
                                                        borderRadius: '4px',
                                                        borderLeft: plan.status === 'correction' ? '4px solid #ffc107' : '4px solid #dee2e6'
                                                    }}>
                                                        <strong>Instructor Feedback:</strong>
                                                        <p style={{ margin: '5px 0 0 0' }}>{plan.instructor_feedback}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="plan-actions">
                                            <button className="btn btn-primary" onClick={() => handleOpenViewModal(plan)}>View Details</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>No reviewed plans found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* View Plan Details Modal */}
            {isViewModalOpen && selectedPlanData && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 10000,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px'
                }} onClick={handleCloseViewModal}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        width: '100%',
                        maxWidth: '800px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        position: 'relative',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            padding: '20px 30px',
                            borderBottom: '1px solid #eee',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            position: 'sticky',
                            top: 0,
                            background: 'white',
                            zIndex: 1
                        }}>
                            <h3 style={{ margin: 0, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fas fa-file-alt" style={{ color: '#4caf50' }}></i>
                                Crop Plan Details
                            </h3>
                            <button 
                                onClick={handleCloseViewModal}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#999',
                                    padding: '5px'
                                }}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div style={{ padding: '30px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                                <div>
                                    <h4 style={{ color: '#4caf50', marginBottom: '15px', borderBottom: '2px solid #f0f0f0', paddingBottom: '5px' }}>Plan Information</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <p style={{ margin: 0 }}><strong>Crop:</strong> {selectedPlanData.crop_name}</p>
                                        <p style={{ margin: 0 }}><strong>Status:</strong> 
                                            <span className={`status-badge status-${selectedPlanData.status === 'approved' ? 'active' : (selectedPlanData.status === 'pending' ? 'pending' : (selectedPlanData.status === 'correction' ? 'warning' : 'rejected'))}`} style={{ marginLeft: '8px' }}>
                                                {selectedPlanData.status === 'correction' ? 'Correction Requested' : (selectedPlanData.status.charAt(0).toUpperCase() + selectedPlanData.status.slice(1))}
                                            </span>
                                        </p>
                                        <p style={{ margin: 0 }}><strong>Location:</strong> {selectedPlanData.field_location}</p>
                                        <p style={{ margin: 0 }}><strong>Planting Date:</strong> {selectedPlanData.plant_date}</p>
                                        <p style={{ margin: 0 }}><strong>Harvest Date:</strong> {selectedPlanData.harvest_date}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 style={{ color: '#4caf50', marginBottom: '15px', borderBottom: '2px solid #f0f0f0', paddingBottom: '5px' }}>Farmer Notes</h4>
                                    <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', minHeight: '100px', border: '1px solid #eee' }}>
                                        {selectedPlanData.notes || 'No notes provided.'}
                                    </div>
                                </div>
                            </div>

                            {selectedPlanData.instructor_feedback && (
                                <div style={{ marginBottom: '30px' }}>
                                    <h4 style={{ color: '#ff9800', marginBottom: '15px', borderBottom: '2px solid #fff3cd', paddingBottom: '5px' }}>Instructor Feedback</h4>
                                    <div style={{ 
                                        background: selectedPlanData.status === 'correction' ? '#fff3cd' : '#f8f9fa', 
                                        padding: '20px', 
                                        borderRadius: '8px', 
                                        borderLeft: selectedPlanData.status === 'correction' ? '5px solid #ffc107' : '5px solid #dee2e6',
                                        color: '#666'
                                    }}>
                                        <p style={{ margin: 0, fontSize: '1.1em', fontStyle: 'italic' }}>"{selectedPlanData.instructor_feedback}"</p>
                                    </div>
                                </div>
                            )}

                            {(selectedPlanData.farmer_attachments?.length > 0 || selectedPlanData.instructor_attachments?.length > 0) && (
                                <div>
                                    <h4 style={{ color: '#4caf50', marginBottom: '15px', borderBottom: '2px solid #f0f0f0', paddingBottom: '5px' }}>Attachments</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        {selectedPlanData.farmer_attachments?.length > 0 && (
                                            <div>
                                                <p style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '0.9em', color: '#888' }}>YOUR ATTACHMENTS</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                    {selectedPlanData.farmer_attachments.map((url, idx) => (
                                                        <a 
                                                            key={idx} 
                                                            href={getDownloadUrl(url)} 
                                                            download
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                padding: '8px 15px',
                                                                background: '#e8f5e9',
                                                                color: '#2e7d32',
                                                                borderRadius: '20px',
                                                                textDecoration: 'none',
                                                                fontSize: '0.85em',
                                                                border: '1px solid #c8e6c9'
                                                            }}
                                                        >
                                                            <i className="fas fa-download"></i> Download File {idx + 1}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {selectedPlanData.instructor_attachments?.length > 0 && (
                                            <div>
                                                <p style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '0.9em', color: '#888' }}>INSTRUCTOR DOCUMENTS</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                    {selectedPlanData.instructor_attachments.map((url, idx) => (
                                                        <a 
                                                            key={idx} 
                                                            href={getDownloadUrl(url)} 
                                                            download
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                padding: '8px 15px',
                                                                background: '#fff3e0',
                                                                color: '#ef6c00',
                                                                borderRadius: '20px',
                                                                textDecoration: 'none',
                                                                fontSize: '0.85em',
                                                                border: '1px solid #ffe0b2'
                                                            }}
                                                        >
                                                            <i className="fas fa-file-download"></i> Download Doc {idx + 1}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{
                            padding: '20px 30px',
                            borderTop: '1px solid #eee',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            background: '#f9f9f9'
                        }}>
                            <button 
                                className="btn btn-secondary" 
                                onClick={handleCloseViewModal}
                                style={{ padding: '8px 25px' }}
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
