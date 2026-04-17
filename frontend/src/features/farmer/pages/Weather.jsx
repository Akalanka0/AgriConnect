

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/Weather.module.css';
import commonStyles from '../styles/FarmerCommon.module.css';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';

const Weather = () => {
    const { t } = useTranslation('farmer');
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
            <div className={`page active ${styles.mainPage}`} id="alerts">
                <div className={commonStyles.pageTitle}>
                    <i className="fas fa-cloud-sun"></i>
                    <h2>{t('weather.title')}</h2>
                </div>
                <div className={styles.loadingContainer}>
                    <i className={`fas fa-spinner fa-spin ${styles.spinnerIcon}`}></i>
                    <p className={styles.loadingText}>{t('weather.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`page active ${styles.mainPage}`} id="alerts">
                <div className={commonStyles.pageTitle}>
                    <i className="fas fa-cloud-sun"></i>
                    <h2>{t('weather.title')}</h2>
                </div>
                <div className={`${commonStyles.alertCard} ${commonStyles.alertDanger}`}>
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <strong>{t('weather.errorTitle')}</strong> {error}
                        <p>{t('weather.errorHint')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`page active ${styles.mainPage}`} id="alerts">
            <div className={commonStyles.pageTitle}>
                <div className={styles.titleLeft}>
                    <i className="fas fa-cloud-sun"></i>
                    <h2>{t('weather.title')}</h2>
                </div>
                <div className={styles.timeDisplay}>
                    <div className={styles.currentTime}>
                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className={styles.currentDate}>
                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Anuradhapura Area Selection Dropdown */}
            <div className={`${commonCardStyles.card} ${styles.locationCard}`}>
                <div className={styles.locationLabel}>
                    <i className={`fas fa-location-dot ${styles.locationIcon}`}></i>
                    {t('weather.selectRegion')}
                </div>
                <div className={styles.locationSelectContainer}>
                    <select
                        className={`${commonStyles.formControl} ${styles.locationSelect}`}
                        value={locationName}
                        onChange={(e) => fetchWeather(null, null, e.target.value)}
                    >
                        {commonAreas.map(area => (
                            <option key={area} value={area}>{area}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={commonStyles.cardsGrid}>
                {/* Main Weather Card */}
                <div className={`${commonCardStyles.card} ${styles.weatherCard}`} id="weatherCard">
                    <div className={styles.weatherCardHeader}>
                        <div className={styles.locationInfo}>
                            <div className={styles.locationName}>{locationName}</div>
                            <div className={styles.dayNightBadge}>
                                <i className={`fas ${weather?.weather[0]?.icon.endsWith('d') ? 'fa-sun' : 'fa-moon'} ${styles.dayNightIcon}`}></i>
                                {weather?.weather[0]?.icon.endsWith('d') ? t('weather.day') : t('weather.night')}
                            </div>
                        </div>
                        <div className={styles.lastUpdated}>
                            {t('weather.lastUpdated')}:<br />
                            {new Date(weather?.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    <div className="weather-icon">
                        <i className={`fas ${getWeatherIcon(weather?.weather[0]?.icon)}`}></i>
                    </div>
                    <div className={styles.temperature}>
                        <div className={styles.currentTemperature}>{Math.round(weather?.main?.temp)}°C</div>
                        <div className={styles.temperatureRange}>
                            <i className={`fas fa-arrow-up ${styles.tempUpIcon}`}></i>
                            {Math.round(weather?.main?.temp_max)}° /
                            <i className={`fas fa-arrow-down ${styles.tempDownIcon}`}></i>
                            {Math.round(weather?.main?.temp_min)}°
                        </div>
                    </div>
                    <div className={styles.weatherDescription}>
                        {weather?.weather[0]?.description}
                    </div>

                    <div className={styles.weatherDetails}>
                        <div className={styles.weatherDetail}>
                            <i className="fas fa-wind"></i>
                            <div className={styles.detailLabel}>{t('weather.wind')}</div>
                            <div>{weather?.wind?.speed} m/s</div>
                        </div>
                        <div className="weather-detail">
                            <i className="fas fa-cloud-showers-heavy"></i>
                            <div className={styles.detailLabel}>{t('weather.rain1h')}</div>
                            <div>{weather?.rain?.['1h'] || 0} mm</div>
                        </div>
                        <div className={styles.weatherDetail}>
                            <i className="fas fa-tint"></i>
                            <div className={styles.detailLabel}>{t('weather.humidity')}</div>
                            <div>{weather?.main?.humidity}%</div>
                        </div>
                    </div>
                </div>

                {/* Sun & Atmospheric Details Card */}
                <div className={commonCardStyles.card}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('weather.dayNightDetails')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-adjust"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={styles.sunMoonGrid}>
                            <div className={styles.sunMoonItem}>
                                <i className={`fas fa-sun ${styles.sunIcon}`}></i>
                                <div className={styles.sunMoonLabel}>{t('weather.sunrise')}</div>
                                <div className={styles.sunMoonTime}>{formatTime(weather?.sys?.sunrise)}</div>
                            </div>
                            <div className={styles.sunMoonItem}>
                                <i className={`fas fa-moon ${styles.moonIcon}`}></i>
                                <div className={styles.sunMoonLabel}>{t('weather.sunset')}</div>
                                <div className={styles.sunMoonTime}>{formatTime(weather?.sys?.sunset)}</div>
                            </div>
                            <div className={styles.nextEvent}>
                                <div className={styles.nextEventText}>
                                    {weather?.dt < weather?.sys?.sunset && weather?.dt > weather?.sys?.sunrise ? (
                                        <>{t('weather.nextLabel')} <strong className={styles.nextEventStrong}>Sunset</strong> at {formatTime(weather?.sys?.sunset)}</>
                                    ) : (
                                        <>{t('weather.nextLabel')} <strong className={styles.nextEventStrong}>Sunrise</strong> at {formatTime(weather?.sys?.sunrise)}</>
                                    )}
                                </div>
                            </div>
                            <div className={styles.sunMoonItem}>
                                <i className={`fas fa-thermometer-half ${styles.thermoIcon}`}></i>
                                <div className={styles.sunMoonLabel}>{t('weather.feelsLike')}</div>
                                <div className={styles.sunMoonTime}>{Math.round(weather?.main?.feels_like)}°C</div>
                            </div>
                            <div className={styles.sunMoonItem}>
                                <i className={`fas fa-cloud-rain ${styles.precipIcon}`}></i>
                                <div className={styles.sunMoonLabel}>{t('weather.precipitation')}</div>
                                <div className={styles.sunMoonTime}>{weather?.rain ? 'Yes' : 'None'}</div>
                            </div>
                            <div className={styles.sunMoonItem}>
                                <i className={`fas fa-cloud ${styles.cloudIcon}`}></i>
                                <div className={styles.sunMoonLabel}>{t('weather.cloudCover')}</div>
                                <div className={styles.sunMoonTime}>{weather?.clouds?.all}%</div>
                            </div>
                            <div className={styles.sunMoonItem}>
                                <i className={`fas fa-tint-slash ${styles.dewIcon}`}></i>
                                <div className={styles.sunMoonLabel}>{t('weather.dewPoint')}</div>
                                <div className={styles.sunMoonTime}>{Math.round(weather?.main?.temp - ((100 - weather?.main?.humidity) / 5))}°C</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5-Day Forecast Card */}
                <div className={`${commonCardStyles.card} ${styles.forecastCard}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('weather.forecast')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-calendar-alt"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <ul className={styles.cardList}>
                            {forecast.map((day, index) => (
                                <li className={styles.forecastItem} key={index}>
                                    <div className={styles.forecastDate}>{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                                    <div className={styles.forecastDayContainer}>
                                        <div className={styles.forecastIconContainer}>
                                            <i className={`fas ${getWeatherIcon(day.weather[0].icon)} ${styles.forecastIcon}`}></i>
                                        </div>
                                        <span className={styles.forecastTemp}>{Math.round(day.main.temp)}°C</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Dynamic Agricultural Advice */}
            <div className={`${commonStyles.alertCard} ${commonStyles.weather} ${styles.advisoryCard}`}>
                <div className={styles.advisorySection}>
                    <div className={styles.advisoryHeader}>
                        <i className={`fas fa-seedling ${styles.advisoryIcon}`}></i>
                        <h4 className={styles.advisoryTitle}>{t('weather.advisoryTitle')}: {locationName}</h4>
                    </div>
                    <p className={styles.advisoryText}>
                        {weather?.main?.temp > 32 ?
                            t('weather.advisoryHeatAlert') :
                            weather?.weather[0]?.main === 'Rain' ?
                                t('weather.advisoryRain') :
                                weather?.wind?.speed > 8 ?
                                    t('weather.advisoryHighWind') :
                                    t('weather.advisoryStable')}
                    </p>
                </div>

                <div className={styles.pestSection}>
                    <div className={styles.advisoryHeader}>
                        <i className={`fas fa-bug ${styles.pestIcon}`}></i>
                        <h4 className={styles.pestTitle}>{t('weather.pestRiskTitle')}</h4>
                    </div>
                    <p className={styles.advisoryText}>
                        {weather?.main?.humidity > 80 ?
                            t('weather.pestHighHumidity') :
                            weather?.main?.temp > 30 && weather?.main?.humidity < 50 ?
                                t('weather.pestHotDry') :
                                t('weather.pestLowRisk')}
                    </p>
                </div>

                <div className={styles.waterSection}>
                    <div className={styles.advisoryHeader}>
                        <i className={`fas fa-water ${styles.waterIcon}`}></i>
                        <h4 className={styles.waterTitle}>{t('weather.waterMgmtTitle')}</h4>
                    </div>
                    <div className={styles.waterGrid}>
                        <div className={`${commonStyles.statusBadge} ${commonStyles.statusInfo} ${styles.waterBadge}`}>
                            <strong>{t('weather.evaporationLabel')}</strong> {weather?.main?.temp > 30 ? t('weather.levelHigh') : t('weather.levelModerate')} {t('weather.mulchingNote')}
                        </div>
                        <div className={`${commonStyles.statusBadge} ${commonStyles.statusSuccess} ${styles.waterBadge}`}>
                            <strong>{t('weather.sprayingLabel')}</strong> {weather?.wind?.speed < 5 ? t('weather.statusSafe') : t('weather.statusRisky')} {t('weather.windNote', { speed: weather?.wind?.speed })}
                        </div>
                        <div className={`${commonStyles.statusBadge} ${commonStyles.statusWarning} ${styles.waterBadge}`}>
                            <strong>{t('weather.dryingLabel')}</strong> {weather?.clouds?.all < 30 ? t('weather.qualityExcellent') : t('weather.qualityPoor')} {t('weather.cloudNote', { cover: weather?.clouds?.all })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Weather;
