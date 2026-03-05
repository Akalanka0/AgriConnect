import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import styles from '../../styles/InstructorWeatherModal.module.css';
import modalStyles from '../../styles/InstructorModals.module.css';
import commonStyles from '../../styles/InstructorCommon.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import commonCardStyles from '@/components/common/styles/Card.module.css';

const InstructorWeatherModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation('instructor');
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
                setLocationName(city || weatherData.name);

                const { lat: cityLat, lon: cityLon } = weatherData.coord;
                const forecastRes = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?lat=${cityLat}&lon=${cityLon}&appid=${API_KEY}&units=metric`
                );
                const forecastData = await forecastRes.json();

                if (forecastRes.ok) {
                    const dailyForecast = forecastData.list.filter(item => item.dt_txt.includes('12:00:00'));
                    setForecast(dailyForecast.slice(0, 5)); // 5-day forecast
                } else {
                    setError('Failed to fetch forecast data');
                }
            } else {
                setError('Weather data not found for this location');
            }
        } catch (error) {
            console.error('Error fetching weather:', error);
            setError('Failed to fetch weather data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather(8.3114, 80.4037, 'Anuradhapura');
    }, []);

    const getWeatherIcon = (iconCode) => {
        const iconMap = {
            '01d': 'fa-sun', '01n': 'fa-moon',
            '02d': 'fa-cloud-sun', '02n': 'fa-cloud-moon',
            '03d': 'fa-cloud', '03n': 'fa-cloud',
            '04d': 'fa-cloud', '04n': 'fa-cloud',
            '09d': 'fa-cloud-showers-heavy', '09n': 'fa-cloud-showers-heavy',
            '10d': 'fa-cloud-sun-rain', '10n': 'fa-cloud-moon-rain',
            '11d': 'fa-bolt', '11n': 'fa-bolt',
            '13d': 'fa-snowflake', '13n': 'fa-snowflake',
            '50d': 'fa-smog', '50n': 'fa-smog',
        };
        return iconMap[iconCode] || 'fa-cloud';
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className={modalStyles.instructorModalFlex}
            onClick={onClose}
        >
            <div className={`${modalStyles.instructorModalContent} ${styles.modalContent} ${styles.weatherModalContent} ${commonStyles.customScrollbar}`} onClick={e => e.stopPropagation()}>
                <div className={`${modalStyles.instructorModalBody} ${commonStyles.customScrollbar}`}>
                    {loading && (
                        <div className={styles.loadingContainer}>
                            <i className="fas fa-spinner fa-spin"></i>
                            <p className={styles.loadingText}>{t('weather.loading')}</p>
                        </div>
                    )}

                    {error && (
                        <div className={styles.errorContainer}>
                            <i className={`fas fa-triangle-exclamation ${styles.errorIcon}`}></i>
                            <p className={styles.errorText}>{error}</p>
                            <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} onClick={() => fetchWeather(8.3114, 80.4037, 'Anuradhapura')}>
                                {t('weather.retry')}
                            </button>
                        </div>
                    )}

                    {!loading && !error && weather && (
                        <div className={`${styles.mainPage}`}>
                            <div className={`${styles.pageTitle}`}>
                                <div className={styles.titleSection}>
                                    <div className={styles.timeDisplay}>
                                        <div className={styles.currentTime}>
                                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className={styles.currentDate}>
                                            {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div className={styles.titleLeft}>
                                        <i className="fas fa-cloud-sun"></i>
                                        <h2>{t('weather.title')}</h2>
                                    </div>
                                </div>
                                <button className={styles.weatherCloseButton} onClick={onClose}>
                                    <i className="fas fa-xmark"></i>
                                </button>
                            </div>

                            <div className={styles.locationSection}>
                                <select
                                    className={`form-control ${styles.locationSelect}`}
                                    value={locationName}
                                    onChange={(e) => fetchWeather(null, null, e.target.value)}
                                >
                                    {commonAreas.map(area => (
                                        <option key={area} value={area}>{area}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-4">
                                    <div className={styles.weatherCardHeader}>
                                        <div className={styles.locationInfo}>
                                            <div className={styles.locationName}>{locationName}</div>
                                            <div className={styles.weatherCoords}>
                                                {t('weather.lat')} {weather.coord.lat.toFixed(2)}, {t('weather.lon')} {weather.coord.lon.toFixed(2)}
                                            </div>
                                            <div className={styles.lastUpdated}>
                                                {t('weather.lastUpdated')}<br />
                                                {new Date(weather.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div className="weather-icon">
                                            <i className={`fas ${getWeatherIcon(weather.weather[0].icon)}`}></i>
                                        </div>
                                        <div className={styles.temperature}>
                                            <div className={styles.currentTemperature}>{Math.round(weather.main.temp)}°C</div>
                                            <div className={styles.temperatureRange}>
                                                <i className={`fas fa-arrow-up ${styles.tempUpIcon}`}></i>
                                                {Math.round(weather.main.temp_max)}° /
                                                <i className={`fas fa-arrow-down ${styles.tempDownIcon}`}></i>
                                                {Math.round(weather.main.temp_min)}°
                                            </div>
                                        </div>
                                        <div className={styles.weatherDescription}>
                                            {weather.weather[0].description}
                                        </div>

                                        <div className={styles.weatherDetails}>
                                            <div className={styles.weatherDetail}>
                                                <i className="fas fa-wind"></i>
                                                <div className={styles.detailLabel}>{t('weather.wind')}</div>
                                                <div>{weather.wind.speed} m/s</div>
                                            </div>
                                            <div className={styles.weatherDetail}>
                                                <i className="fas fa-cloud-showers-heavy"></i>
                                                <div className={styles.detailLabel}>{t('weather.rain1h')}</div>
                                                <div>{weather.rain?.['1h'] || 0} mm</div>
                                            </div>
                                            <div className={styles.weatherDetail}>
                                                <i className="fas fa-droplet"></i>
                                                <div className={styles.detailLabel}>{t('weather.humidity')}</div>
                                                <div>{weather.main.humidity}%</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className={`${commonCardStyles.card} ${commonCardStyles.cardBorderTop} ${styles.sunMoonCard}`}>
                                        <div className={commonCardStyles.cardHeader}>
                                            <div className={commonCardStyles.cardTitle}>{t('weather.dayNightDetails')}</div>
                                            <div className={commonCardStyles.cardIcon}><i className="fas fa-circle-half-stroke"></i></div>
                                        </div>
                                        <div className={commonCardStyles.cardContent}>
                                            <div className={styles.sunMoonGrid}>
                                                <div className={styles.sunMoonItem}>
                                                    <i className={`fas fa-sun ${styles.sunIcon}`}></i>
                                                    <div className={styles.sunMoonLabel}>{t('weather.sunrise')}</div>
                                                    <div className={styles.sunMoonTime}>{formatTime(weather.sys.sunrise)}</div>
                                                </div>
                                                <div className={styles.sunMoonItem}>
                                                    <i className={`fas fa-moon ${styles.moonIcon}`}></i>
                                                    <div className={styles.sunMoonLabel}>{t('weather.sunset')}</div>
                                                    <div className={styles.sunMoonTime}>{formatTime(weather.sys.sunset)}</div>
                                                </div>
                                                <div className={styles.nextEvent}>
                                                    <div className={styles.nextEventText}>
                                                        {weather.dt < weather.sys.sunset && weather.dt > weather.sys.sunrise ? (
                                                            <>{t('weather.nextLabel')} <strong className={styles.nextEventStrong}>{t('weather.sunset')}</strong> at {formatTime(weather.sys.sunset)}</>
                                                        ) : (
                                                            <>{t('weather.nextLabel')} <strong className={styles.nextEventStrong}>{t('weather.sunrise')}</strong> at {formatTime(weather.sys.sunrise)}</>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={styles.sunMoonItem}>
                                                    <i className={`fas fa-temperature-half ${styles.thermoIcon}`}></i>
                                                    <div className={styles.sunMoonLabel}>{t('weather.feelsLike')}</div>
                                                    <div className={styles.sunMoonTime}>{Math.round(weather.main.feels_like)}°C</div>
                                                </div>
                                                <div className={styles.sunMoonItem}>
                                                    <i className={`fas fa-cloud-rain ${styles.precipIcon}`}></i>
                                                    <div className={styles.sunMoonLabel}>{t('weather.precipitation')}</div>
                                                    <div className={styles.sunMoonTime}>{weather.rain ? 'Yes' : 'None'}</div>
                                                </div>
                                                <div className={styles.sunMoonItem}>
                                                    <i className={`fas fa-cloud ${styles.cloudIcon}`}></i>
                                                    <div className={styles.sunMoonLabel}>{t('weather.cloudCover')}</div>
                                                    <div className={styles.sunMoonTime}>{weather.clouds.all}%</div>
                                                </div>
                                                <div className={styles.sunMoonItem}>
                                                    <i className={`fas fa-droplet ${styles.dewIcon}`}></i>
                                                    <div className={styles.sunMoonLabel}>{t('weather.dewPoint')}</div>
                                                    <div className={styles.sunMoonTime}>{Math.round(weather.main.temp - ((100 - weather.main.humidity) / 5))}°C</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className={`${commonCardStyles.card} ${commonCardStyles.cardBorderTop} ${styles.forecastCard}`}>
                                        <div className={commonCardStyles.cardHeader}>
                                            <div className={commonCardStyles.cardTitle}>{t('weather.fiveDayForecast')}</div>
                                            <div className={commonCardStyles.cardIcon}><i className="fas fa-calendar-days"></i></div>
                                        </div>
                                        <div className={commonCardStyles.cardContent}>
                                            <ul className="list-unstyled mb-0">
                                                {forecast.map((day, index) => (
                                                    <li key={index} className={styles.forecastItem}>
                                                        <div className={styles.forecastDate}>{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                                                        <div className={styles.forecastDayContainer}>
                                                            <div className={styles.forecastIconContainer}>
                                                                <i className={`fas ${getWeatherIcon(day.weather[0].icon)} ${styles.forecastIcon}`}></i>
                                                                {day.pop > 0 && (
                                                                    <span className={styles.forecastPop}>
                                                                        {Math.round(day.pop * 100)}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className={styles.forecastTemp}>{Math.round(day.main.temp)}°C</span>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`alert alert-info mt-4 ${styles.advisoryCard}`}>
                                <div className={styles.advisorySection}>
                                    <div className={styles.advisoryHeader}>
                                        <i className={`fas fa-seedling ${styles.advisoryIcon}`}></i>
                                        <h4 className={styles.advisoryTitle}>{t('weather.smartAdvisoryTitle')} {locationName}</h4>
                                    </div>
                                    <p className={styles.advisoryText}>
                                        {weather?.main.temp > 32 ?
                                            t('weather.heatAlert') :
                                            weather?.weather[0]?.main === 'Rain' ?
                                                t('weather.rainConditions') :
                                                weather?.main.temp < 20 ?
                                                    t('weather.coolConditions') :
                                                    t('weather.moderateConditions')
                                        }
                                    </p>
                                </div>

                                <div className={styles.pestSection}>
                                    <div className={styles.advisoryHeader}>
                                        <i className={`fas fa-bug ${styles.pestIcon}`}></i>
                                        <h4 className={styles.pestTitle}>{t('weather.pestRiskTitle')}</h4>
                                    </div>
                                    <p className={styles.advisoryText}>
                                        {weather?.main.humidity > 80 ?
                                            t('weather.highHumidityRisk') :
                                            weather?.main.temp > 30 && weather?.main.humidity < 50 ?
                                                t('weather.hotDryRisk') :
                                                t('weather.moderatePestRisk')
                                        }
                                    </p>
                                </div>

                                <div className={styles.waterSection}>
                                    <div className={styles.advisoryHeader}>
                                        <i className={`fas fa-water ${styles.waterIcon}`}></i>
                                        <h4 className={styles.waterTitle}>{t('weather.soilWaterTitle')}</h4>
                                    </div>
                                    <div className={styles.waterGrid}>
                                        <div className={`badge bg-info ${styles.evaporationBadge}`}>
                                            <strong>{t('weather.evaporation')}</strong> {weather?.main.temp > 30 ? t('weather.evaporationHigh') : t('weather.evaporationModerate')} - {t('weather.mulchingRecommended')}
                                        </div>
                                        <div className={`badge bg-success ${styles.sprayingBadge}`}>
                                            <strong>{t('weather.spraying')}</strong> {weather?.wind?.speed < 5 ? t('weather.sprayingSafe') : t('weather.sprayingRisky')} - {t('weather.windSpeed', { speed: weather?.wind?.speed })}
                                        </div>
                                        <div className={`badge bg-warning ${styles.dryingBadge}`}>
                                            <strong>{t('weather.drying')}</strong> {weather?.clouds?.all < 30 ? t('weather.dryingExcellent') : t('weather.dryingPoor')} - {t('weather.cloudCoverPct', { pct: weather?.clouds?.all })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default InstructorWeatherModal;
