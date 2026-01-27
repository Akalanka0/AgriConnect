import React, { useState } from 'react';
import PropTypes from 'prop-types';

const InstructorModal = ({ isOpen, onClose, onSubmit, instructor }) => {
    const [rating, setRating] = useState(0);
    const [ratingError, setRatingError] = useState('');

    if (!isOpen || !instructor) return null;

    const handleSubmit = () => {
        if (rating === 0) {
            setRatingError('Please select a rating before submitting.');
            return;
        }
        setRatingError('');
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
                    <div className="instructor-avatar" style={{ margin: '0 auto 20px' }}>{instructor.name.split(' ').map(n => n[0]).join('')}</div>
                    <h3 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--primary-dark)' }}>{instructor.name}</h3>

                    <div className="form-group">
                        <h4>Contact Information</h4>
                        <div style={{ background: 'var(--neutral-100)', padding: '15px', borderRadius: 'var(--border-radius)', marginTop: '10px' }}>
                            <p><strong>ID:</strong> {instructor.id}</p>
                            <p><strong>Email:</strong> {instructor.email}</p>
                            <p><strong>Phone:</strong> {instructor.phone}</p>
                            <p><strong>Division:</strong> {instructor.division}</p>
                        </div>
                    </div>

                    <div className="form-group">
                        <h4>Professional Information</h4>
                        <div style={{ background: 'var(--neutral-100)', padding: '15px', borderRadius: 'var(--border-radius)', marginTop: '10px' }}>
                            <p><strong>Specialization:</strong> {instructor.specialization}</p>
                            <p><strong>Years of Experience:</strong> {instructor.yearsOfExperience}</p>
                            <p><strong>Qualifications:</strong> {instructor.qualifications}</p>
                            <p><strong>Average Rating:</strong> {instructor.averageRating}/5</p>
                        </div>
                    </div>

                    <div className="form-group">
                        <h4>Rate {instructor.name} (Your Instructor)</h4>
                        <div className="rating-stars" id="ratingStars">
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    className={`star ${rating >= star ? 'active' : ''}`}
                                    onClick={() => { setRating(star); setRatingError(''); }}
                                    style={{ cursor: 'pointer', fontSize: '2em', color: rating >= star ? '#ffc107' : '#ddd' }}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        {ratingError && <p style={{ color: 'var(--danger)', textAlign: 'center', marginTop: '10px' }}>{ratingError}</p>}
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
    onSubmit: PropTypes.func.isRequired,
    instructor: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        phone: PropTypes.string.isRequired,
        division: PropTypes.string.isRequired,
        specialization: PropTypes.string.isRequired,
        yearsOfExperience: PropTypes.number.isRequired,
        qualifications: PropTypes.string.isRequired,
        averageRating: PropTypes.number.isRequired,
    })
};
