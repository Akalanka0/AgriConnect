import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import styles from '../../styles/SimpleInstructorModal.module.css';
import ConfirmModal from '@/components/common/feedback/ConfirmModal';

const SimpleInstructorModal = ({ isOpen, onClose, onSubmit, onDelete, instructor, existingRating }) => {
    const { t } = useTranslation('farmer');
    const [rating, setRating] = useState(0);
    const [comments, setComments] = useState('');
    const [ratingError, setRatingError] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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
            setRatingError(t('instructorModal.ratingRequired'));
            return;
        }
        setRatingError('');
        onSubmit({ rating, comments });
        setRating(0);
        setComments('');
    };

    const handleDelete = () => {
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        onDelete();
        setIsDeleteConfirmOpen(false);
    };

    const getInitials = (name) => {
        if (!name) return 'NA';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerLeft}>
                        <i className={`fas fa-user-tie ${styles.instructorIcon}`}></i>
                        <h3 className={styles.modalTitle}>
                            {t('instructorModal.title')}
                        </h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className={styles.closeButton}
                    >
                        <i className="fas fa-xmark"></i>
                    </button>
                </div>

                {/* Content */}
                <div className={styles.modalContent}>
                    {/* Avatar Section */}
                    <div className={styles.avatarSection}>
                        <div className={`${styles.avatarContainer} ${instructor.profilePicture ? styles.hasPicture : ''}`}>
                            {instructor.profilePicture ? (
                                <img 
                                    src={instructor.profilePicture.startsWith('http') ? instructor.profilePicture : `/${instructor.profilePicture}`} 
                                    alt={instructor.name}
                                    className={styles.avatarImage}
                                />
                            ) : (
                                getInitials(instructor.name)
                            )}
                        </div>
                        <h3 className={styles.instructorName}>
                            {instructor.name}
                        </h3>
                    </div>

                    {/* Contact Information */}
                    <div className={styles.infoSection}>
                        <h4 className={styles.sectionTitle}>
                            <i className={`fas fa-address-card ${styles.sectionIcon}`}></i>
                            {t('instructorModal.contactInfo')}
                        </h4>
                        <div className={styles.infoCard}>
                            <p className={styles.infoRow}>
                                <strong>ID: </strong>
                                <span className={styles.infoValue}>{instructor.id}</span>
                            </p>
                            <p className={styles.infoRow}>
                                <strong>{t('instructorModal.emailLabel')} </strong>
                                <span className={styles.infoValue}>
                                    {instructor.email || 'N/A'}
                                </span>
                            </p>
                            <p className={styles.infoRow}>
                                <strong>{t('instructorModal.phoneLabel')} </strong>
                                <span className={styles.infoValue}>
                                    {instructor.phone || 'N/A'}
                                </span>
                            </p>
                            <p className={styles.infoRow}>
                                <strong>{t('instructorModal.zoneLabel')} </strong>
                                <span className={styles.infoValue}>
                                    {instructor.zone || 'N/A'}
                                </span>
                            </p>
                            <p className={styles.infoRow}>
                                <strong>{t('instructorModal.assignedDivisions')} </strong>
                                <span className={styles.infoValue}>
                                    {Array.isArray(instructor.assigned_divisions) && instructor.assigned_divisions.length > 0
                                        ? instructor.assigned_divisions.join(', ')
                                        : instructor.division || 'N/A'}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div className={styles.infoSection}>
                        <h4 className={styles.sectionTitle}>
                            <i className={`fas fa-briefcase ${styles.briefcaseIcon}`}></i>
                            {t('instructorModal.professionalInfo')}
                        </h4>
                        <div className={styles.infoCard}>
                            <p className={styles.infoRow}>
                                <strong>{t('instructorModal.specializationLabel')} </strong>
                                <span className={styles.infoValue}>
                                    {instructor.specialization || 'N/A'}
                                </span>
                            </p>
                            <p className={styles.infoRow}>
                                <strong>{t('instructorModal.experienceLabel')} </strong>
                                <span className={styles.infoValue}>
                                    {instructor.experience || instructor.yearsOfExperience || 'N/A'}
                                </span>
                            </p>
                            <p className={styles.infoRow}>
                                <strong>{t('instructorModal.qualificationsLabel')} </strong>
                                <span className={styles.infoValue}>
                                    {instructor.qualifications || 'N/A'}
                                </span>
                            </p>
                            <p className={styles.infoRow}>
                                <strong>{t('instructorModal.avgRatingLabel')} </strong>
                                <span className={styles.infoValue}>
                                    {(instructor.averageRating || instructor.average_rating) ? `${instructor.averageRating || instructor.average_rating}/5` : 'N/A'}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Existing Rating Display */}
                    {existingRating && (
                        <div className={styles.existingRatingCard}>
                            <h5 className={styles.existingRatingTitle}>
                                <i className={`fas fa-star ${styles.starIcon}`}></i>
                                {t('instructorModal.currentRating')}
                            </h5>
                            <div className={styles.ratingDisplay}>
                                <span className={styles.ratingLabel}>{t('instructorModal.yourRatingLabel')}</span>
                                <span className={styles.ratingStars}>
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <span
                                            key={i}
                                            className={`${styles.ratingStar} ${i < existingRating.rating ? styles.filled : ''}`}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </span>
                                <span className={styles.ratingValue}>
                                    ({existingRating.rating}/5)
                                </span>
                            </div>
                            {existingRating.comments && (
                                <div className={styles.commentSection}>
                                    <span className={styles.commentLabel}>{t('instructorModal.yourCommentLabel')}</span>
                                    <div className={styles.commentText}>
                                        "{existingRating.comments}"
                                    </div>
                                </div>
                            )}
                            <div className={styles.ratingDate}>
                                {t('instructorModal.ratedOn')} {new Date(existingRating.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    )}

                    {/* Rating Section */}
                    <div className={styles.ratingSection}>
                        <h4 className={styles.ratingTitle}>
                            <i className={`fas fa-star ${styles.starIcon}`}></i>
                            {existingRating ? t('instructorModal.updateBtn') : t('instructorModal.rateInstructor', { name: instructor.name })}
                        </h4>
                        <div className={styles.ratingStarsContainer}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    onClick={() => { setRating(star); setRatingError(''); }}
                                    className={`${styles.ratingStarButton} ${(hoverRating || rating) >= star ? styles.filled : ''}`}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        {ratingError && (
                            <p className={styles.ratingError}>
                                {ratingError}
                            </p>
                        )}
                    </div>

                    {/* Comments Section */}
                    <div className={styles.infoSection}>
                        <label className={styles.commentsLabel}>
                            <i className={`fas fa-comment ${styles.commentIcon}`}></i>
                            {t('instructorModal.commentsOptional')}
                        </label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder={t('instructorModal.shareFeedback')}
                            className={styles.commentsTextarea}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.actionButtons}>
                        <button
                            onClick={onClose}
                            className={styles.cancelButton}
                        >
                            <i className={`fas fa-xmark ${styles.buttonIcon}`}></i>
                            {t('instructorModal.cancelBtn')}
                        </button>
                        
                        {existingRating && onDelete && (
                            <button
                                onClick={handleDelete}
                                className={styles.deleteButton}
                            >
                                <i className={`fas fa-trash ${styles.buttonIcon}`}></i>
                                {t('instructorModal.deleteRatingBtn')}
                            </button>
                        )}
                        
                        <button
                            onClick={handleSubmit}
                            className={`${styles.submitButton} ${existingRating ? styles.updateMode : ''}`}
                        >
                            <i className={`fas fa-paper-plane ${styles.buttonIcon}`}></i>
                            {existingRating ? t('instructorModal.updateRatingBtn') : t('instructorModal.submitBtn')}
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={confirmDelete}
                title={t('instructorModal.deleteRatingBtn')}
                message={t('instructorModal.deleteRatingConfirmMsg')}
                confirmText={t('instructorModal.deleteRatingBtn')}
                type="danger"
            />
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
