import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import StatusBadge from '../../admin/components/StatusBadge';
import { getDownloadUrl, getFriendlyFileName } from '../../../utils/fileUtils';

const PestManagement = () => {
    const { showToast } = useOutletContext();
    const [pestForm, setPestForm] = useState({
        pestType: '',
        pestName: '',
        pestCrop: '',
        customCropName: '',
        pestSeverity: '',
        pestNotes: '',
        instructorDivision: '',
        assignedInstructor: '',
        assignedInstructorId: ''
    });

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState([]);
    const [availableCrops, setAvailableCrops] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);

    // Fetch farmer profile, reports, and available crops
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };
                
                // Fetch Profile, Reports, and Crops in parallel
                const [profileRes, reportsRes, cropsRes] = await Promise.all([
                    fetch('/api/farmer/profile', { headers }),
                    fetch('/api/farmer/pest-reports', { headers }),
                    fetch('/api/instructor/crop-calendars', { headers })
                ]);

                const [profileData, reportsData, cropsData] = await Promise.all([
                    profileRes.json(),
                    reportsRes.json(),
                    cropsRes.json()
                ]);

                if (profileData.success) {
                    setLocations(profileData.data.locations || []);
                }

                if (reportsData.success) {
                    setReports(reportsData.data);
                }

                if (cropsData.success) {
                    // Extract names and add 'Custom'
                    const dbCropNames = cropsData.data.map(c => c.name);
                    setAvailableCrops([...dbCropNames, 'Custom']);
                } else {
                    // Fallback if API fails
                    setAvailableCrops(['Paddy', 'Chilli', 'Finger Millet', 'Maize', 'Soya Beans', 'Custom']);
                }
            } catch (error) {
                console.error('Error fetching pest management data:', error);
                showToast('Failed to load data', 'error');
                // Fallback on error
                setAvailableCrops(['Paddy', 'Chilli', 'Finger Millet', 'Maize', 'Soya Beans', 'Custom']);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showToast]);

    const handleInstructorDivisionChange = (e) => {
        const selectedValue = e.target.value;
        const selectedLoc = locations.find(loc => `${loc.zone} - ${loc.instructorDivision}` === selectedValue);

        setPestForm(prev => ({
            ...prev,
            instructorDivision: selectedValue,
            assignedInstructor: selectedLoc ? selectedLoc.assignedInstructorName : '',
            assignedInstructorId: selectedLoc ? (selectedLoc.assignedInstructorDbId || selectedLoc.assignedInstructorId) : ''
        }));
    };

    const handlePestSubmit = async () => {
        // Validation
        const isCustom = pestForm.pestCrop === 'Custom';
        const finalCropName = isCustom ? pestForm.customCropName : pestForm.pestCrop;

        if (!pestForm.pestType || !pestForm.pestName || !finalCropName || !pestForm.pestSeverity || !pestForm.instructorDivision) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('issue_type', pestForm.pestType);
            formData.append('name', pestForm.pestName);
            
            // Use custom crop name if 'Custom' is selected
            const finalCropName = pestForm.pestCrop === 'Custom' ? pestForm.customCropName : pestForm.pestCrop;
            formData.append('crop', finalCropName);
            
            formData.append('severity', pestForm.pestSeverity);
            formData.append('description', pestForm.pestNotes);
            formData.append('instructor_division', pestForm.instructorDivision);
            formData.append('instructor_id', pestForm.assignedInstructorId);

            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput && fileInput.files[0]) {
                formData.append('attachment', fileInput.files[0]);
            }

            const res = await fetch('/api/farmer/pest-reports', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            console.log('Response status:', res.status);
            const data = await res.json();
            console.log('Response data:', data);
            if (res.ok && data.success) {
                showToast('Pest/disease report submitted successfully!');
                setPestForm({
                    pestType: '',
                    pestName: '',
                    pestCrop: '',
                    customCropName: '',
                    pestSeverity: '',
                    pestNotes: '',
                    instructorDivision: '',
                    assignedInstructor: '',
                    assignedInstructorId: ''
                });
                // Refresh reports
                const reportsRes = await fetch('/api/farmer/pest-reports', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const reportsData = await reportsRes.json();
                if (reportsRes.ok && reportsData.success) {
                    setReports(reportsData.data);
                }
            } else {
                showToast(data.error?.message || 'Failed to submit report', 'error');
            }
        } catch (error) {
            console.error('Error submitting pest report:', error);
            showToast('Failed to submit report', 'error');
        }
    };

    // Filter reports
    const pendingReports = reports.filter(r => r.status.toLowerCase() === 'pending' || r.status.toLowerCase() === 'in_progress');
    const resolvedReports = reports.filter(r => r.status.toLowerCase() === 'resolved');

    const renderReportDetails = (report) => (
        <div className="instructor-detail-view" style={{ padding: '20px' }}>
            <div className="instructor-detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>{report.name} Report Details</h3>
                <button className="btn btn-secondary" onClick={() => setSelectedReport(null)}>Close</button>
            </div>

            <div className="instructor-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="instructor-detail-group">
                    <p><strong>Reported Date:</strong> {new Date(report.created_at).toLocaleDateString()}</p>
                    <p><strong>Issue Type:</strong> <span style={{ textTransform: 'capitalize' }}>{report.issue_type}</span></p>
                    <p><strong>Affected Crop:</strong> <span style={{ textTransform: 'capitalize' }}>{report.crop}</span></p>
                </div>
                <div className="instructor-detail-group">
                    <p><strong>Severity:</strong> <StatusBadge status={report.severity} type={report.severity.toLowerCase() === 'high' ? 'danger' : report.severity.toLowerCase() === 'medium' ? 'warning' : 'success'} /></p>
                    <p><strong>Status:</strong> <StatusBadge status={report.status} type={report.status.toLowerCase() === 'pending' ? 'warning' : report.status.toLowerCase() === 'in_progress' ? 'info' : 'success'} /></p>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <strong>Your Description:</strong>
                <div className="instructor-description-box" style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', marginTop: '8px', border: '1px solid #eee' }}>
                    {report.description}
                </div>
                {report.farmerFiles && report.farmerFiles.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                        <strong>Your Attachments:</strong>
                        <div className="instructor-attachment-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
                            {report.farmerFiles.map((file, idx) => (
                                <a
                                    key={idx}
                                    href={getDownloadUrl(file)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="instructor-attachment-item"
                                    style={{ textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' }}
                                    download
                                >
                                    <i className="fas fa-image"></i>
                                    <span>{getFriendlyFileName(file)}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {(report.status.toLowerCase() === 'resolved' || (report.status.toLowerCase() === 'in_progress' && report.resolution)) && (
                <div className="instructor-action-section" style={{ borderTop: '2px solid #e8f5e9', paddingTop: '20px', marginTop: '20px' }}>
                    <h4 style={{ color: '#2e7d32', marginTop: 0 }}>
                        {report.status.toLowerCase() === 'resolved' ? "Instructor's Final Resolution" : "Instructor's Intermediate Advice"}
                    </h4>
                    <div className="instructor-history-box" style={{ padding: '15px', backgroundColor: '#f1f8e9', borderRadius: '8px', marginTop: '8px', border: '1px solid #c8e6c9' }}>
                        {report.resolution || 'No notes provided yet.'}
                    </div>
                    {report.instructorFiles && report.instructorFiles.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                            <strong>Shared Documents:</strong>
                            <div className="instructor-attachment-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
                                {report.instructorFiles.map((file, idx) => (
                                    <a
                                        key={idx}
                                        href={getDownloadUrl(file)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="instructor-attachment-item"
                                        style={{ color: '#2e7d32', borderColor: '#c8e6c9', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #c8e6c9', borderRadius: '4px', backgroundColor: '#fff' }}
                                        download
                                    >
                                        <i className="fas fa-file-alt"></i>
                                        <span>{getFriendlyFileName(file)}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="page active" id="pest" style={{ display: 'block' }}>
            <div className="page-title">
                <i className="fas fa-bug"></i>
                <h2>Pest Management</h2>
            </div>

            <div className="cards-grid">
                {/* Detail View */}
                {selectedReport && (
                    <div className="card full-width-card" style={{ border: '2px solid var(--primary)', marginBottom: '30px' }}>
                        {renderReportDetails(selectedReport)}
                    </div>
                )}

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
                                <option value="">Select a crop...</option>
                                {availableCrops.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        {pestForm.pestCrop === 'Custom' && (
                            <div className="form-group">
                                <label>Custom Crop Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter custom crop name"
                                    value={pestForm.customCropName}
                                    onChange={(e) => setPestForm({ ...pestForm, customCropName: e.target.value })}
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Instructor Division (Select from your registered lands)</label>
                            <select
                                className="form-control"
                                value={pestForm.instructorDivision}
                                onChange={handleInstructorDivisionChange}
                            >
                                <option value="">Select a field...</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={`${loc.zone} - ${loc.instructorDivision}`}>
                                        {loc.zone} - {loc.instructorDivision}
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
                            {pendingReports.length > 0 ? pendingReports.map((report, index) => (
                                <div className="report-item" key={report.id || index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '15px', borderBottom: '1px solid #eee' }}>
                                    <div className="report-info" style={{ flex: '1' }}>
                                        <div className="report-header">
                                            <h4>{report.name}</h4>
                                        </div>
                                        <div className="report-details">
                                            <p><strong>Type:</strong> {report.issue_type}</p>
                                            <p><strong>Affected Crop:</strong> {report.crop}</p>
                                            <p><strong>Severity:</strong> <StatusBadge status={report.severity} type={report.severity === 'High' ? 'danger' : report.severity === 'Medium' ? 'warning' : 'success'} /></p>
                                            <p>{report.description}</p>
                                        </div>
                                    </div>
                                    <div className="report-side">
                                        <StatusBadge status={report.status} type={report.status === 'pending' ? 'warning' : 'success'} />
                                        <div className="report-bottom">
                                            <span className="report-date">{new Date(report.created_at).toLocaleDateString()}</span>
                                            <div className="report-actions">
                                                <button className="btn btn-primary" onClick={() => setSelectedReport(report)}>View</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                                    No pending reports
                                </div>
                            )}
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
                            {resolvedReports.length > 0 ? resolvedReports.map((report, index) => (
                                <div className="reviewed-report-item" key={report.id || index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '15px', borderBottom: '1px solid #eee' }}>
                                    <div className="report-info" style={{ flex: '1' }}>
                                        <div className="report-header">
                                            <h4>{report.name}</h4>
                                            <span className="report-date">{new Date(report.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="report-details">
                                            <p><strong>Type:</strong> {report.issue_type}</p>
                                            <p><strong>Affected Crop:</strong> {report.crop}</p>
                                            <p><strong>Severity:</strong> <StatusBadge status={report.severity} type={report.severity === 'High' ? 'danger' : report.severity === 'Medium' ? 'warning' : 'success'} /></p>
                                        </div>
                                    </div>
                                    <div className="reviewed-report-side">
                                        <StatusBadge status={report.status} type={report.status === 'resolved' ? 'success' : 'warning'} />
                                        <button className="btn btn-primary" onClick={() => setSelectedReport(report)}>View Details</button>
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                                    No reviewed reports
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PestManagement;
