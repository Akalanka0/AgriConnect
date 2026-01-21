import React from 'react';

const InstructorReports = () => {
    return (
        <>
            <div className="page-title">
                <i className="fas fa-file-alt"></i>
                <h2>Reports & Analytics</h2>
            </div>

            {/* Report Templates Card */}
            <div className="card" style={{ marginBottom: '30px' }}>
                <div className="table-header">
                    <div>Report Templates</div>
                </div>
                <div className="table-content" style={{ padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center' }}>
                            <i className="fas fa-chart-line" style={{ fontSize: '2em', color: 'var(--primary)', marginBottom: '10px' }}></i>
                            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Crop Yield Analysis</div>
                            <button className="btn btn-primary" style={{ width: '100%' }}>
                                <i className="fas fa-download"></i> Download
                            </button>
                        </div>
                        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center' }}>
                            <i className="fas fa-bug" style={{ fontSize: '2em', color: 'var(--warning)', marginBottom: '10px' }}></i>
                            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Pest Outbreak Report</div>
                            <button className="btn btn-primary" style={{ width: '100%' }}>
                                <i className="fas fa-download"></i> Download
                            </button>
                        </div>
                        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center' }}>
                            <i className="fas fa-users" style={{ fontSize: '2em', color: 'var(--secondary)', marginBottom: '10px' }}></i>
                            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Farmer Engagement</div>
                            <button className="btn btn-primary" style={{ width: '100%' }}>
                                <i className="fas fa-download"></i> Download
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InstructorReports;
