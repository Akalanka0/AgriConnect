import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../styles/InstructorHome.module.css';
import commonStyles from '../styles/InstructorCommon.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import { getAccessToken } from '@/utils/authStorage';

const InstructorHome = () => {
    const { openModal } = useOutletContext();
    const { t } = useTranslation('instructor');

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
                const token = getAccessToken();
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
            '04d': { icon: 'fa-cloud', color: '#78909c' },
            '04n': { icon: 'fa-cloud', color: '#78909c' },
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
            <div className={styles.pageTitle}>
                <i className="fas fa-home"></i>
                <h2>{t('home.title')}</h2>
            </div>

            <div className={commonStyles.dashboardStats}>
                <div className={commonStyles.statCard}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={`${commonCardStyles.cardTitle} ${commonStyles.statValue}`}>{stats.assignedFarmers}</div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={commonStyles.statLabel}>{t('home.assignedFarmers')}</div>
                    </div>
                </div>
                <div className={commonStyles.statCard}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={`${commonCardStyles.cardTitle} ${commonStyles.statValue}`}>{t('home.pendingTasks')}</div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={styles.pendingTasks}>
                            <div className={styles.pendingTaskItem}>
                                <div className={styles.pendingTaskValue}>{stats.pendingTasks.crop}</div>
                                <div className={styles.pendingTaskLabel}>{t('home.cropPlans')}</div>
                            </div>
                            <div className={styles.pendingTaskItem}>
                                <div className={styles.pendingTaskValue}>{stats.pendingTasks.pest}</div>
                                <div className={styles.pendingTaskLabel}>{t('home.pestIssues')}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={commonStyles.statCard}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={`${commonCardStyles.cardTitle} ${commonStyles.statValue}`}>{stats.upcomingMeetings}</div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={commonStyles.statLabel}>{t('home.upcomingMeetings')}</div>
                    </div>
                </div>
                <div className={`${commonStyles.statCard} ${styles.statsCard}`} onClick={() => openModal('ratings')}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={`${commonCardStyles.cardTitle} ${commonStyles.statValue}`}>{stats.averageRating}</div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={commonStyles.statLabel}>{t('home.averageRating')}</div>
                        <div className={styles.statsButton}>
                            <i className="fas fa-arrow-right"></i> {t('home.clickHere')}
                        </div>
                    </div>
                </div>
            </div>

            <div className={commonStyles.cardsGrid}>
                {/* Recent History Card */}
                <div className={`${commonCardStyles.card} ${commonCardStyles.cardBorderTop}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('home.recentHistory')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-clock-rotate-left"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <ul className={`${commonStyles.cardList} ${commonStyles.activitiesList}`}>
                            {history.length > 0 ? (
                                history.map((item, index) => (
                                    <li key={index}>
                                        <div className={commonStyles.activityContent}>
                                            <div className={commonStyles.activityText}>{item.action}</div>
                                            <div className={commonStyles.activityTime}>{item.date}</div>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className={styles.historyEmpty}>
                                    {t('home.noActivities')}
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Weather Information Card */}
                <div className={`${commonCardStyles.card} ${commonCardStyles.cardBorderTop} ${styles.weatherCard}`} onClick={() => openModal('weather')}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('home.weatherInfo')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-cloud-sun"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={styles.weatherCardContainer}>
                            <div className={styles.locationName}>Anuradhapura</div>
                            <div className={styles.weatherIconSmall}>
                                <i className={`fas ${weatherUI.icon}`} style={{ color: weatherUI.color }}></i>
                            </div>
                            <div className={styles.weatherTempLarge}>
                                {weatherSummary.temp}°C
                            </div>
                            <div className={styles.weatherStatusText}>{weatherSummary.status}</div>
                        </div>
                        <div className={styles.weatherButtonContainer}>
                            <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary} ${commonBtnStyles.btnSm} ${styles.weatherButton}`} onClick={() => openModal('weather')}>
                                <i className={`fas fa-up-right-and-down-left-from-center ${styles.weatherButtonIcon}`}></i> {t('home.viewDetails')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Send Message Card */}
                <div className={`${commonCardStyles.card} ${commonCardStyles.cardBorderTop} ${styles.messageCard}`} onClick={() => openModal('sendMessage')}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('home.sendMsgToFarmers')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-message"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={styles.messageContent}>
                            <div className={styles.messageIcon}>
                                <i className="fas fa-paper-plane"></i>
                            </div>
                            <div className={styles.messageTitle}>{t('home.sendMessage')}</div>
                            <div className={styles.messageDescription}>
                                {t('home.sendMsgDesc')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InstructorHome;
