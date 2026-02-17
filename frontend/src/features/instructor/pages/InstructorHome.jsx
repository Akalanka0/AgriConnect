import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const InstructorHome = () => {
    const { openModal } = useOutletContext();
    const [weatherSummary, setWeatherSummary] = useState({
        temp: 28,
        status: 'Loading...',
        icon: '01d'
    });
    const [stats, setStats] = useState({
        assignedFarmers: 0,
        pendingTasks: { crop: 0, pest: 0 },
        upcomingMeetings: 0,
        averageRating: 0.0
    });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [statsRes, historyRes] = await Promise.all([
                    fetch('/api/instructor/dashboard/stats', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch('/api/instructor/dashboard/history', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                const statsData = await statsRes.json();
                const historyData = await historyRes.json();

                if (statsData.success) setStats(statsData.data);
                if (historyData.success) setHistory(historyData.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchWeatherSummary = async () => {
            try {
                // Using coordinates for Anuradhapura for better reliability
                const lat = 8.3114;
                const lon = 80.4037;
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
                );
                const data = await response.json();
                if (response.ok) {
                    setWeatherSummary({
                        temp: Math.round(data.main.temp),
                        status: data.weather[0].description,
                        icon: data.weather[0].icon
                    });
                }
            } catch (error) {
                console.error('Error fetching weather summary:', error);
                setWeatherSummary(prev => ({ ...prev, status: 'Error' }));
            }
        };

        fetchWeatherSummary();
        fetchDashboardData();
    }, [API_KEY]);

    const getWeatherIconClass = (iconCode) => {
        const iconMap = {
            '01d': { icon: 'fa-sun', color: '#ff9800' },
            '01n': { icon: 'fa-moon', color: '#5c6bc0' },
            '02d': { icon: 'fa-cloud-sun', color: '#ffb74d' },
            '02n': { icon: 'fa-cloud-moon', color: '#7986cb' },
            '03d': { icon: 'fa-cloud', color: '#90a4ae' },
            '03n': { icon: 'fa-cloud', color: '#90a4ae' },
            '04d': { icon: 'fa-cloud-meatball', color: '#78909c' },
            '04n': { icon: 'fa-cloud-meatball', color: '#78909c' },
            '09d': { icon: 'fa-cloud-showers-heavy', color: '#4fc3f7' },
            '09n': { icon: 'fa-cloud-showers-heavy', color: '#4fc3f7' },
            '10d': { icon: 'fa-cloud-sun-rain', color: '#4fc3f7' },
            '10n': { icon: 'fa-cloud-moon-rain', color: '#4fc3f7' },
            '11d': { icon: 'fa-bolt', color: '#ffd54f' },
            '11n': { icon: 'fa-bolt', color: '#ffd54f' },
            '13d': { icon: 'fa-snowflake', color: '#b3e5fc' },
            '13n': { icon: 'fa-snowflake', color: '#b3e5fc' },
            '50d': { icon: 'fa-smog', color: '#b0bec5' },
            '50n': { icon: 'fa-smog', color: '#b0bec5' },
        };
        return iconMap[iconCode] || { icon: 'fa-cloud', color: '#90a4ae' };
    };

    const weatherUI = getWeatherIconClass(weatherSummary.icon);

    return (
        <>
            <div className="dashboard-stats">
                <div className="stat-card">
                    <div className="stat-value">{stats.assignedFarmers}</div>
                    <div className="stat-label">Assigned Farmers</div>
                    <div className="stat-trend trend-up"></div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Pending Tasks</div>
                    <div className="pending-tasks">
                        <div className="pending-task-item">
                            <div className="pending-task-value">{stats.pendingTasks.crop}</div>
                            <div className="pending-task-label">Crop Plans</div>
                        </div>
                        <div className="pending-task-item">
                            <div className="pending-task-value">{stats.pendingTasks.pest}</div>
                            <div className="pending-task-label">Pest Issues</div>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.upcomingMeetings}</div>
                    <div className="stat-label">Upcoming Meetings</div>
                </div>
                <div className="stat-card" onClick={() => openModal('ratings')} style={{ cursor: 'pointer' }}>
                    <div className="stat-value">{stats.averageRating}</div>
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
                        <ul className="card-list activities-list">
                            {history.length > 0 ? (
                                history.map((item, index) => (
                                    <li key={index}>
                                        <div className="activity-content">
                                            <div className="activity-text">{item.action}</div>
                                            <div className="activity-time">{item.date}</div>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li style={{ textAlign: 'center', color: 'var(--gray)', padding: '20px 0' }}>
                                    No recent activities
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Weather Information Card */}
                <div className="card clickable-card" onClick={() => openModal('weather')} style={{ cursor: 'pointer' }}>
                    <div className="card-header">
                        <div className="card-title">Weather Information</div>
                        <div className="card-icon"><i className="fas fa-cloud-sun"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="weather-card-container" style={{ padding: '15px 0', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.1em', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '5px' }}>Anuradhapura</div>
                            <div className="weather-icon-small" style={{ margin: '8px 0' }}>
                                <i className={`fas ${weatherUI.icon}`} style={{ color: weatherUI.color, fontSize: '2.2em' }}></i>
                            </div>
                            <div className="weather-temp-large" style={{ fontSize: '2em', fontWeight: 700 }}>
                                {weatherSummary.temp}°C
                            </div>
                            <div className="weather-status-text" style={{ fontSize: '1.1em', color: 'var(--gray)', textTransform: 'capitalize' }}>{weatherSummary.status}</div>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '15px' }}>
                            <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                                <i className="fas fa-expand-alt" style={{ marginRight: '8px' }}></i> View Details
                            </button>
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
