import React, { useState } from 'react';
import PropTypes from 'prop-types';

const InstructorModal = ({ isOpen, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }
        onSubmit(rating);
        setRating(0);
    };

    return (
        <div className="modal-overlay active" onClick={(e) => e.target.className.includes('modal-overlay') && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <div className="modal-title">
                        <i className="fas fa-user-tie"></i>
                        Instructor Profile
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="modal-content">
                    <div className="instructor-avatar" style={{ margin: '0 auto 20px' }}>RS</div>
                    <h3 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--primary-dark)' }}>Rohan Silva</h3>

                    <div className="form-group">
                        <h4>Professional Information</h4>
                        <div style={{ background: 'var(--light-gray)', padding: '15px', borderRadius: 'var(--border-radius)', marginTop: '10px' }}>
                            <p><strong>Specialization:</strong> Sustainable Agriculture, Crop Management</p>
                            <p><strong>Years of Experience:</strong> 8</p>
                            <p><strong>Qualifications:</strong> B.Sc. in Agriculture, Certified Crop Advisor</p>
                            <p><strong>Average Rating:</strong> 4.2/5</p>
                        </div>
                    </div>

                    <div className="form-group">
                        <h4>Rate Rohan Silva (Your Instructor)</h4>
                        <div className="rating-stars" id="ratingStars">
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    className={`star ${rating >= star ? 'active' : ''}`}
                                    onClick={() => setRating(star)}
                                    style={{ cursor: 'pointer', fontSize: '2em', color: rating >= star ? '#ffc107' : '#ddd' }}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Comments (Optional)</label>
                        <textarea className="form-control" placeholder="Share your feedback about the instructor..." />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
                            <i className="fas fa-times"></i> Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 1 }}>
                            <i className="fas fa-paper-plane"></i> Submit Rating
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorModal;

InstructorModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};
