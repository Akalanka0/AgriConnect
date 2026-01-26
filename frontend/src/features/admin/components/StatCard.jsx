import React from 'react';
import PropTypes from 'prop-types';
import '../styles/StatCard.css';

/**
 * Reusable Statistic Card Component
 * Displays a value, label, icon, and optional trend indicator
 */
const StatCard = ({ label, value, icon, trend, trendValue, color }) => {
    return (
        <div className={`stat-card-enhanced ${color ? `card-${color}` : ''}`}>
            <div className="stat-content">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
                
                {trend && (
                    <div className={`stat-trend ${trend === 'up' ? 'trend-up' : 'trend-down'}`}>
                        <i className={`fas fa-arrow-${trend}`}></i>
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
            <div className="stat-icon-wrapper">
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
