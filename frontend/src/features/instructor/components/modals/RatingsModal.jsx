import React from 'react';
import PropTypes from 'prop-types';

const RatingsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal" style={{ display: 'flex' }}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Instructor Ratings</h3>
                    <span className="close" onClick={onClose}>&times;</span>
                </div>
                <div className="modal-body">
                    <p>Detailed ratings and feedback from farmers will be displayed here.</p>
                    <div style={{ textAlign: 'center', padding: '20px', fontSize: '2em', color: '#ffb74d' }}>
                        ★★★★☆
                        <span style={{ display: 'block', fontSize: '0.5em', color: '#666' }}>4.7 / 5.0 Average</span>
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-primary" onClick={onClose}>Close</button>
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
