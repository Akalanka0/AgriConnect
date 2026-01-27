import React, { useState } from 'react';
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

    const initialHarvestRecords = [
        { crop: 'Rice Paddy', location: 'Field A', instructorDivision: 'Rajanganaya - Yaya 4', quantity: '500kg', quality: 'Excellent', date: '2025-10-05', details: 'Second harvest of the season. Good yield with high quality grains.', notes: 'Harvested early in the morning to avoid heat stress. Grains sent for immediate processing.' },
        { crop: 'Vegetables', location: 'Field B', instructorDivision: 'Vilachchiya - Track 4', quantity: '120kg', quality: 'Good', date: '2025-09-28', details: 'Mixed vegetables including carrots, beans, and cabbage.', notes: 'Sold directly to local market. Received positive feedback on freshness.' },
        { crop: 'Corn', location: 'Field C', instructorDivision: 'Rajanganaya - Yaya 4', quantity: '300kg', quality: 'Average', date: '2025-09-15', details: 'Some pest damage observed. Lower yield than expected.', notes: 'Pest control measures were applied too late. Need to monitor more closely next season.' },
        { crop: 'Tomatoes', location: 'Field D', instructorDivision: 'Vilachchiya - Track 4', quantity: '80kg', quality: 'Good', date: '2025-08-30', details: 'First tomato harvest of the season. Good color and size.', notes: 'Harvested ripe tomatoes. Some cracking observed due to inconsistent watering.' },
        { crop: 'Potatoes', location: 'Field E', instructorDivision: 'Rajanganaya - Yaya 4', quantity: '250kg', quality: 'Excellent', date: '2025-08-20', details: 'Early potato harvest. Very good quality and size.', notes: 'Used organic fertilizers. No pest issues observed.' },
        { crop: 'Beans', location: 'Field F', instructorDivision: 'Vilachchiya - Track 4', quantity: '70kg', quality: 'Good', date: '2025-08-10', details: 'Bush beans harvest. Consistent yield.', notes: 'Regular watering maintained. Good market demand.' }
    ];

    const [harvestRecords, setHarvestRecords] = useState(initialHarvestRecords);
    const [visibleHarvestCount, setVisibleHarvestCount] = useState(3); // Initially show 3 records
    const recordsToShowIncrement = 3; // Number of records to show each time "Show More" is clicked

    const handleShowMoreHarvests = () => {
        setVisibleHarvestCount(prevCount => prevCount + recordsToShowIncrement);
    };

    const handleHarvestSubmit = () => {
        if (!harvestForm.harvestCrop || !harvestForm.harvestLocation || !harvestForm.harvestDate || !harvestForm.harvestQuantity) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

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
    };

    // Mock Data for Farmer Locations (Instructor Divisions)
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
                            <label>Instructor Division</label>
                            <select
                                className="form-control"
                                value={harvestForm.instructorDivision}
                                onChange={(e) => setHarvestForm({ ...harvestForm, instructorDivision: e.target.value })}
                            >
                                <option value="">Select instructor division</option>
                                {availableLocations.map(loc => (
                                    <option key={loc.id} value={`${loc.businessArea} - ${loc.instructorDivision}`}>
                                        {loc.businessArea} - {loc.instructorDivision}
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
                            {harvestRecords.slice(0, visibleHarvestCount).map((harvest, index) => (
                                <div className="harvest-item" key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '15px', borderBottom: '1px solid #eee' }}>
                                    <div className="harvest-info" style={{ flex: '1' }}>
                                        <div className="harvest-header">
                                            <h4>{harvest.crop}</h4>
                                        </div>
                                        <div className="harvest-details">
                                            <p><strong>Location:</strong> {harvest.location}</p>
                                            <p><strong>Instructor Division:</strong> {harvest.instructorDivision}</p>
                                            <p><strong>Quantity:</strong> {harvest.quantity}</p>
                                            <p><strong>Quality:</strong> <StatusBadge status={harvest.quality} type={harvest.quality === 'Excellent' || harvest.quality === 'Good' ? 'success' : 'warning'} /></p>
                                            {harvest.details && <p>{harvest.details}</p>}
                                            {harvest.notes && <NotesDisplay notes={harvest.notes} />}
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
