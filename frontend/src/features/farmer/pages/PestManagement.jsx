import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import StatusBadge from '../../admin/components/StatusBadge';

const PestManagement = () => {
    const { showToast } = useOutletContext();
    const [pestForm, setPestForm] = useState({
        pestType: '',
        pestName: '',
        pestCrop: '',
        pestSeverity: '',
        pestNotes: '',
        instructorDivision: '',
        assignedInstructor: '',
        assignedInstructorId: ''
    });

    // Mock Data for Instructor Divisions (Similar to CropPlans)
    const availableInstructorDivisions = [
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

    const handleInstructorDivisionChange = (e) => {
        const selectedValue = e.target.value;
        const selectedDivision = availableInstructorDivisions.find(div => `${div.businessArea} - ${div.instructorDivision}` === selectedValue);
        
        setPestForm(prev => ({
            ...prev,
            instructorDivision: selectedValue,
            assignedInstructor: selectedDivision ? selectedDivision.instructorName : '',
            assignedInstructorId: selectedDivision ? selectedDivision.instructorId : ''
        }));
    };

    const handlePestSubmit = () => {
        if (!pestForm.pestType || !pestForm.pestName || !pestForm.pestCrop || !pestForm.pestSeverity || !pestForm.instructorDivision) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        showToast('Pest/disease report submitted successfully!');
        setPestForm({
            pestType: '',
            pestName: '',
            pestCrop: '',
            pestSeverity: '',
            pestNotes: '',
            instructorDivision: ''
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
                    <div className="card-content" style={{ maxHeight: '600px', overflowY: 'auto' }}>
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
                            <label>Instructor Division (Select from your registered lands)</label>
                            <select
                                className="form-control"
                                value={pestForm.instructorDivision}
                                onChange={handleInstructorDivisionChange}
                            >
                                <option value="">Select a field...</option>
                                {availableInstructorDivisions.map(div => (
                                    <option key={div.id} value={`${div.businessArea} - ${div.instructorDivision}`}>
                                        {div.businessArea} - {div.instructorDivision}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Assigned Instructor</label>
                            <input
                                type="text"
                                className="form-control"
                                value={pestForm.assignedInstructor}
                                readOnly
                                placeholder="Instructor will be assigned automatically"
                                style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Instructor ID</label>
                            <input
                                type="text"
                                className="form-control"
                                value={pestForm.assignedInstructorId}
                                readOnly
                                placeholder="Instructor ID will be assigned automatically"
                                style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                            />
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
                    <div className="card-content" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <div className="reports-list">
                            {[
                                { name: 'Brown Plant Hopper', type: 'Pest', crop: 'Rice', severity: 'High', date: '2025-10-05', status: 'Pending', details: 'Brown plant hoppers detected in rice field. Leaves turning yellow and drying.' },
                                { name: 'Powdery Mildew', type: 'Disease', crop: 'Tomatoes', severity: 'Medium', date: '2025-09-28', status: 'Pending', details: 'White powdery substance on tomato leaves. Affecting plant growth.' },
                                { name: 'Leaf Blight', type: 'Disease', crop: 'Corn', severity: 'Medium', date: '2025-09-20', status: 'Pending', details: 'Leaf blight affecting corn plants. Brown spots appearing on leaves.' },
                                { name: 'Aphids', type: 'Pest', crop: 'Vegetables', severity: 'Low', date: '2025-09-15', status: 'Pending', details: 'Aphids found on vegetable leaves. Small green insects clustering.' }
                            ].map((report, index) => (
                                <div className="report-item" key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '15px', borderBottom: '1px solid #eee' }}>
                                    <div className="report-info" style={{ flex: '1' }}>
                                        <div className="report-header">
                                            <h4>{report.name}</h4>
                                        </div>
                                        <div className="report-details">
                                            <p><strong>Type:</strong> {report.type}</p>
                                            <p><strong>Affected Crop:</strong> {report.crop}</p>
                                            <p><strong>Severity:</strong> <StatusBadge status={report.severity} type={report.severity === 'High' ? 'danger' : report.severity === 'Medium' ? 'warning' : 'success'} /></p>
                                            <p>{report.details}</p>
                                        </div>
                                    </div>
                                    <div className="report-side">
                                        <StatusBadge status={report.status} type={report.status === 'Pending' ? 'warning' : 'success'} />
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
                                <div className="reviewed-report-item" key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '15px', borderBottom: '1px solid #eee' }}>
                                    <div className="report-info" style={{ flex: '1' }}>
                                        <div className="report-header">
                                            <h4>{report.name}</h4>
                                            <span className="report-date">{report.date}</span>
                                        </div>
                                        <div className="report-details">
                                            <p><strong>Type:</strong> {report.type}</p>
                                            <p><strong>Affected Crop:</strong> {report.crop}</p>
                                            <p><strong>Severity:</strong> <StatusBadge status={report.severity} type={report.severity === 'High' ? 'danger' : report.severity === 'Medium' ? 'warning' : 'success'} /></p>
                                        </div>
                                    </div>
                                    <div className="reviewed-report-side">
                                        <StatusBadge status={report.status} type={report.status === 'Resolved' ? 'success' : 'warning'} />
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
