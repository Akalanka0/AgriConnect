import React from 'react';
import PropTypes from 'prop-types';
import styles from '../styles/InstructorStatusBadge.module.css';

/**
 * Instructor Status Badge Component
 * Displays a status label with appropriate color coding, scoped to instructor theme
 * 
 * @param {string} status - The status text (e.g., 'active', 'pending', 'banned')
 * @param {string} type - Optional type override for styling (success, warning, danger, info)
 */
const InstructorStatusBadge = ({ status, type }) => {
    // Determine class based on status if type is not provided
    const getStatusClass = () => {
        if (type) return styles[`instructorBadge${type.charAt(0).toUpperCase() + type.slice(1)}`];

        const lowerStatus = status.toLowerCase();

        if (['active', 'verified', 'approved', 'completed', 'resolved'].includes(lowerStatus)) {
            return styles.instructorBadgeSuccess;
        }
        if (['pending', 'in_progress', 'review', 'pending review'].includes(lowerStatus)) {
            return styles.instructorBadgeWarning;
        }
        if (['banned', 'rejected', 'suspended', 'failed', 'blocked', 'using', 'correction'].includes(lowerStatus)) {
            return styles.instructorBadgeDanger;
        }
        return styles.instructorBadgeInfo;
    };

    return (
        <span className={`${styles.instructorStatusBadge} ${getStatusClass()}`}>
            {status}
        </span>
    );
};

InstructorStatusBadge.propTypes = {
    status: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'warning', 'danger', 'info'])
};

export default InstructorStatusBadge;
