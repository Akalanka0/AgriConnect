import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import StatusBadge from '../../admin/components/StatusBadge';
import { getDownloadUrl, getFriendlyFileName } from '../../../utils/fileUtils';

const PestReports = () => {
    const { showToast } = useOutletContext();
    const [selectedReport, setSelectedReport] = useState(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch reports from backend
    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/instructor/pest-reports', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                setReports(data.data);
            } else {
                showToast(data.error?.message || 'Failed to load reports', 'error');
            }
        } catch (error) {
            console.error('Error fetching pest reports:', error);
            showToast('Failed to load reports', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    // Filter reports based on status
    const activeReports = reports.filter(r => r.status.toLowerCase() === 'pending' || r.status.toLowerCase() === 'in_progress');
    const resolvedReports = reports.filter(r => r.status.toLowerCase() === 'resolved');

    const handleUpdateStatus = async (newStatus, message = '') => {
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('status', newStatus);
            if (message) formData.append('resolution', message);

            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput && fileInput.files[0]) {
                formData.append('attachment', fileInput.files[0]);
            }

            const res = await fetch(`/api/instructor/pest-reports/${selectedReport.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                showToast(`Report updated to ${newStatus} successfully!`, 'success');
                setResponseMessage('');
                setSelectedReport(null);
                fetchReports(); // Refresh list
            } else {
                showToast(data.error?.message || 'Failed to update report', 'error');
            }
        } catch (error) {
            console.error('Error updating report:', error);
            showToast('Failed to update report', 'error');
        }
    };

    const renderReportDetails = (report) => (
        <div className="instructor-detail-view">
            <div className="instructor-detail-header">
                <h3>{report.pestName} Report Details</h3>
                <button className="btn btn-secondary" onClick={() => setSelectedReport(null)}>Close</button>
            </div>

            <div className="instructor-details-grid">
                <div className="instructor-detail-group">
                    <p><strong>Farmer:</strong> {report.farmerName}</p>
                    <p><strong>ID:</strong> {report.farmerId}</p>
                    <p><strong>Location:</strong> {report.location}</p>
                    <p><strong>Reported Date:</strong> {report.reportedDate}</p>
                </div>
                <div className="instructor-detail-group">
                    <p><strong>Issue Type:</strong> <span style={{ textTransform: 'capitalize' }}>{report.pestType}</span></p>
                    <p><strong>Affected Crop:</strong> <span style={{ textTransform: 'capitalize' }}>{report.pestCrop}</span></p>
                    <p><strong>Severity:</strong> <StatusBadge status={report.pestSeverity} type={report.pestSeverity === 'High' ? 'danger' : report.pestSeverity === 'Medium' ? 'warning' : 'success'} /></p>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <strong>Farmer's Description:</strong>
                <div className="instructor-description-box">
                    {report.pestNotes}
                </div>
                {report.farmerFiles && report.farmerFiles.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                        <strong>Farmer's Attachments:</strong>
                        <div className="instructor-attachment-list">
                            {report.farmerFiles.map((file, idx) => (
                                <a
                                    key={idx}
                                    href={getDownloadUrl(file)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="instructor-attachment-item"
                                    style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}
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

            {report.status.toLowerCase() === 'pending' || report.status.toLowerCase() === 'in_progress' ? (
                <div className="instructor-action-section">
                    <label>Your Advice / Action Plan:</label>
                    <textarea
                        className="form-control"
                        rows="5"
                        placeholder="Provide detailed instructions for the farmer (e.g., specific pesticides, biological controls, or cultural practices)..."
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                    ></textarea>

                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label>Attach Reference / Supporting Documents:</label>
                        <div className="file-upload" style={{ marginTop: '8px' }}>
                            <input type="file" className="form-control" accept="image/*,.pdf,.doc,.docx" />
                            <small className="file-hint" style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                                Upload images or documents (PDF, Word) to help the farmer (optional)
                            </small>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                        <button 
                            className="btn btn-primary" 
                            onClick={() => {
                                if (!responseMessage.trim()) {
                                    showToast('Please enter a response message', 'error');
                                    return;
                                }
                                handleUpdateStatus('resolved', responseMessage);
                            }}
                        >
                            <i className="fas fa-paper-plane"></i> Send Advice & Resolve
                        </button>
                        {report.status.toLowerCase() === 'pending' && (
                            <button 
                                className="btn btn-warning" 
                                onClick={() => handleUpdateStatus('in_progress', responseMessage)}
                                style={{ color: '#000' }}
                            >
                                <i className="fas fa-spinner fa-spin"></i> Mark In Progress
                            </button>
                        )}
                        {report.status.toLowerCase() === 'in_progress' && (
                            <button 
                                className="btn btn-info" 
                                onClick={() => handleUpdateStatus('in_progress', responseMessage)}
                                style={{ backgroundColor: '#0dcaf0', color: '#fff', border: 'none' }}
                            >
                                <i className="fas fa-save"></i> Save Progress Advice
                            </button>
                        )}
                        <button 
                            className="btn btn-success" 
                            onClick={() => handleUpdateStatus('resolved', responseMessage)}
                        >
                            <i className="fas fa-check-circle"></i> Mark as Resolved
                        </button>
                    </div>
                </div>
            ) : (
                <div className="instructor-action-section">
                    <strong>Your Resolution:</strong>
                    <div className="instructor-history-box">
                        {report.resolution || 'No resolution notes provided.'}
                    </div>
                    {report.attachments && report.attachments.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                            <strong>Shared Documents:</strong>
                            <div className="instructor-attachment-list">
                                {report.attachments.map((file, idx) => (
                                    <a
                                        key={idx}
                                        href={getDownloadUrl(file)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="instructor-attachment-item"
                                        style={{ color: '#2e7d32', borderColor: '#c8e6c9', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
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

    if (loading) {
        return <div className="loading-container">Loading Reports...</div>;
    }

    return (
        <>
            <div className="cards-grid">
                {/* New Reports List - The mirror of Farmer's 'Submitted Reports' */}
                <div className="card full-width-card">
                    <div className="card-header">
                        <div className="card-title">New Farmer Reports</div>
                        <div className="card-icon"><i className="fas fa-envelope-open-text"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="instructor-list-container">
                            {activeReports.map((report) => (
                                <div className="instructor-list-item" key={report.id} onClick={() => setSelectedReport(report)}>
                                    <div className="instructor-list-info">
                                        <h4>{report.pestName}</h4>
                                        <div className="instructor-list-details">
                                            <p><strong>Farmer:</strong> {report.farmerName} ({report.farmerId})</p>
                                            <p><strong>Location:</strong> {report.location}</p>
                                            <p><strong>Crop:</strong> {report.pestCrop} • <strong>Reported:</strong> {report.reportedDate}</p>
                                        </div>
                                    </div>
                                    <div className="instructor-list-side">
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
                        <div className="instructor-list-container">
                            {resolvedReports.map((report) => (
                                <div className="instructor-list-item" key={report.id} onClick={() => setSelectedReport(report)}>
                                    <div className="instructor-list-info">
                                        <h4>{report.pestName}</h4>
                                        <div className="instructor-list-details">
                                            <p><strong>Farmer:</strong> {report.farmerName} ({report.farmerId}) • {report.location}</p>
                                            <p><strong>Crop:</strong> {report.pestCrop} • <strong>Reported:</strong> {report.reportedDate}</p>
                                        </div>
                                    </div>
                                    <div className="instructor-list-side">
                                        <StatusBadge status="Resolved" type="success" />
                                        <button className="btn btn-primary btn-sm">View History</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PestReports;
