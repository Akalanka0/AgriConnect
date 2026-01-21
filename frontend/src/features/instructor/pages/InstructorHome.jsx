import React from 'react';
import { useOutletContext } from 'react-router-dom';

const InstructorHome = () => {
    const { openModal } = useOutletContext();

    // Mock data for display
    const pendingTasks = { crop: 52, pest: 3 };
    const history = [
        { action: 'Crop Plan Approved', date: '2025-10-18' },
        { action: 'Pest Issue Resolved', date: '2025-10-15' },
        { action: 'Crop Plan Approved', date: '2025-10-12' },
        { action: 'Pest Issue Resolved', date: '2025-10-08' },
        { action: 'Report Generated', date: '2025-10-05' }
    ];

    return (
        <>
            <div className="page-title">
                <i className="fas fa-home"></i>
                <h2>Home</h2>
            </div>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <div className="stat-value">480</div>
                    <div className="stat-label">Assigned Farmers</div>
                    <div className="stat-trend trend-up"></div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Pending Tasks</div>
                    <div className="pending-tasks">
                        <div className="pending-task-item">
                            <div className="pending-task-value">{pendingTasks.crop}</div>
                            <div className="pending-task-label">Crop Plans</div>
                        </div>
                        <div className="pending-task-item">
                            <div className="pending-task-value">{pendingTasks.pest}</div>
                            <div className="pending-task-label">Pest Issues</div>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">15</div>
                    <div className="stat-label">Upcoming Meetings</div>
                </div>
                <div className="stat-card" onClick={() => openModal('ratings')} style={{ cursor: 'pointer' }}>
                    <div className="stat-value">4.7</div>
                    <div className="stat-label">Average Rating</div>
                    <button className="btn btn-primary" style={{ marginTop: '10px', width: '100%' }}>
                        <i className="fas fa-arrow-right"></i> Click here
                    </button>
                </div>
            </div>

            <div className="cards-grid">
                {/* Recent History Card */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Recent History</div>
                        <div className="card-icon"><i className="fas fa-history"></i></div>
                    </div>
                    <div className="card-content">
                        <ul className="card-list">
                            {history.map((item, index) => (
                                <li key={index}>
                                    <div>{item.action}</div>
                                    <span>{item.date}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Weather Information Card */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Weather Information</div>
                        <div className="card-icon"><i className="fas fa-cloud-sun"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="weather-info" style={{ textAlign: 'center', padding: '15px' }}>
                            <div style={{ fontSize: '2.5em', color: 'var(--primary)', marginBottom: '10px' }}>
                                <i className="fas fa-sun" style={{ color: '#ff9800' }}></i>
                            </div>
                            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: 'var(--primary-dark)', marginBottom: '5px' }}>
                                28°C
                            </div>
                            <div style={{ color: 'var(--gray)', marginBottom: '15px' }}>Sunny</div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                                <div>
                                    <div style={{ fontSize: '0.9em', color: 'var(--gray)' }}>Humidity</div>
                                    <div style={{ fontWeight: 'bold' }}>65%</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.9em', color: 'var(--gray)' }}>Rainfall</div>
                                    <div style={{ fontWeight: 'bold' }}>0 mm</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.9em', color: 'var(--gray)' }}>Wind</div>
                                    <div style={{ fontWeight: 'bold' }}>12 km/h</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.9em', color: 'var(--gray)' }}>Forecast</div>
                                    <div style={{ fontWeight: 'bold' }}>Clear</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '15px', fontSize: '0.8em', color: 'var(--gray)' }}>
                                Last updated: Today, 2:30 PM
                            </div>
                        </div>
                    </div>
                </div>

                {/* Send Message Card */}
                <div className="card" onClick={() => openModal('sendMessage')} style={{ cursor: 'pointer' }}>
                    <div className="card-header">
                        <div className="card-title">Send Message to Farmers</div>
                        <div className="card-icon"><i className="fas fa-comment-alt"></i></div>
                    </div>
                    <div className="card-content">
                        <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                            <div style={{ fontSize: '3em', color: 'var(--primary-light)', marginBottom: '15px' }}>
                                <i className="fas fa-paper-plane"></i>
                            </div>
                            <div style={{ fontSize: '1.2em', color: 'var(--primary-dark)', fontWeight: 600, marginBottom: '10px' }}>
                                Send Message
                            </div>
                            <div style={{ color: 'var(--gray)' }}>
                                Click to compose and send messages to farmers
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InstructorHome;
