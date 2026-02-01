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
                        <div className="weather-card-container">
                            <div className="weather-icon-large">
                                <i className="fas fa-sun" style={{ color: '#ff9800' }}></i>
                            </div>
                            <div className="weather-temp-large">
                                28°C
                            </div>
                            <div className="weather-status-text">Sunny</div>

                            <div className="weather-details-grid">
                                <div>
                                    <div className="weather-detail-label">Humidity</div>
                                    <div className="weather-detail-value">65%</div>
                                </div>
                                <div>
                                    <div className="weather-detail-label">Rainfall</div>
                                    <div className="weather-detail-value">0 mm</div>
                                </div>
                                <div>
                                    <div className="weather-detail-label">Wind</div>
                                    <div className="weather-detail-value">12 km/h</div>
                                </div>
                                <div>
                                    <div className="weather-detail-label">UV Index</div>
                                    <div className="weather-detail-value">High</div>
                                </div>
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
