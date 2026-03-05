import React from 'react';
import PropTypes from 'prop-types';
import styles from '../styles/StatusBadge.module.css';

/**
 * Reusable Status Badge Component
 * Displays a status label with appropriate color coding
 * 
 * @param {string} status - The status text (e.g., 'active', 'pending', 'banned')
 * @param {string} type - Optional type override for styling (success, warning, danger, info)
 */
const StatusBadge = ({ status, type }) => {
    // Determine class based on status if type is not provided
    const getStatusClass = () => {
        if (type) return styles[`badge${type.charAt(0).toUpperCase() + type.slice(1)}`];

        const lowerStatus = status.toLowerCase();

        if (['active', 'verified', 'approved', 'completed', 'resolved'].includes(lowerStatus)) {
            return styles.badgeSuccess;
        }
        if (['pending', 'in_progress', 'review', 'pending review'].includes(lowerStatus)) {
            return styles.badgeWarning;
        }
        if (['banned', 'rejected', 'suspended', 'failed', 'blocked', 'using', 'correction'].includes(lowerStatus)) {
            return styles.badgeDanger;
        }
        return styles.badgeInfo;
    };

    return (
        <span className={`${styles.statusBadge} ${getStatusClass()}`}>
            {status}
        </span>
    );
};

StatusBadge.propTypes = {
    status: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'warning', 'danger', 'info'])
};

export default StatusBadge;
