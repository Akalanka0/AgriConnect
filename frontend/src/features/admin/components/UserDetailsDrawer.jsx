import React from 'react';
import PropTypes from 'prop-types';
import StatusBadge from './StatusBadge';

const UserDetailsDrawer = ({ isOpen, onClose, user, activeTab }) => {
    return (
        <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="drawer" onClick={(e) => e.stopPropagation()}>
                <div className="drawer-header">
                    <h3>User Details</h3>
                    <button className="close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                {user && (
                    <div className="drawer-content">
                        <div className="info-group">
                            <div className="info-label">Full Name</div>
                            <div className="info-value">{user.name}</div>
                        </div>
                        <div className="info-group">
                            <div className="info-label">Email Address</div>
                            <div className="info-value">{user.email}</div>
                        </div>
                        <div className="info-group">
                            <div className="info-label">Phone Number</div>
                            <div className="info-value">{user.phone}</div>
                        </div>
                        <div className="info-group">
                            <div className="info-label">Registration ID</div>
                            <div className="info-value">{user.id}</div>
                        </div>
                        <div className="info-group">
                            <div className="info-label">Current Status</div>
                            <StatusBadge status={user.status} />
                        </div>
                        {activeTab === 'farmers' ? (
                            <>
                                <div className="info-group">
                                    <div className="info-label">District</div>
                                    <div className="info-value">{user.district}</div>
                                </div>
                                <div className="info-group">
                                    <div className="info-label">Zone</div>
                                    <div className="info-value">{user.location}</div>
                                </div>
                                <div className="info-group">
                                    <div className="info-label">Instructor Division</div>
                                    <div className="info-value">{user.instructorDivision}</div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="info-group">
                                    <div className="info-label">District</div>
                                    <div className="info-value">{user.district}</div>
                                </div>
                                <div className="info-group">
                                    <div className="info-label">Zone</div>
                                    <div className="info-value">{user.zone}</div>
                                </div>
                                <div className="info-group">
                                    <div className="info-label">Instructor Divisions</div>
                                    <div className="info-value">
                                        <div className="division-tags-wrapper" style={{ marginTop: '5px' }}>
                                            {user.divisions && user.divisions.map((div, idx) => (
                                                <span key={idx} className="division-tag" style={{ fontSize: '0.8rem', padding: '2px 8px' }}>
                                                    {div}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDetailsDrawer;

UserDetailsDrawer.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    user: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        email: PropTypes.string,
        phone: PropTypes.string,
        status: PropTypes.string,
        district: PropTypes.string,
        location: PropTypes.string,
        zone: PropTypes.string,
        instructorDivision: PropTypes.string,
        divisions: PropTypes.arrayOf(PropTypes.string)
    }),
    activeTab: PropTypes.string.isRequired
};
