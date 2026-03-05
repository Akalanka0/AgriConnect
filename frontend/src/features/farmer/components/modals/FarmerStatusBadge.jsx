import React from 'react';
import PropTypes from 'prop-types';
import commonStyles from '../../styles/FarmerCommon.module.css';

const FarmerStatusBadge = ({ status, type }) => {
  const getStatusClass = () => {
    if (type) {
      if (type === 'success') return commonStyles.statusSuccess;
      if (type === 'warning') return commonStyles.statusWarning;
      if (type === 'danger') return commonStyles.statusDanger;
      if (type === 'info') return commonStyles.statusInfo;
    }

    const lower = (status || '').toLowerCase();
    if (['active', 'verified', 'approved', 'completed', 'resolved'].includes(lower)) return commonStyles.statusSuccess;
    if (['pending', 'in_progress', 'review', 'pending review'].includes(lower)) return commonStyles.statusWarning;
    if (['banned', 'rejected', 'suspended', 'failed', 'blocked', 'using', 'correction'].includes(lower)) return commonStyles.statusDanger;
    return commonStyles.statusInfo;
  };

  return <span className={`${commonStyles.statusBadge} ${getStatusClass()}`}>{status}</span>;
};

FarmerStatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'warning', 'danger', 'info'])
};

export default FarmerStatusBadge;
