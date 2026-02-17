import React, { useState, useEffect } from 'react';

const WeatherDetailModal = ({ isOpen, onClose }) => {
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [locationName, setLocationName] = useState('Anuradhapura');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

    const areaCoordinates = {
        'Anuradhapura': { lat: 8.3114, lon: 80.4037 },
        'Thalawa': { lat: 8.1966, lon: 80.2923 },
        'Tambuttegama': { lat: 8.1333, lon: 80.2833 },
        'Medawachchiya': { lat: 8.5333, lon: 80.4833 },
        'Eppawala': { lat: 8.1500, lon: 80.3167 },
        'Kekirawa': { lat: 8.0167, lon: 80.5833 },
        'Mihintale': { lat: 8.3500, lon: 80.5000 },
        'Galenbindunuwewa': { lat: 8.2333, lon: 80.6833 },
        'Padaviya': { lat: 8.9167, lon: 80.7500 },
        'Nochchiyagama': { lat: 8.2833, lon: 80.2000 }
    };

    const commonAreas = Object.keys(areaCoordinates);

    const fetchWeather = async (city = 'Anuradhapura') => {
        try {
            setLoading(true);
            const coords = areaCoordinates[city];
            
            let weatherUrl, forecastUrl;
            if (coords) {
                weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`;
                forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`;
            } else {
                weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
                forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;
            }
            
            const [weatherRes, forecastRes] = await Promise.all([
                fetch(weatherUrl),
                fetch(forecastUrl)
            ]);

            const [weatherData, forecastData] = await Promise.all([
                weatherRes.json(),
                forecastRes.json()
            ]);

            if (weatherRes.ok && forecastRes.ok) {
                setWeather(weatherData);
                setForecast(forecastData.list.filter(item => item.dt_txt.includes('12:00:00')));
                setLocationName(city);
                setError(null);
            } else {
                throw new Error(weatherData.message || forecastData.message || 'Data retrieval failed');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchWeather('Anuradhapura');
        }
    }, [isOpen]);

    const formatTime = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getWeatherIcon = (iconCode) => {
        const iconMap = {
            '01d': 'fa-sun', '01n': 'fa-moon',
            '02d': 'fa-cloud-sun', '02n': 'fa-cloud-moon',
            '03d': 'fa-cloud', '03n': 'fa-cloud',
            '04d': 'fa-cloud-meatball', '04n': 'fa-cloud-meatball',
            '09d': 'fa-cloud-showers-heavy', '09n': 'fa-cloud-showers-heavy',
            '10d': 'fa-cloud-sun-rain', '10n': 'fa-cloud-moon-rain',
            '11d': 'fa-bolt', '11n': 'fa-bolt',
            '13d': 'fa-snowflake', '13n': 'fa-snowflake',
            '50d': 'fa-smog', '50n': 'fa-smog',
        };
        return iconMap[iconCode] || 'fa-cloud';
    };

    if (!isOpen) return null;

    return (
        <div className="theme-instructor">
            <div className="instructor-modal" style={{ display: 'flex' }} onClick={onClose}>
                <div className="instructor-modal-content weather-detail-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%' }}>
                    <div className="instructor-modal-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div className="modal-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-cloud-sun" style={{ fontSize: '1.4em' }}></i>
                            </div>
                            <div>
                                <h3 className="instructor-modal-title" style={{ margin: 0 }}>Weather Insights</h3>
                                <p style={{ margin: 0, color: 'var(--gray)', fontSize: '0.85em', fontWeight: 400 }}>Real-time data & forecasts for agricultural planning</p>
                            </div>
                        </div>
                        <span className="instructor-close" onClick={onClose}>&times;</span>
                    </div>

                    <div className="instructor-modal-body" style={{ padding: '10px 0' }}>
                        {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px' }}>
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: '3em', color: 'var(--primary)', marginBottom: '20px' }}></i>
                            <p style={{ color: 'var(--gray)', fontWeight: 500 }}>Fetching latest weather data for {locationName}...</p>
                        </div>
                    ) : error ? (
                        <div className="alert-card error" style={{ background: '#fff5f5', borderLeft: '4px solid #f44336', padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <i className="fas fa-exclamation-circle" style={{ color: '#f44336', fontSize: '1.5em' }}></i>
                            <div>
                                <strong style={{ color: '#d32f2f' }}>Error:</strong> {error}
                                <p style={{ margin: '5px 0 0', color: '#666' }}>Unable to retrieve weather information. Please try again later.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="weather-modal-grid">
                            {/* Left Column: Current Weather & Selection */}
                            <div className="weather-main-section">
                                <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                                        <i className="fas fa-map-marker-alt" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}></i>
                                        <select 
                                            className="form-control" 
                                            value={locationName}
                                            onChange={(e) => fetchWeather(e.target.value)}
                                            style={{ paddingLeft: '40px', borderRadius: '10px', border: '1px solid #e0e0e0' }}
                                        >
                                            {commonAreas.map(area => (
                                                <option key={area} value={area}>{area}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div style={{ fontSize: '0.8em', color: 'var(--gray)' }}>{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                                    </div>
                                </div>

                                <div className="weather-display-card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', borderRadius: '20px', padding: '30px', color: 'white', textAlign: 'center', marginBottom: '25px', boxShadow: '0 10px 20px rgba(46, 125, 50, 0.2)' }}>
                                    <div style={{ fontSize: '1.4em', fontWeight: 600, marginBottom: '10px' }}>{locationName}</div>
                                    <div style={{ fontSize: '4em', margin: '15px 0' }}>
                                        <i className={`fas ${getWeatherIcon(weather?.weather[0]?.icon)}`}></i>
                                    </div>
                                    <div style={{ fontSize: '3.5em', fontWeight: 700 }}>{Math.round(weather?.main?.temp)}°C</div>
                                    <div style={{ textTransform: 'capitalize', fontSize: '1.2em', opacity: 0.9, marginBottom: '20px' }}>{weather?.weather[0]?.description}</div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '20px' }}>
                                        <div>
                                            <div style={{ opacity: 0.8, fontSize: '0.85em' }}>Humidity</div>
                                            <div style={{ fontWeight: 600 }}>{weather?.main?.humidity}%</div>
                                        </div>
                                        <div>
                                            <div style={{ opacity: 0.8, fontSize: '0.85em' }}>Wind</div>
                                            <div style={{ fontWeight: 600 }}>{weather?.wind?.speed} m/s</div>
                                        </div>
                                        <div>
                                            <div style={{ opacity: 0.8, fontSize: '0.85em' }}>Visibility</div>
                                            <div style={{ fontWeight: 600 }}>{(weather?.visibility / 1000).toFixed(1)} km</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="weather-advisory-card" style={{ background: '#f0f7f0', padding: '20px', borderRadius: '15px', borderLeft: '5px solid var(--primary)' }}>
                                    <h4 style={{ color: 'var(--primary-dark)', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <i className="fas fa-seedling"></i> Instructor Advisory
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.95em', color: '#444', lineHeight: 1.5 }}>
                                        {weather?.main?.temp > 32 ? 
                                            "Alert farmers about potential heat stress in crops. Recommend increased irrigation and soil moisture monitoring." : 
                                         weather?.weather[0]?.main === 'Rain' ? 
                                            "Advise farmers to check field drainage. Postpone any fertilizer or pesticide applications due to wash-off risk." : 
                                         weather?.wind?.speed > 8 ? 
                                            "Warn farmers about high winds. Young saplings and tall crops may need temporary support." : 
                                            "Ideal conditions for most field activities. Encourage farmers to proceed with planting or harvesting schedules."}
                                    </p>
                                </div>
                            </div>

                            {/* Right Column: Forecast & Details */}
                            <div className="weather-side-section">
                                <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
                                    <h4 style={{ marginTop: 0, color: 'var(--primary-dark)', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                                        <i className="fas fa-calendar-alt" style={{ marginRight: '10px' }}></i> 5-Day Forecast
                                    </h4>
                                    <div className="forecast-list">
                                        {forecast.map((day, index) => (
                                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: index < forecast.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                                                <div style={{ fontWeight: 500, width: '90px' }}>{new Date(day.dt * 1000).toLocaleDateString([], { weekday: 'short', day: 'numeric' })}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'center' }}>
                                                    <i className={`fas ${getWeatherIcon(day.weather[0].icon)}`} style={{ color: 'var(--primary)', fontSize: '1.2em' }}></i>
                                                    <span style={{ fontSize: '0.8em', color: 'var(--gray)', width: '40px' }}>{day.pop > 0 ? `${Math.round(day.pop * 100)}%` : ''}</span>
                                                </div>
                                                <div style={{ fontWeight: 600, width: '45px', textAlign: 'right' }}>{Math.round(day.main.temp)}°C</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="card" style={{ padding: '20px' }}>
                                    <h4 style={{ marginTop: 0, color: 'var(--primary-dark)', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                                        <i className="fas fa-info-circle" style={{ marginRight: '10px' }}></i> Atmospheric Details
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', paddingTop: '10px' }}>
                                        <div style={{ textAlign: 'center', padding: '10px', background: '#f9f9f9', borderRadius: '10px' }}>
                                            <div style={{ fontSize: '0.8em', color: 'var(--gray)' }}>Sunrise</div>
                                            <div style={{ fontWeight: 600, color: '#ff9800' }}>{formatTime(weather?.sys?.sunrise)}</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '10px', background: '#f9f9f9', borderRadius: '10px' }}>
                                            <div style={{ fontSize: '0.8em', color: 'var(--gray)' }}>Sunset</div>
                                            <div style={{ fontWeight: 600, color: '#5c6bc0' }}>{formatTime(weather?.sys?.sunset)}</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '10px', background: '#f9f9f9', borderRadius: '10px' }}>
                                            <div style={{ fontSize: '0.8em', color: 'var(--gray)' }}>Feels Like</div>
                                            <div style={{ fontWeight: 600 }}>{Math.round(weather?.main?.feels_like)}°C</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '10px', background: '#f9f9f9', borderRadius: '10px' }}>
                                            <div style={{ fontSize: '0.8em', color: 'var(--gray)' }}>Pressure</div>
                                            <div style={{ fontWeight: 600 }}>{weather?.main?.pressure} hPa</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="instructor-modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .weather-modal-grid {
                    display: grid;
                    grid-template-columns: 1.2fr 1fr;
                    gap: 30px;
                }
                @media (max-width: 768px) {
                    .weather-modal-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}} />
        </div>
    </div>
  );
};

export default WeatherDetailModal;
