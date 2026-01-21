import React from 'react';

const AdminHome = () => {
    const stats = [
        { value: '8460', label: 'Total Users' },
        { value: '8420', label: 'Farmers' },
        { value: '40', label: 'Instructors' },
        { value: '5', label: 'Admins' }
    ];

    const recentActivities = [
        { action: 'New farmer registration', time: 'Today' },
        { action: 'Pest report submitted', time: '2 hours ago' },
        { action: 'Crop plan approved', time: 'Yesterday' },
        { action: 'Weather alert sent', time: '2 days ago' }
    ];

    return (
        <div className="page active" id="home">
            <div className="page-title">
                <i className="fas fa-home"></i>
                <h2>Home</h2>
            </div>

            <div className="dashboard-stats">
                {stats.map((stat, index) => (
                    <div className="stat-card" key={index}>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="cards-grid">
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Recent Activities</div>
                        <div className="card-icon"><i className="fas fa-history"></i></div>
                    </div>
                    <div className="card-content">
                        <ul className="card-list">
                            {recentActivities.map((activity, index) => (
                                <li key={index}>
                                    <div>{activity.action}</div>
                                    <span>{activity.time}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                {/* Quick Actions and Message cards could be here */}
            </div>
        </div>
    );
};

export default AdminHome;
