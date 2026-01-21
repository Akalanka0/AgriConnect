import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const CropPlans = () => {
    const { showToast } = useOutletContext();
    const [cropForm, setCropForm] = useState({
        cropName: '',
        fieldLocation: '',
        plantDate: '',
        harvestDate: '',
        cropNotes: ''
    });

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
            cropNotes: ''
        }));
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
                            <label>Location</label>
                            <input
                                type="text"
                                className="form-control"
                                value={cropForm.fieldLocation}
                                onChange={(e) => setCropForm({ ...cropForm, fieldLocation: e.target.value })}
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

                {/* Plans to Review Card */}
                <div className="card wider-card">
                    <div className="card-header">
                        <div className="card-title">Plans to Review</div>
                        <div className="card-icon"><i className="fas fa-clock"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="plans-review-list">
                            {[
                                { name: 'Tomatoes', status: 'Pending Review', location: 'Field D', plantingDate: '2025-10-05' },
                                { name: 'Rice Paddy', status: 'Pending Review', location: 'Field A', plantingDate: '2025-09-15' }
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
                                { name: 'Vegetables', status: 'Approved', location: 'Field B', plantingDate: '2025-08-20', harvestDate: '2025-10-20' },
                                { name: 'Corn', status: 'Approved', location: 'Field C', plantingDate: '2025-07-10', harvestDate: '2025-10-10' }
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
