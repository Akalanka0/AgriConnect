import React from 'react';
import PropTypes from 'prop-types';

const RatingsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="theme-instructor">
            <div className="instructor-modal" style={{ display: 'flex' }}>
                <div className="instructor-modal-content">
                    <div className="instructor-modal-header">
                        <h3 className="instructor-modal-title">Instructor Ratings</h3>
                        <span className="instructor-close" onClick={onClose}>&times;</span>
                    </div>
                    <div className="instructor-modal-body">
                        <p className="card-description-text">Detailed ratings and feedback from farmers will be displayed here.</p>
                        <div style={{ textAlign: 'center', padding: '20px', fontSize: '2.5rem', color: '#ffb74d' }}>
                            ★★★★☆
                            <span style={{ display: 'block', fontSize: '1rem', color: 'var(--gray)', marginTop: '10px' }}>4.7 / 5.0 Average</span>
                        </div>
                    </div>
                    <div className="instructor-modal-footer">
                        <button type="button" className="btn btn-primary" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

RatingsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

export default RatingsModal;
