import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import StatusBadge from '../../admin/components/StatusBadge';

// Reusing NotesDisplay component from CropPlans.jsx for consistency
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

const Harvest = () => {
    const { showToast } = useOutletContext();
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

    // Fetch data on mount
    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            
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
            showToast('Failed to load data', 'error');
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
            showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
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
                showToast('Harvest recorded successfully!');
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
            showToast('Failed to record harvest', 'error');
        }
    };

    const handleDeleteHarvest = async (id) => {
        if (!window.confirm('Are you sure you want to delete this harvest record?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/farmer/harvest-records/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast('Harvest record deleted successfully');
                fetchData(); // Refresh list
            } else {
                showToast(data.error?.message || 'Failed to delete harvest record', 'error');
            }
        } catch (error) {
            console.error('Error deleting harvest record:', error);
            showToast('Failed to delete harvest record', 'error');
        }
    };

    // Mock Data for Farmer Locations (Instructor Divisions) - Removed, using real data from profile

    return (
        <div className="page active" id="harvest" style={{ display: 'block' }}>
            <div className="page-title">
                <i className="fas fa-boxes"></i>
                <h2>Harvest Tracking</h2>
            </div>

            <div className="harvest-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {/* Record Harvest Card */}
                <div className="card" style={{ flex: '1', minWidth: '300px' }}>
                    <div className="card-header">
                        <div className="card-title">Record Harvest</div>
                        <div className="card-icon"><i className="fas fa-edit"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="form-group">
                            <label>Crop</label>
                            <select
                                className="form-control"
                                value={harvestForm.harvestCrop}
                                onChange={(e) => setHarvestForm({ ...harvestForm, harvestCrop: e.target.value })}
                            >
                                <option value="">Select crop</option>
                                {availableCrops.map((crop) => (
                                    <option key={crop.id} value={crop.name}>
                                        {crop.name}
                                    </option>
                                ))}
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter field location"
                                value={harvestForm.harvestLocation}
                                onChange={(e) => setHarvestForm({ ...harvestForm, harvestLocation: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Instructor Division</label>
                            <select
                                className="form-control"
                                value={harvestForm.instructorDivision}
                                onChange={(e) => setHarvestForm({ ...harvestForm, instructorDivision: e.target.value })}
                            >
                                <option value="">Select instructor division</option>
                                {availableLocations.map((loc, idx) => (
                                    <option key={idx} value={`${loc.zone} - ${loc.instructorDivision}`}>
                                        {loc.zone} - {loc.instructorDivision}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Harvest Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={harvestForm.harvestDate}
                                onChange={(e) => setHarvestForm({ ...harvestForm, harvestDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Quantity (kg)</label>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="Enter quantity in kg"
                                value={harvestForm.harvestQuantity}
                                onChange={(e) => setHarvestForm({ ...harvestForm, harvestQuantity: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Quality Rating</label>
                            <select
                                className="form-control"
                                value={harvestForm.harvestQuality}
                                onChange={(e) => setHarvestForm({ ...harvestForm, harvestQuality: e.target.value })}
                            >
                                <option value="">Select quality</option>
                                <option value="excellent">Excellent</option>
                                <option value="good">Good</option>
                                <option value="average">Average</option>
                                <option value="poor">Poor</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Notes</label>
                            <textarea
                                className="form-control"
                                placeholder="Add any notes about the harvest..."
                                rows="3"
                                value={harvestForm.harvestNotes}
                                onChange={(e) => setHarvestForm({ ...harvestForm, harvestNotes: e.target.value })}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={handleHarvestSubmit}>
                            <i className="fas fa-save"></i> Record Harvest
                        </button>
                    </div>
                </div>

                {/* Harvest Records Card */}
                <div className="card" style={{ flex: '1', minWidth: '300px' }}>
                    <div className="card-header">
                        <div className="card-title">Harvest Records</div>
                        <div className="card-icon"><i className="fas fa-boxes"></i></div>
                    </div>
                    <div className="card-content" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <div className="harvest-list">
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>Loading harvest records...</div>
                            ) : harvestRecords.length > 0 ? (
                                harvestRecords.slice(0, visibleHarvestCount).map((harvest) => (
                                    <div className="harvest-item" key={harvest.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '15px', borderBottom: '1px solid #eee' }}>
                                        <div className="harvest-info" style={{ flex: '1' }}>
                                            <div className="harvest-header">
                                                <h4>{harvest.crop}</h4>
                                            </div>
                                            <div className="harvest-details">
                                                <p><strong>Location:</strong> {harvest.location}</p>
                                                <p><strong>Instructor Division:</strong> {harvest.instructor_division || harvest.instructorDivision}</p>
                                                <p><strong>Quantity:</strong> {harvest.quantity}</p>
                                                <p><strong>Quality:</strong> <StatusBadge status={harvest.quality} type={harvest.quality?.toLowerCase() === 'excellent' || harvest.quality?.toLowerCase() === 'good' ? 'success' : 'warning'} /></p>
                                                {harvest.notes && <NotesDisplay notes={harvest.notes} />}
                                            </div>
                                        </div>
                                        <div className="harvest-side">
                                            <span className="harvest-date">{new Date(harvest.date).toLocaleDateString()}</span>
                                            <div className="harvest-actions">
                                                <button className="btn btn-secondary" onClick={() => handleDeleteHarvest(harvest.id)}>Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                                    No harvest records found
                                </div>
                            )}
                        </div>
                        {visibleHarvestCount < harvestRecords.length && (
                            <div style={{ textAlign: 'center', marginTop: '15px' }}>
                                <button className="btn btn-success" onClick={handleShowMoreHarvests}>
                                    Show More
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Harvest;
