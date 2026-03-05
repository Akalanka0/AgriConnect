import React from 'react';
import PropTypes from 'prop-types';
import styles from '../styles/StatCard.module.css';

/**
 * Reusable Statistic Card Component
 * Displays a value, label, icon, and optional trend indicator
 */
const StatCard = ({ label, value, icon, trend, trendValue, color }) => {
    // Dynamic color class mapping
    const colorClass = color ? styles[`card${color.charAt(0).toUpperCase() + color.slice(1)}`] : '';
    
    return (
        <div className={`${styles.statCardEnhanced} ${colorClass}`}>
            <div className={styles.statContent}>
                <div className={styles.statValue}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
                
                {trend && (
                    <div className={`${styles.statTrend} ${trend === 'up' ? styles.trendUp : styles.trendDown}`}>
                        <i className={`fas fa-arrow-${trend}`}></i>
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
            <div className={styles.statIconWrapper}>
                <i className={icon}></i>
            </div>
        </div>
    );
};

StatCard.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.string.isRequired,
    trend: PropTypes.oneOf(['up', 'down']),
    trendValue: PropTypes.string,
    color: PropTypes.string
};

export default StatCard;
