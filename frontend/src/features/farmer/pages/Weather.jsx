

import React, { useState, useEffect } from 'react';

const Weather = () => {
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [locationName, setLocationName] = useState('Anuradhapura'); // Default
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

    const commonAreas = [
        'Anuradhapura', 'Thalawa', 'Tambuttegama', 'Medawachchiya', 
        'Eppawala', 'Kekirawa', 'Mihintale', 'Galenbindunuwewa',
        'Padaviya', 'Nochchiyagama'
    ];

    const fetchWeather = async (lat, lon, city = null) => {
        try {
            setLoading(true);
            let url = city 
                ? `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
                : `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
            
            const weatherRes = await fetch(url);
            const weatherData = await weatherRes.json();

            if (weatherRes.ok) {
                setWeather(weatherData);
                // Use the selected city name if provided, otherwise use the name from API
                setLocationName(city || weatherData.name);
                
                // Fetch forecast using coordinates from weatherData to be consistent
                const { lat: cityLat, lon: cityLon } = weatherData.coord;
                const forecastRes = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?lat=${cityLat}&lon=${cityLon}&appid=${API_KEY}&units=metric`
                );
                const forecastData = await forecastRes.json();

                if (forecastRes.ok) {
                    const dailyForecast = forecastData.list.filter(item => item.dt_txt.includes('12:00:00'));
                    setForecast(dailyForecast);
                }
                setError(null);
            } else {
                throw new Error(weatherData.message || 'Location not found');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather(null, null, 'Anuradhapura');
    }, []);

    const formatTime = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getWeatherIcon = (iconCode) => {
        const iconMap = {
            '01d': 'fa-sun',
            '01n': 'fa-moon',
            '02d': 'fa-cloud-sun',
            '02n': 'fa-cloud-moon',
            '03d': 'fa-cloud',
            '03n': 'fa-cloud',
            '04d': 'fa-cloud-meatball',
            '04n': 'fa-cloud-meatball',
            '09d': 'fa-cloud-showers-heavy',
            '09n': 'fa-cloud-showers-heavy',
            '10d': 'fa-cloud-sun-rain',
            '10n': 'fa-cloud-moon-rain',
            '11d': 'fa-bolt',
            '11n': 'fa-bolt',
            '13d': 'fa-snowflake',
            '13n': 'fa-snowflake',
            '50d': 'fa-smog',
            '50n': 'fa-smog',
        };
        return iconMap[iconCode] || 'fa-cloud';
    };

    if (loading) {
        return (
            <div className="page active" id="alerts">
                <div className="page-title">
                    <i className="fas fa-cloud-sun"></i>
                    <h2>Weather & Alerts</h2>
                </div>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '3em', color: 'var(--primary)' }}></i>
                    <p style={{ marginTop: '15px' }}>Fetching real-time weather data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page active" id="alerts">
                <div className="page-title">
                    <i className="fas fa-cloud-sun"></i>
                    <h2>Weather & Alerts</h2>
                </div>
                <div className="alert-card pest">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <strong>Error:</strong> {error}
                        <p>Please check your connection or try again later.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page active" id="alerts" style={{ display: 'block' }}>
            <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-cloud-sun"></i>
                    <h2>Weather & Alerts</h2>
                </div>
                <div style={{ textAlign: 'right', background: 'white', padding: '10px 20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid var(--primary-light)' }}>
                    <div style={{ fontSize: '1.2em', fontWeight: '700', color: 'var(--primary-dark)', letterSpacing: '1px' }}>
                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '0.85em', color: 'var(--gray)', fontWeight: '500' }}>
                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Anuradhapura Area Selection Dropdown */}
            <div className="card" style={{ marginBottom: '20px', padding: '20px', textAlign: 'center' }}>
                <div style={{ marginBottom: '15px', fontSize: '1.1em', color: 'var(--gray)', fontWeight: '600' }}>
                    <i className="fas fa-map-marker-alt" style={{ marginRight: '10px', color: 'var(--primary)' }}></i>
                    Select Region in Anuradhapura
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <select 
                        className="form-control" 
                        value={locationName}
                        onChange={(e) => fetchWeather(null, null, e.target.value)}
                        style={{ 
                            maxWidth: '350px', 
                            padding: '12px 20px', 
                            borderRadius: '12px',
                            border: '2px solid var(--primary-light)',
                            fontSize: '1.1em',
                            cursor: 'pointer',
                            backgroundColor: '#f8f9fa',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                            appearance: 'none',
                            backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%232e7d32%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 15px center',
                            backgroundSize: '18px',
                            textAlign: 'center'
                        }}
                    >
                        {commonAreas.map(area => (
                            <option key={area} value={area}>{area}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="cards-grid">
                {/* Main Weather Card */}
                <div className="weather-card" id="weatherCard">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '1.2em', fontWeight: '600' }}>{locationName}</div>
                            <div style={{ 
                                fontSize: '0.75em', 
                                background: 'rgba(255,255,255,0.2)', 
                                padding: '2px 8px', 
                                borderRadius: '10px', 
                                marginTop: '5px',
                                display: 'inline-block'
                            }}>
                                <i className={`fas ${weather?.weather[0]?.icon.endsWith('d') ? 'fa-sun' : 'fa-moon'}`} style={{ marginRight: '5px' }}></i>
                                {weather?.weather[0]?.icon.endsWith('d') ? 'Day' : 'Night'}
                            </div>
                        </div>
                        <div style={{ fontSize: '0.75em', opacity: 0.8, textAlign: 'right' }}>
                            Last Updated:<br/>
                            {new Date(weather?.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    <div className="weather-icon">
                        <i className={`fas ${getWeatherIcon(weather?.weather[0]?.icon)}`}></i>
                    </div>
                    <div className="weather-temp">{Math.round(weather?.main?.temp)}°C</div>
                    <div style={{ fontSize: '0.9em', marginBottom: '5px' }}>
                        <i className="fas fa-arrow-up" style={{ color: '#ffeb3b', marginRight: '5px' }}></i>
                        {Math.round(weather?.main?.temp_max)}° / 
                        <i className="fas fa-arrow-down" style={{ color: '#81d4fa', marginLeft: '5px', marginRight: '5px' }}></i>
                        {Math.round(weather?.main?.temp_min)}°
                    </div>
                    <div className="weather-desc" style={{ textTransform: 'capitalize', fontWeight: '500' }}>
                        {weather?.weather[0]?.description}
                    </div>
                    
                    <div className="weather-details" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '15px' }}>
                        <div className="weather-detail">
                            <i className="fas fa-wind"></i>
                            <div style={{ fontSize: '0.8em' }}>Wind</div>
                            <div>{weather?.wind?.speed} m/s</div>
                        </div>
                        <div className="weather-detail">
                            <i className="fas fa-cloud-showers-heavy"></i>
                            <div style={{ fontSize: '0.8em' }}>Rain (1h)</div>
                            <div>{weather?.rain?.['1h'] || 0} mm</div>
                        </div>
                        <div className="weather-detail">
                            <i className="fas fa-tint"></i>
                            <div style={{ fontSize: '0.8em' }}>Humidity</div>
                            <div>{weather?.main?.humidity}%</div>
                        </div>
                    </div>
                </div>

                {/* Sun & Atmospheric Details Card */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Day & Night Details</div>
                        <div className="card-icon"><i className="fas fa-adjust"></i></div>
                    </div>
                    <div className="card-content">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '10px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <i className="fas fa-sun" style={{ color: '#ff9800', fontSize: '1.5em', marginBottom: '5px' }}></i>
                                <div style={{ fontSize: '0.9em', color: 'var(--gray)' }}>Sunrise</div>
                                <div style={{ fontWeight: '600' }}>{formatTime(weather?.sys?.sunrise)}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <i className="fas fa-moon" style={{ color: '#5c6bc0', fontSize: '1.5em', marginBottom: '5px' }}></i>
                                <div style={{ fontSize: '0.9em', color: 'var(--gray)' }}>Sunset</div>
                                <div style={{ fontWeight: '600' }}>{formatTime(weather?.sys?.sunset)}</div>
                            </div>
                            <div style={{ textAlign: 'center', gridColumn: 'span 2', padding: '10px', background: '#f8f9fa', borderRadius: '10px', border: '1px dashed var(--primary-light)' }}>
                                <div style={{ fontSize: '0.85em', color: 'var(--gray)' }}>
                                    {weather?.dt < weather?.sys?.sunset && weather?.dt > weather?.sys?.sunrise ? (
                                        <>Next: <strong style={{ color: 'var(--primary-dark)' }}>Sunset</strong> at {formatTime(weather?.sys?.sunset)}</>
                                    ) : (
                                        <>Next: <strong style={{ color: 'var(--primary-dark)' }}>Sunrise</strong> at {formatTime(weather?.sys?.sunrise)}</>
                                    )}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <i className="fas fa-thermometer-half" style={{ color: 'var(--primary)', fontSize: '1.5em', marginBottom: '5px' }}></i>
                                <div style={{ fontSize: '0.9em', color: 'var(--gray)' }}>Feels Like</div>
                                <div style={{ fontWeight: '600' }}>{Math.round(weather?.main?.feels_like)}°C</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <i className="fas fa-cloud-rain" style={{ color: '#42a5f5', fontSize: '1.5em', marginBottom: '5px' }}></i>
                                <div style={{ fontSize: '0.9em', color: 'var(--gray)' }}>Precipitation</div>
                                <div style={{ fontWeight: '600' }}>{weather?.rain ? 'Yes' : 'None'}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <i className="fas fa-cloud" style={{ color: '#90a4ae', fontSize: '1.5em', marginBottom: '5px' }}></i>
                                <div style={{ fontSize: '0.9em', color: 'var(--gray)' }}>Cloud Cover</div>
                                <div style={{ fontWeight: '600' }}>{weather?.clouds?.all}%</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <i className="fas fa-tint-slash" style={{ color: '#4fc3f7', fontSize: '1.5em', marginBottom: '5px' }}></i>
                                <div style={{ fontSize: '0.9em', color: 'var(--gray)' }}>Dew Point</div>
                                <div style={{ fontWeight: '600' }}>{Math.round(weather?.main?.temp - ((100 - weather?.main?.humidity) / 5))}°C</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5-Day Forecast Card */}
                <div className="card" style={{ gridColumn: 'span 1' }}>
                    <div className="card-header">
                        <div className="card-title">5-Day Forecast</div>
                        <div className="card-icon"><i className="fas fa-calendar-alt"></i></div>
                    </div>
                    <div className="card-content">
                        <ul className="card-list">
                            {forecast.map((day, index) => (
                                <li key={index} style={{ padding: '12px 0' }}>
                                    <div style={{ fontWeight: '500' }}>{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ textAlign: 'center', minWidth: '40px' }}>
                                            <i className={`fas ${getWeatherIcon(day.weather[0].icon)}`} style={{ color: 'var(--primary)', display: 'block' }}></i>
                                            {day.pop > 0 && (
                                                <span style={{ fontSize: '0.7em', color: 'var(--info)', fontWeight: '600' }}>
                                                    {Math.round(day.pop * 100)}%
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontWeight: '600', minWidth: '40px' }}>{Math.round(day.main.temp)}°C</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Dynamic Agricultural Advice */}
            <div className="alert-card weather" style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
                        <i className="fas fa-seedling" style={{ fontSize: '1.5em', color: 'var(--primary)' }}></i>
                        <h4 style={{ color: 'var(--primary-dark)', margin: 0 }}>Smart Farming Advisory: {locationName}</h4>
                    </div>
                    <p style={{ fontSize: '0.95em', lineHeight: '1.5' }}>
                        {weather?.main?.temp > 32 ? 
                            "Extreme heat alert! Increase irrigation frequency and consider mulching to retain soil moisture." : 
                         weather?.weather[0]?.main === 'Rain' ? 
                            "Rainy conditions. Avoid applying fertilizers today as they might wash away. Ensure clear drainage paths." : 
                         weather?.wind?.speed > 8 ? 
                            "High winds detected. Secure young saplings and avoid tall-crop spraying activities." : 
                            "Stable weather conditions. Ideal for general field work, planting, and harvesting."}
                    </p>
                </div>
                
                <div style={{ flex: '1 1 300px', borderLeft: '1px solid rgba(0,0,0,0.1)', paddingLeft: '20px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
                        <i className="fas fa-bug" style={{ fontSize: '1.5em', color: '#e57373' }}></i>
                        <h4 style={{ color: '#c62828', margin: 0 }}>Pest & Disease Risk</h4>
                    </div>
                    <p style={{ fontSize: '0.95em', lineHeight: '1.5' }}>
                        {weather?.main?.humidity > 80 ? 
                            "High humidity increases risk of fungal diseases (Blast/Blight). Monitor your paddy fields closely." : 
                         weather?.main?.temp > 30 && weather?.main?.humidity < 50 ? 
                            "Hot and dry conditions may lead to increased mite or aphid activity. Check leaf undersides." : 
                            "Current conditions show low immediate pest risk, but routine scouting is recommended."}
                    </p>
                </div>

                <div style={{ flex: '1 1 100%', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '15px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
                        <i className="fas fa-water" style={{ fontSize: '1.5em', color: 'var(--info)' }}></i>
                        <h4 style={{ color: 'var(--info-dark)', margin: 0 }}>Soil & Water Management</h4>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div className="badge badge-info" style={{ padding: '10px', textAlign: 'left', background: '#e1f5fe', color: '#01579b' }}>
                            <strong>Evaporation:</strong> {weather?.main?.temp > 30 ? 'High' : 'Moderate'} - Mulching recommended.
                        </div>
                        <div className="badge badge-success" style={{ padding: '10px', textAlign: 'left', background: '#e8f5e9', color: '#1b5e20' }}>
                            <strong>Spraying:</strong> {weather?.wind?.speed < 5 ? 'Safe' : 'Risky'} - Wind is {weather?.wind?.speed} m/s.
                        </div>
                        <div className="badge badge-warning" style={{ padding: '10px', textAlign: 'left', background: '#fffde7', color: '#f57f17' }}>
                            <strong>Drying:</strong> {weather?.clouds?.all < 30 ? 'Excellent' : 'Poor'} - {weather?.clouds?.all}% cloud cover.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Weather;
