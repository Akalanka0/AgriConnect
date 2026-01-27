import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import StatusBadge from '../../admin/components/StatusBadge';

const PestReports = () => {
    const { showToast } = useOutletContext();
    const [selectedReport, setSelectedReport] = useState(null);
    const [responseMessage, setResponseMessage] = useState('');

    // Mock Data for Instructor's view (Perfectly aligned with Farmer's PestManagement fields)
    const activeReports = [
        { 
            id: 1,
            farmerName: 'Sunil Perera',
            farmerId: 'FARM-2026-0045',
            location: 'Rajanganaya - Yaya 4',
            reportedDate: '2025-10-15',
            pestName: 'Brown Plant Hopper',
            pestType: 'Pest',
            pestCrop: 'Rice',
            pestSeverity: 'High',
            pestNotes: 'Brown plant hoppers detected in rice field. Leaves turning yellow and drying. Requesting urgent advice on pesticides.',
            status: 'Pending',
            farmerFiles: ['affected_leaf_1.jpg', 'field_photo.jpg']
        },
        { 
            id: 2,
            farmerName: 'Kamala Fernando',
            farmerId: 'FARM-2026-0082',
            location: 'Vilachchiya - Track 4',
            reportedDate: '2025-10-14',
            pestName: 'Powdery Mildew',
            pestType: 'Disease',
            pestCrop: 'Tomatoes',
            pestSeverity: 'Medium',
            pestNotes: 'White powdery substance on tomato leaves. Affecting plant growth. Need guidance on organic treatment.',
            status: 'Pending',
            farmerFiles: ['tomato_leaf_detail.jpg']
        }
    ];

    const resolvedReports = [
        { 
            id: 3,
            farmerName: 'Nimal Rajapaksa',
            farmerId: 'FARM-2026-0012',
            location: 'Rajanganaya - Yaya 4',
            reportedDate: '2025-10-10',
            pestName: 'Leaf Blight',
            pestType: 'Disease',
            pestCrop: 'Corn',
            pestSeverity: 'Medium',
            pestNotes: 'Leaf blight affecting corn plants. Brown spots appearing on leaves.',
            status: 'Resolved',
            resolution: 'Advised on fungicide application and improved drainage. Farmer confirmed recovery.',
            farmerFiles: ['corn_symptoms.jpg'],
            attachments: ['Fungicide_Guide.pdf', 'Drainage_Plan.jpg']
        }
    ];

    const handleSendResponse = () => {
        if (!responseMessage.trim()) {
            showToast('Please enter a response message', 'error');
            return;
        }
        showToast('Response sent to farmer successfully!');
        setResponseMessage('');
        setSelectedReport(null);
    };

    const renderReportDetails = (report) => (
        <div className="report-detail-view" style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>{report.pestName} Report Details</h3>
                <button className="btn btn-secondary" onClick={() => setSelectedReport(null)}>Close</button>
            </div>
            
            <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="detail-group">
                    <p style={{ marginBottom: '8px' }}><strong>Farmer:</strong> {report.farmerName}</p>
                    <p style={{ marginBottom: '8px' }}><strong>ID:</strong> {report.farmerId}</p>
                    <p style={{ marginBottom: '8px' }}><strong>Location:</strong> {report.location}</p>
                    <p style={{ marginBottom: '8px' }}><strong>Reported Date:</strong> {report.reportedDate}</p>
                </div>
                <div className="detail-group">
                    <p style={{ marginBottom: '8px' }}><strong>Issue Type:</strong> <span style={{ textTransform: 'capitalize' }}>{report.pestType}</span></p>
                    <p style={{ marginBottom: '8px' }}><strong>Affected Crop:</strong> <span style={{ textTransform: 'capitalize' }}>{report.pestCrop}</span></p>
                    <p style={{ marginBottom: '8px' }}><strong>Severity:</strong> <StatusBadge status={report.pestSeverity} type={report.pestSeverity === 'High' ? 'danger' : report.pestSeverity === 'Medium' ? 'warning' : 'success'} /></p>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <strong>Farmer's Description:</strong>
                <p style={{ 
                    backgroundColor: '#fff', 
                    padding: '15px', 
                    borderRadius: '6px', 
                    borderLeft: '4px solid var(--primary)', 
                    marginTop: '8px',
                    lineHeight: '1.5',
                    color: '#444'
                }}>
                    {report.pestNotes}
                </p>
                {report.farmerFiles && report.farmerFiles.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                        <strong>Farmer's Attachments:</strong>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                            {report.farmerFiles.map((file, idx) => (
                                <div key={idx} style={{ 
                                    padding: '8px 12px', 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #ddd', 
                                    borderRadius: '4px',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--primary)',
                                    cursor: 'pointer'
                                }}>
                                    <i className="fas fa-image"></i>
                                    {file}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {report.status === 'Pending' ? (
                <div className="response-section" style={{ borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '10px' }}><strong>Your Advice / Action Plan:</strong></label>
                    <textarea 
                        className="form-control" 
                        rows="5" 
                        placeholder="Provide detailed instructions for the farmer (e.g., specific pesticides, biological controls, or cultural practices)..."
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                    ></textarea>
                    
                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label><strong>Attach Reference / Supporting Documents:</strong></label>
                        <div className="file-upload" style={{ marginTop: '8px' }}>
                            <input type="file" className="form-control" accept="image/*,.pdf,.doc,.docx" />
                            <small className="file-hint" style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                                Upload images or documents (PDF, Word) to help the farmer (optional)
                            </small>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                        <button className="btn btn-primary" onClick={handleSendResponse}>
                            <i className="fas fa-paper-plane"></i> Send Advice to Farmer
                        </button>
                        <button className="btn btn-success" onClick={() => showToast('Report marked as resolved')}>
                            <i className="fas fa-check-circle"></i> Mark as Resolved
                        </button>
                    </div>
                </div>
            ) : (
                <div className="resolution-section" style={{ borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                    <strong>Your Resolution:</strong>
                    <p style={{ 
                        backgroundColor: '#e8f5e9', 
                        padding: '15px', 
                        borderRadius: '6px', 
                        marginTop: '8px',
                        color: '#2e7d32',
                        lineHeight: '1.5'
                    }}>
                        {report.resolution}
                    </p>
                    {report.attachments && report.attachments.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                            <strong>Shared Documents:</strong>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                {report.attachments.map((file, idx) => (
                                    <div key={idx} style={{ 
                                        padding: '8px 12px', 
                                        backgroundColor: '#fff', 
                                        border: '1px solid #c8e6c9', 
                                        borderRadius: '4px',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: '#2e7d32'
                                    }}>
                                        <i className="fas fa-file-alt"></i>
                                        {file}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="page active">
            <div className="page-title">
                <i className="fas fa-bug"></i>
                <h2>Pest & Disease Management</h2>
            </div>

            <div className="cards-grid">
                {/* New Reports List - The mirror of Farmer's 'Submitted Reports' */}
                <div className="card full-width-card">
                    <div className="card-header">
                        <div className="card-title">New Farmer Reports</div>
                        <div className="card-icon"><i className="fas fa-envelope-open-text"></i></div>
                    </div>
                    <div className="card-content" style={{ maxHeight: '550px', overflowY: 'auto' }}>
                        <div className="reports-list">
                            {activeReports.map((report) => (
                                <div className="report-item" key={report.id} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '18px', 
                                    borderBottom: '1px solid #eee',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }} onClick={() => setSelectedReport(report)}>
                                    <div className="report-info">
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>{report.pestName}</h4>
                                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                            <strong>{report.farmerName}</strong> ({report.farmerId})
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                                            {report.location}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
                                            Crop: <span style={{ textTransform: 'capitalize' }}>{report.pestCrop}</span> • {report.reportedDate}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <StatusBadge status={report.pestSeverity} type={report.pestSeverity === 'High' ? 'danger' : report.pestSeverity === 'Medium' ? 'warning' : 'success'} />
                                        <button className="btn btn-primary btn-sm">Review & Respond</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Report Detail View - The Communication Bridge */}
                {selectedReport && (
                    <div className="card full-width-card" style={{ border: '2px solid var(--primary)' }}>
                        {renderReportDetails(selectedReport)}
                    </div>
                )}

                {/* Resolved History - The mirror of Farmer's 'Reviewed Reports' */}
                <div className="card full-width-card">
                    <div className="card-header">
                        <div className="card-title">Resolved History</div>
                        <div className="card-icon"><i className="fas fa-check-double"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="reviewed-reports-grid">
                            {resolvedReports.map((report) => (
                                <div className="reviewed-report-item" key={report.id} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'flex-start', 
                                    padding: '20px', 
                                    borderBottom: '1px solid #eee' 
                                }}>
                                    <div className="report-info" style={{ flex: '1' }}>
                                        <div className="report-header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{report.pestName}</h4>
                                            <span className="report-date" style={{ color: '#888', fontSize: '0.85rem' }}>{report.reportedDate}</span>
                                        </div>
                                        <div className="report-details" style={{ fontSize: '0.9rem' }}>
                                            <p style={{ margin: '0 0 5px 0' }}><strong>Farmer:</strong> {report.farmerName} • {report.location}</p>
                                            <p style={{ margin: '0 0 5px 0' }}><strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{report.pestType}</span></p>
                                            <p style={{ margin: '0 0 5px 0' }}><strong>Affected Crop:</strong> <span style={{ textTransform: 'capitalize' }}>{report.pestCrop}</span></p>
                                            <p style={{ margin: '0' }}><strong>Severity:</strong> <StatusBadge status={report.pestSeverity} type={report.pestSeverity === 'High' ? 'danger' : 'warning'} /></p>
                                        </div>
                                    </div>
                                    <div className="reviewed-report-side" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '15px' }}>
                                        <StatusBadge status="Resolved" type="success" />
                                        <button className="btn btn-primary" onClick={() => setSelectedReport(report)}>
                                            View Full History
                                        </button>
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

export default PestReports;
