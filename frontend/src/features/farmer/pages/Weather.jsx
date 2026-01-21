

import React from 'react';

const Weather = () => {
    return (
        <div className="page active" id="alerts" style={{ display: 'block' }}>
            <div className="page-title">
                <i className="fas fa-cloud-sun"></i>
                <h2>Weather & Alerts</h2>
            </div>

            <div className="cards-grid">
                <div className="weather-card" id="weatherCard">
                    <div className="weather-icon">
                        <i className="fas fa-sun"></i>
                    </div>
                    <div className="weather-temp">28°C</div>
                    <div className="weather-desc">Sunny</div>
                    <div className="weather-details">
                        <div className="weather-detail">
                            <i className="fas fa-wind"></i>
                            <div>12 km/h</div>
                        </div>
                        <div className="weather-detail">
                            <i className="fas fa-tint"></i>
                            <div>60%</div>
                        </div>
                        <div className="weather-detail">
                            <i className="fas fa-compress-arrows-alt"></i>
                            <div>1012 hPa</div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div className="card-title">7-Day Forecast</div>
                        <div className="card-icon"><i className="fas fa-cloud-sun-rain"></i></div>
                    </div>
                    <div className="card-content">
                        <ul className="card-list">
                            {[
                                { day: 'Monday', icon: 'fas fa-sun', temp: '28°C' },
                                { day: 'Tuesday', icon: 'fas fa-cloud-sun', temp: '26°C' },
                                { day: 'Wednesday', icon: 'fas fa-cloud-rain', temp: '24°C' },
                                { day: 'Thursday', icon: 'fas fa-cloud-showers-heavy', temp: '22°C' },
                                { day: 'Friday', icon: 'fas fa-cloud-sun', temp: '25°C' },
                                { day: 'Saturday', icon: 'fas fa-sun', temp: '27°C' },
                                { day: 'Sunday', icon: 'fas fa-sun', temp: '29°C' }
                            ].map((day, index) => (
                                <li key={index}>
                                    <div>{day.day}</div>
                                    <div><i className={day.icon}></i> {day.temp}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Weather;
