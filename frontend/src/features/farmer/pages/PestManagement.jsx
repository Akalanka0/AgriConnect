import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const PestManagement = () => {
    const { showToast } = useOutletContext();
    const [pestForm, setPestForm] = useState({
        pestType: '',
        pestName: '',
        pestCrop: '',
        pestSeverity: '',
        pestNotes: ''
    });

    const handlePestSubmit = () => {
        if (!pestForm.pestType || !pestForm.pestName || !pestForm.pestCrop || !pestForm.pestSeverity) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        showToast('Pest/disease report submitted successfully!');
        setPestForm({
            pestType: '',
            pestName: '',
            pestCrop: '',
            pestSeverity: '',
            pestNotes: ''
        });
    };

    return (
        <div className="page active" id="pest" style={{ display: 'block' }}>
            <div className="page-title">
                <i className="fas fa-bug"></i>
                <h2>Pest Management</h2>
            </div>

            <div className="cards-grid">
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Report Pest/Disease</div>
                        <div className="card-icon"><i className="fas fa-bug"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="form-group">
                            <label>Issue Type</label>
                            <select
                                className="form-control"
                                value={pestForm.pestType}
                                onChange={(e) => setPestForm({ ...pestForm, pestType: e.target.value })}
                            >
                                <option value="">Select type</option>
                                <option value="pest">Pest</option>
                                <option value="disease">Disease</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Issue Name</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter pest or disease name"
                                value={pestForm.pestName}
                                onChange={(e) => setPestForm({ ...pestForm, pestName: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Affected Crop</label>
                            <select
                                className="form-control"
                                value={pestForm.pestCrop}
                                onChange={(e) => setPestForm({ ...pestForm, pestCrop: e.target.value })}
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
                            <label>Severity</label>
                            <select
                                className="form-control"
                                value={pestForm.pestSeverity}
                                onChange={(e) => setPestForm({ ...pestForm, pestSeverity: e.target.value })}
                            >
                                <option value="">Select severity</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                className="form-control"
                                placeholder="Describe the issue, symptoms, and affected areas..."
                                rows="4"
                                value={pestForm.pestNotes}
                                onChange={(e) => setPestForm({ ...pestForm, pestNotes: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Attach Image</label>
                            <div className="file-upload">
                                <input type="file" className="form-control" accept="image/*" />
                                <small className="file-hint">Upload image of the pest or disease (optional)</small>
                            </div>
                        </div>
                        <button className="btn btn-primary" onClick={handlePestSubmit}>
                            <i className="fas fa-paper-plane"></i> Submit Report
                        </button>
                    </div>
                </div>

                {/* Submitted Reports Card */}
                <div className="card wider-card">
                    <div className="card-header">
                        <div className="card-title">Submitted Reports</div>
                        <div className="card-icon"><i className="fas fa-clipboard-list"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="reports-list">
                            {[
                                { name: 'Brown Plant Hopper', type: 'Pest', crop: 'Rice', severity: 'High', date: '2025-10-05', status: 'Pending', details: 'Brown plant hoppers detected in rice field. Leaves turning yellow and drying.' },
                                { name: 'Powdery Mildew', type: 'Disease', crop: 'Tomatoes', severity: 'Medium', date: '2025-09-28', status: 'Pending', details: 'White powdery substance on tomato leaves. Affecting plant growth.' },
                                { name: 'Leaf Blight', type: 'Disease', crop: 'Corn', severity: 'Medium', date: '2025-09-20', status: 'Pending', details: 'Leaf blight affecting corn plants. Brown spots appearing on leaves.' },
                                { name: 'Aphids', type: 'Pest', crop: 'Vegetables', severity: 'Low', date: '2025-09-15', status: 'Pending', details: 'Aphids found on vegetable leaves. Small green insects clustering.' }
                            ].map((report, index) => (
                                <div className="report-item" key={index}>
                                    <div className="report-info">
                                        <div className="report-header">
                                            <h4>{report.name}</h4>
                                        </div>
                                        <div className="report-details">
                                            <p><strong>Type:</strong> {report.type}</p>
                                            <p><strong>Affected Crop:</strong> {report.crop}</p>
                                            <p><strong>Severity:</strong> <span className={`status-badge ${report.severity === 'High' ? 'status-alert' : 'status-pending'}`}>{report.severity}</span></p>
                                            <p>{report.details}</p>
                                        </div>
                                    </div>
                                    <div className="report-side">
                                        <span className="status-badge status-pending">{report.status}</span>
                                        <div className="report-bottom">
                                            <span className="report-date">{report.date}</span>
                                            <div className="report-actions">
                                                <button className="btn btn-primary">View</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Reviewed Reports Card */}
                <div className="card full-width-card">
                    <div className="card-header">
                        <div className="card-title">Reviewed Reports</div>
                        <div className="card-icon"><i className="fas fa-check-circle"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="reviewed-reports-grid">
                            {[
                                { name: 'Brown Plant Hopper', type: 'Pest', crop: 'Rice', severity: 'High', date: '2025-10-10', status: 'Resolved' },
                                { name: 'Leaf Blight', type: 'Disease', crop: 'Corn', severity: 'Medium', date: '2025-10-08', status: 'Resolved' },
                                { name: 'Powdery Mildew', type: 'Disease', crop: 'Tomatoes', severity: 'Medium', date: '2025-10-05', status: 'Resolved' }
                            ].map((report, index) => (
                                <div className="reviewed-report-item" key={index}>
                                    <div className="report-info">
                                        <div className="report-header">
                                            <h4>{report.name}</h4>
                                            <span className="report-date">{report.date}</span>
                                        </div>
                                        <div className="report-details">
                                            <p><strong>Type:</strong> {report.type}</p>
                                            <p><strong>Affected Crop:</strong> {report.crop}</p>
                                            <p><strong>Severity:</strong> <span className={`status-badge ${report.severity === 'High' ? 'status-alert' : 'status-pending'}`}>{report.severity}</span></p>
                                        </div>
                                    </div>
                                    <div className="reviewed-report-side">
                                        <span className="status-badge status-resolved">{report.status}</span>
                                        <button className="btn btn-primary">View Details</button>
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

export default PestManagement;
