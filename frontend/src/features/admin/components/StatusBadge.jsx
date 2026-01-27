import React from 'react';
import PropTypes from 'prop-types';
import '../styles/StatusBadge.css';

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
        if (type) return `badge-${type}`;
        
        const lowerStatus = status.toLowerCase();
        
        if (['active', 'verified', 'approved', 'completed'].includes(lowerStatus)) {
            return 'badge-success';
        }
        if (['pending', 'in_progress', 'review'].includes(lowerStatus)) {
            return 'badge-warning';
        }
        if (['banned', 'rejected', 'suspended', 'failed', 'blocked', 'using'].includes(lowerStatus)) {
            return 'badge-danger';
        }
        return 'badge-info';
    };

    return (
        <span className={`status-badge ${getStatusClass()}`}>
            {status}
        </span>
    );
};

StatusBadge.propTypes = {
    status: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'warning', 'danger', 'info'])
};

export default StatusBadge;
