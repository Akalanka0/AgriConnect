import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import cropCalendarImage from '../components/Paddy-DRY-INTER-Wariposhitha-S-scaled.jpg';

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
    const [cropForm, setCropForm] = useState({
        cropName: '',
        fieldLocation: '',
        assignedInstructor: '',
        assignedInstructorId: '',
        plantDate: '',
        harvestDate: '',
        cropNotes: ''
    });

    const [isNotesExpanded, setIsNotesExpanded] = useState(false);
    const MAX_NOTES_LENGTH = 100;

    // Mock Data for Farmer Locations (Same as in Settings)
    const availableLocations = [
        {
            id: 1,
            businessArea: 'Rajanganaya',
            instructorDivision: 'Yaya 4',
            instructorName: 'Piyadasa Silva',
            instructorId: 'INST-2026-0001'
        },
        {
            id: 2,
            businessArea: 'Vilachchiya',
            instructorDivision: 'Track 4',
            instructorName: 'Upul Tharanga',
            instructorId: 'INST-2026-0002'
        }
    ];

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
        const selectedLoc = availableLocations.find(loc => `${loc.businessArea} - ${loc.instructorDivision}` === selectedValue);
        
        setCropForm(prev => ({
            ...prev,
            fieldLocation: selectedValue,
            assignedInstructor: selectedLoc ? selectedLoc.instructorName : '',
            assignedInstructorId: selectedLoc ? selectedLoc.instructorId : ''
        }));
    };

    const handleCropSubmit = () => {
        if (!cropForm.cropName || !cropForm.fieldLocation || !cropForm.plantDate || !cropForm.harvestDate) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        showToast('Crop plan created successfully!');
        setCropForm(prev => ({
            ...prev,
            cropName: '',
            fieldLocation: '',
            assignedInstructor: '',
            assignedInstructorId: '',
            cropNotes: ''
        }));
    };

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
                            <input
                                type="text"
                                className="form-control"
                                value={cropForm.cropName}
                                onChange={(e) => setCropForm({ ...cropForm, cropName: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Instructor Division (Select from your registered lands)</label>
                            <select
                                className="form-control"
                                value={cropForm.fieldLocation}
                                onChange={handleLocationChange}
                            >
                                <option value="">Select a field...</option>
                                {availableLocations.map(loc => (
                                    <option key={loc.id} value={`${loc.businessArea} - ${loc.instructorDivision}`}>
                                        {loc.businessArea} - {loc.instructorDivision}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Assigned Instructor</label>
                            <input
                                type="text"
                                className="form-control"
                                value={cropForm.assignedInstructor}
                                disabled
                                placeholder="Instructor will be assigned automatically"
                                style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Instructor ID</label>
                            <input
                                type="text"
                                className="form-control"
                                value={cropForm.assignedInstructorId}
                                disabled
                                placeholder="Instructor ID will be assigned automatically"
                                style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
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
                            <input type="file" className="form-control" />
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
                            src={cropCalendarImage} 
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
                                src={cropCalendarImage} 
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

                {/* Plans Sent to Review Card */}
                <div className="card full-width-card">
                    <div className="card-header">
                        <div className="card-title">Plans Sent to Review</div>
                        <div className="card-icon"><i className="fas fa-clock"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="plans-review-list">
                            {[
                                { name: 'Tomatoes', status: 'Pending Review', location: 'Field D', plantingDate: '2025-10-05', notes: 'Initial plan for tomato cultivation. Requires soil testing before approval.' },
                                { name: 'Rice Paddy', status: 'Pending Review', location: 'Field A', plantingDate: '2025-09-15', notes: 'Standard rice paddy cultivation plan. Check water availability for the season. This is a longer note to test the expansion functionality. It should be truncated initially and expand when "Read More" is clicked.' }
                            ].map((plan, index) => (
                                <div className="plan-review-item" key={index}>
                                    <div className="plan-info">
                                        <div className="plan-header">
                                            <div className="plan-title-section">
                                                <h4>{plan.name} <span className="status-badge status-pending">{plan.status}</span></h4>
                                            </div>
                                        </div>
                                        <div className="plan-details">
                                            <p><strong>Location:</strong> {plan.location}</p>
                                            <p><strong>Planting Date:</strong> {plan.plantingDate}</p>
                                            {plan.notes && (
                                                <NotesDisplay notes={plan.notes} />
                                            )}
                                        </div>
                                    </div>
                                    <div className="plan-actions">
                                        <button className="btn btn-primary">View</button>
                                        <button className="btn btn-secondary">Delete</button>
                                    </div>
                                </div>
                            ))}
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
                            {[
                                { name: 'Vegetables', status: 'Approved', location: 'Field B', plantingDate: '2025-08-20', harvestDate: '2025-10-20', notes: 'Approved for organic farming methods. Ensure proper crop rotation.' },
                                { name: 'Corn', status: 'Approved', location: 'Field C', plantingDate: '2025-07-10', harvestDate: '2025-10-10', notes: 'High-yield corn variety approved. Monitor for pest infestations regularly. This is another long note to test the expansion in the reviewed plans section.' }
                            ].map((plan, index) => (
                                <div className="reviewed-plan-item" key={index}>
                                    <div className="plan-info">
                                        <div className="plan-header">
                                            <div className="plan-title-section">
                                                <h4>{plan.name} <span className="status-badge status-active">{plan.status}</span></h4>
                                            </div>
                                        </div>
                                        <div className="plan-details">
                                            <p><strong>Location:</strong> {plan.location}</p>
                                            <p><strong>Planting Date:</strong> {plan.plantingDate}</p>
                                            <p><strong>Expected Harvest:</strong> {plan.harvestDate}</p>
                                            {plan.notes && (
                                                <NotesDisplay notes={plan.notes} />
                                            )}
                                        </div>
                                    </div>
                                    <div className="plan-actions">
                                        <button className="btn btn-primary">View</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CropPlans;
