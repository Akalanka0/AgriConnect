import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const Harvest = () => {
    const { showToast } = useOutletContext();
    const [harvestForm, setHarvestForm] = useState({
        harvestCrop: '',
        harvestLocation: '',
        harvestDate: '',
        harvestQuantity: '',
        harvestQuality: '',
        harvestNotes: ''
    });

    const handleHarvestSubmit = () => {
        if (!harvestForm.harvestCrop || !harvestForm.harvestLocation || !harvestForm.harvestDate || !harvestForm.harvestQuantity) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        showToast('Harvest recorded successfully!');
        setHarvestForm({
            harvestCrop: '',
            harvestLocation: '',
            harvestDate: '',
            harvestQuantity: '',
            harvestQuality: '',
            harvestNotes: ''
        });
    };

    return (
        <div className="page active" id="harvest" style={{ display: 'block' }}>
            <div className="page-title">
                <i className="fas fa-boxes"></i>
                <h2>Harvest Tracking</h2>
            </div>

            <div className="harvest-grid">
                {/* Record Harvest Card */}
                <div className="card">
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
                                <option value="rice">Rice</option>
                                <option value="vegetables">Vegetables</option>
                                <option value="corn">Corn</option>
                                <option value="tomatoes">Tomatoes</option>
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
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Harvest Records</div>
                        <div className="card-icon"><i className="fas fa-boxes"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="harvest-list">
                            {[
                                { crop: 'Rice Paddy', location: 'Field A', quantity: '500kg', quality: 'Excellent', date: '2025-10-05', details: 'Second harvest of the season. Good yield with high quality grains.' },
                                { crop: 'Vegetables', location: 'Field B', quantity: '120kg', quality: 'Good', date: '2025-09-28', details: 'Mixed vegetables including carrots, beans, and cabbage.' },
                                { crop: 'Corn', location: 'Field C', quantity: '300kg', quality: 'Average', date: '2025-09-15', details: 'Some pest damage observed. Lower yield than expected.' },
                                { crop: 'Tomatoes', location: 'Field D', quantity: '80kg', quality: 'Good', date: '2025-08-30', details: 'First tomato harvest of the season. Good color and size.' }
                            ].map((harvest, index) => (
                                <div className="harvest-item" key={index}>
                                    <div className="harvest-info">
                                        <div className="harvest-header">
                                            <h4>{harvest.crop}</h4>
                                        </div>
                                        <div className="harvest-details">
                                            <p><strong>Location:</strong> {harvest.location}</p>
                                            <p><strong>Quantity:</strong> {harvest.quantity}</p>
                                            <p><strong>Quality:</strong> <span className={`status-badge ${harvest.quality === 'Excellent' || harvest.quality === 'Good' ? 'status-active' : 'status-pending'}`}>{harvest.quality}</span></p>
                                            <p>{harvest.details}</p>
                                        </div>
                                    </div>
                                    <div className="harvest-side">
                                        <span className="harvest-date">{harvest.date}</span>
                                        <div className="harvest-actions">
                                            <button className="btn btn-primary">View</button>
                                            <button className="btn btn-secondary">Edit</button>
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

export default Harvest;
