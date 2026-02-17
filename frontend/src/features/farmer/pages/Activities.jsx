import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const Activities = () => {
    const { showToast } = useOutletContext();
    const [activities, setActivities] = useState([]);
    const [availableLocations, setAvailableLocations] = useState([]);
    const [availableCrops, setAvailableCrops] = useState([]);
    const [loading, setLoading] = useState(true);
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
            const token = localStorage.getItem('token');
            
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
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleActivitySubmit = async () => {
        if (!activityForm.activityType || !activityForm.activityCrop || !activityForm.activityDate) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
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
                showToast('Activity logged successfully!');
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
            showToast('Failed to log activity', 'error');
        }
    };

    const handleDeleteActivity = async (id) => {
        if (!window.confirm('Are you sure you want to delete this activity?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/farmer/activities/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast('Activity deleted successfully');
                fetchData(); // Refresh list
            } else {
                showToast(data.error?.message || 'Failed to delete activity', 'error');
            }
        } catch (error) {
            console.error('Error deleting activity:', error);
            showToast('Failed to delete activity', 'error');
        }
    };

    return (
        <div className="page active" id="activity" style={{ display: 'block' }}>
            <div className="page-title">
                <i className="fas fa-tasks"></i>
                <h2>Activity Management</h2>
            </div>

            <div className="cards-grid">
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Log Activity</div>
                        <div className="card-icon"><i className="fas fa-tasks"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="form-group">
                            <label>Activity Type</label>
                            <select
                                className="form-control"
                                value={activityForm.activityType}
                                onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value })}
                            >
                                <option value="">Select type</option>
                                <option value="planting">Planting</option>
                                <option value="irrigation">Irrigation</option>
                                <option value="fertilizing">Fertilizing</option>
                                <option value="pest_control">Pest Control</option>
                                <option value="harvesting">Harvesting</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Crop</label>
                            <select
                                className="form-control"
                                value={activityForm.activityCrop}
                                onChange={(e) => setActivityForm({ ...activityForm, activityCrop: e.target.value })}
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
                            <label>Instructor Division</label>
                            <select
                                className="form-control"
                                value={activityForm.instructorDivision}
                                onChange={(e) => {
                                    const selectedValue = e.target.value;
                                    setActivityForm(prev => ({
                                        ...prev,
                                        instructorDivision: selectedValue,
                                    }));
                                }}
                            >
                                <option value="">Select division</option>
                                {availableLocations.map((loc, idx) => (
                                    <option key={idx} value={`${loc.zone} - ${loc.instructorDivision}`}>
                                        {loc.zone} - {loc.instructorDivision}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <input
                                type="text"
                                className="form-control"
                                value={activityForm.fieldLocation}
                                onChange={(e) => setActivityForm({ ...activityForm, fieldLocation: e.target.value })}
                                placeholder="Enter location (e.g., Field A, North Plot)"
                            />
                        </div>
                        <div className="form-group">
                            <label>Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={activityForm.activityDate}
                                onChange={(e) => setActivityForm({ ...activityForm, activityDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Notes</label>
                            <textarea
                                className="form-control"
                                value={activityForm.activityNotes}
                                onChange={(e) => setActivityForm({ ...activityForm, activityNotes: e.target.value })}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={handleActivitySubmit}>
                            <i className="fas fa-save"></i> Log Activity
                        </button>
                    </div>
                </div>

                {/* Recent Activities Card */}
                <div className="card wider-card">
                    <div className="card-header">
                        <div className="card-title">Recent Activities</div>
                        <div className="card-icon"><i className="fas fa-history"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="activities-list">
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>Loading activities...</div>
                            ) : activities.length > 0 ? (
                                activities.map((activity) => (
                                    <div className="activity-item" key={activity.id}>
                                        <div className="activity-info">
                                            <div className="activity-header">
                                                <h4>{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</h4>
                                            </div>
                                            <div className="activity-details">
                                                <p><strong>Crop:</strong> {activity.crop}</p>
                                                {activity.location && <p><strong>Location:</strong> {activity.location}</p>}
                                                {activity.instructor_division && <p><strong>Instructor Division:</strong> {activity.instructor_division}</p>}
                                                <p>{activity.notes}</p>
                                            </div>
                                        </div>
                                        <div className="activity-side">
                                            <span className="activity-date">{new Date(activity.date).toLocaleDateString()}</span>
                                            <div className="activity-actions">
                                                <button className="btn btn-secondary" onClick={() => handleDeleteActivity(activity.id)}>Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                                    No activities logged yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Activities;