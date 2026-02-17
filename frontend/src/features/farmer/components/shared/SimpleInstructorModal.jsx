import React, { useState } from 'react';
import PropTypes from 'prop-types';

const SimpleInstructorModal = ({ isOpen, onClose, onSubmit, onDelete, instructor, existingRating }) => {
    const [rating, setRating] = useState(0);
    const [comments, setComments] = useState('');
    const [ratingError, setRatingError] = useState('');

    // Initialize form with existing rating if available
    React.useEffect(() => {
        if (existingRating) {
            setRating(existingRating.rating);
            setComments(existingRating.comments || '');
        } else {
            setRating(0);
            setComments('');
        }
    }, [existingRating]);

    if (!isOpen || !instructor) return null;

    const handleSubmit = () => {
        if (rating === 0) {
            setRatingError('Please select a rating before submitting.');
            return;
        }
        setRatingError('');
        onSubmit({ rating, comments });
        setRating(0);
        setComments('');
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete your rating for this instructor?')) {
            onDelete();
        }
    };

    const getInitials = (name) => {
        if (!name) return 'NA';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    background: '#f8f9fa',
                    borderBottom: '1px solid #eee',
                    borderRadius: '16px 16px 0 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-user-tie" style={{ color: '#2e7d32' }}></i>
                        <h3 style={{ margin: 0, color: '#2e7d32', fontSize: '1.25em', fontWeight: '600' }}>
                            Instructor Profile
                        </h3>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5em',
                            color: '#666',
                            cursor: 'pointer',
                            padding: '5px',
                            borderRadius: '50%',
                            transition: 'color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.color = '#dc3545'}
                        onMouseOut={(e) => e.target.style.color = '#666'}
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '30px' }}>
                    {/* Avatar Section */}
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: instructor.profilePicture ? 'transparent' : 'linear-gradient(135deg, #2e7d32, #66bb6a)',
                            backgroundImage: instructor.profilePicture ? `url(${instructor.profilePicture.startsWith('http') ? instructor.profilePicture : `/${instructor.profilePicture}`})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            margin: '0 auto 15px',
                            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
                        }}>
                            {!instructor.profilePicture && getInitials(instructor.name)}
                        </div>
                        <h3 style={{ margin: '0 0 5px 0', color: '#2e7d32', fontSize: '1.5em' }}>
                            {instructor.name}
                        </h3>
                    </div>

                    {/* Contact Information */}
                    <div style={{ marginBottom: '25px' }}>
                        <h4 style={{
                            color: '#2e7d32',
                            marginBottom: '10px',
                            fontSize: '1.1em',
                            fontWeight: '600',
                            borderBottom: '2px solid #66bb6a',
                            paddingBottom: '5px'
                        }}>
                            <i className="fas fa-address-card" style={{ marginRight: '8px' }}></i>
                            Contact Information
                        </h4>
                        <div style={{
                            background: '#f5f5f5',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0'
                        }}>
                            <p style={{ margin: '8px 0', fontSize: '0.95em' }}>
                                <strong>ID:</strong>
                                <span style={{ marginLeft: '10px', color: '#666' }}>{instructor.id}</span>
                            </p>
                            <p style={{ margin: '8px 0', fontSize: '0.95em' }}>
                                <strong>Email:</strong>
                                <span style={{ marginLeft: '10px', color: '#666' }}>
                                    {instructor.email || 'instructor@example.com'}
                                </span>
                            </p>
                            <p style={{ margin: '8px 0', fontSize: '0.95em' }}>
                                <strong>Phone:</strong>
                                <span style={{ marginLeft: '10px', color: '#666' }}>
                                    {instructor.phone || '0777123456'}
                                </span>
                            </p>
                            <p style={{ margin: '8px 0', fontSize: '0.95em' }}>
                                <strong>Division:</strong>
                                <span style={{ marginLeft: '10px', color: '#666' }}>
                                    {instructor.division || 'Shravasthipura'}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div style={{ marginBottom: '25px' }}>
                        <h4 style={{
                            color: '#2e7d32',
                            marginBottom: '10px',
                            fontSize: '1.1em',
                            fontWeight: '600',
                            borderBottom: '2px solid #66bb6a',
                            paddingBottom: '5px'
                        }}>
                            <i className="fas fa-briefcase" style={{ marginRight: '8px' }}></i>
                            Professional Information
                        </h4>
                        <div style={{
                            background: '#f5f5f5',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0'
                        }}>
                            <p style={{ margin: '8px 0', fontSize: '0.95em' }}>
                                <strong>Specialization:</strong>
                                <span style={{ marginLeft: '10px', color: '#666' }}>
                                    {instructor.specialization || 'Sustainable Agriculture, Crop Management'}
                                </span>
                            </p>
                            <p style={{ margin: '8px 0', fontSize: '0.95em' }}>
                                <strong>Years of Experience:</strong>
                                <span style={{ marginLeft: '10px', color: '#666' }}>
                                    {instructor.experience || instructor.yearsOfExperience || 8}
                                </span>
                            </p>
                            <p style={{ margin: '8px 0', fontSize: '0.95em' }}>
                                <strong>Qualifications:</strong>
                                <span style={{ marginLeft: '10px', color: '#666' }}>
                                    {instructor.qualifications || 'B.Sc. in Agriculture, Certified Crop Advisor'}
                                </span>
                            </p>
                            <p style={{ margin: '8px 0', fontSize: '0.95em' }}>
                                <strong>Average Rating:</strong>
                                <span style={{ marginLeft: '10px', color: '#666' }}>
                                    {instructor.averageRating || instructor.average_rating || 4.2}/5
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Existing Rating Display */}
                    {existingRating && (
                        <div style={{
                            background: '#e8f5e8',
                            border: '1px solid #4caf50',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '25px'
                        }}>
                            <h5 style={{
                                color: '#2e7d32',
                                marginBottom: '10px',
                                fontSize: '1em',
                                fontWeight: '600'
                            }}>
                                <i className="fas fa-star" style={{ marginRight: '8px', color: '#ffc107' }}></i>
                                Your Current Rating
                            </h5>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ marginRight: '10px', fontWeight: '500' }}>Rating:</span>
                                <span>
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <span
                                            key={i}
                                            style={{
                                                color: i < existingRating.rating ? '#ffc107' : '#ddd',
                                                fontSize: '1.2em',
                                                marginRight: '2px'
                                            }}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </span>
                                <span style={{ marginLeft: '10px', color: '#666' }}>
                                    ({existingRating.rating}/5)
                                </span>
                            </div>
                            {existingRating.comments && (
                                <div style={{ marginBottom: '8px' }}>
                                    <span style={{ fontWeight: '500' }}>Your Comment:</span>
                                    <div style={{
                                        background: 'white',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        marginTop: '5px',
                                        fontStyle: 'italic',
                                        color: '#555'
                                    }}>
                                        "{existingRating.comments}"
                                    </div>
                                </div>
                            )}
                            <div style={{ fontSize: '0.85em', color: '#666' }}>
                                Rated on: {new Date(existingRating.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    )}

                    {/* Rating Section */}
                    <div style={{ marginBottom: '25px' }}>
                        <h4 style={{
                            color: '#2e7d32',
                            marginBottom: '15px',
                            fontSize: '1.1em',
                            fontWeight: '600'
                        }}>
                            <i className="fas fa-star" style={{ marginRight: '8px', color: '#ffc107' }}></i>
                            {existingRating ? 'Update Your Rating' : `Rate ${instructor.name} (Your Instructor)`}
                        </h4>
                        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    onClick={() => { setRating(star); setRatingError(''); }}
                                    style={{
                                        cursor: 'pointer',
                                        fontSize: '2.5em',
                                        color: rating >= star ? '#ffc107' : '#ddd',
                                        margin: '0 5px',
                                        transition: 'color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (rating < star) {
                                            e.target.style.color = '#ffd700';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (rating < star) {
                                            e.target.style.color = '#ddd';
                                        }
                                    }}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        {ratingError && (
                            <p style={{
                                color: '#dc3545',
                                textAlign: 'center',
                                marginTop: '10px',
                                fontSize: '0.9em'
                            }}>
                                {ratingError}
                            </p>
                        )}
                    </div>

                    {/* Comments Section */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: '#2e7d32'
                        }}>
                            <i className="fas fa-comment" style={{ marginRight: '8px' }}></i>
                            Comments (Optional)
                        </label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Share your feedback about the instructor..."
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                marginBottom: '15px',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '0.95em',
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '12px 20px',
                                fontSize: '1em',
                                fontWeight: '500',
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#5a6268'}
                            onMouseOut={(e) => e.target.style.background = '#6c757d'}
                        >
                            <i className="fas fa-times" style={{ marginRight: '8px' }}></i>
                            Cancel
                        </button>
                        
                        {existingRating && onDelete && (
                            <button
                                onClick={handleDelete}
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    fontSize: '1em',
                                    fontWeight: '500',
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#c82333'}
                                onMouseOut={(e) => e.target.style.background = '#dc3545'}
                            >
                                <i className="fas fa-trash" style={{ marginRight: '8px' }}></i>
                                Delete Rating
                            </button>
                        )}
                        
                        <button
                            onClick={handleSubmit}
                            style={{
                                flex: existingRating ? 1 : 2,
                                padding: '12px 20px',
                                fontSize: '1em',
                                fontWeight: '500',
                                background: '#2e7d32',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#1b5e20'}
                            onMouseOut={(e) => e.target.style.background = '#2e7d32'}
                        >
                            <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i>
                            {existingRating ? 'Update Rating' : 'Submit Rating'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

SimpleInstructorModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onDelete: PropTypes.func,
    instructor: PropTypes.object,
    existingRating: PropTypes.object
};

export default SimpleInstructorModal;
