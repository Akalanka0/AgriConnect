import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const Activities = () => {
    const { showToast } = useOutletContext();
    const [activityForm, setActivityForm] = useState({
        activityType: '',
        activityCrop: '',
        activityDate: '',
        activityNotes: ''
    });

    useEffect(() => {
        setActivityForm(prev => ({
            ...prev,
            activityDate: new Date().toISOString().split('T')[0]
        }));
    }, []);

    const handleActivitySubmit = () => {
        if (!activityForm.activityType || !activityForm.activityCrop || !activityForm.activityDate) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        showToast('Activity logged successfully!');
        setActivityForm({
            activityType: '',
            activityCrop: '',
            activityDate: new Date().toISOString().split('T')[0],
            activityNotes: ''
        });
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
                                <option value="rice">Rice</option>
                                <option value="vegetables">Vegetables</option>
                                <option value="corn">Corn</option>
                                <option value="other">Other</option>
                            </select>
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
                            {[
                                { type: 'Irrigation', crop: 'Rice Paddy', location: 'Field A', date: '2025-10-05', details: 'Completed irrigation for rice paddy field. Applied 2 inches of water.' },
                                { type: 'Pest Control', crop: 'Vegetables', location: 'Field B', date: '2025-10-03', details: 'Applied organic pesticide for aphid control in vegetable garden.' },
                                { type: 'Fertilizing', crop: 'Corn', location: 'Field C', date: '2025-10-01', details: 'Applied NPK fertilizer to corn field. Used 50kg per acre.' },
                                { type: 'Planting', crop: 'Tomatoes', location: 'Field D', date: '2025-09-28', details: 'Planted tomato seedlings. Spacing: 2 feet between plants.' }
                            ].map((activity, index) => (
                                <div className="activity-item" key={index}>
                                    <div className="activity-info">
                                        <div className="activity-header">
                                            <h4>{activity.type}</h4>
                                        </div>
                                        <div className="activity-details">
                                            <p><strong>Crop:</strong> {activity.crop}</p>
                                            <p><strong>Location:</strong> {activity.location}</p>
                                            <p>{activity.details}</p>
                                        </div>
                                    </div>
                                    <div className="activity-side">
                                        <span className="activity-date">{activity.date}</span>
                                        <div className="activity-actions">
                                            <button className="btn btn-primary">View</button>
                                            <button className="btn btn-secondary">Delete</button>
                                        </div>
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

export default Activities;
