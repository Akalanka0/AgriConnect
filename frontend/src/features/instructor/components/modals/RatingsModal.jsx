import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { instructorAPI } from '../../../../services/instructorService.js';
import styles from '../../styles/InstructorModals.module.css';
import commonStyles from '../../styles/InstructorCommon.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';

const RatingsModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation('instructor');
    const [ratings, setRatings] = useState([]);
    const [stats, setStats] = useState({
        total_ratings: 0,
        average_rating: 0,
        rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const ratingsPerPage = 10;

    useEffect(() => {
        if (isOpen) {
            fetchRatings();
        }
    }, [isOpen, currentPage]);

    const fetchRatings = async () => {
        try {
            setLoading(true);
            setError('');

            const params = {
                page: currentPage,
                limit: ratingsPerPage
            };

            const response = await instructorAPI.getRatings(params);

            if (response.success) {
                setRatings(response.data.ratings || []);
                setStats({
                    total_ratings: response.data.total_ratings || 0,
                    average_rating: response.data.average_rating || 0,
                    rating_distribution: response.data.rating_distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                });
                setTotalPages(response.data.total_pages || 1);
            } else {
                setError(response.error?.message || 'Failed to fetch ratings');
            }
        } catch (error) {
            console.error('Error fetching ratings:', error);
            setError('Failed to load ratings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<span key={i} className={`${styles.star} filled`}>★</span>);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<span key={i} className={`${styles.star} half`}>★</span>);
            } else {
                stars.push(<span key={i} className={`${styles.star} ${styles.empty}`}>☆</span>);
            }
        }
        return stars;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        return (
            <div className={styles.ratingsPagination}>
                <button
                    className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnSecondary}`}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                >
                    <i className="fas fa-chevron-left"></i> Previous
                </button>
                <span className={styles.paginationInfo}>
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnSecondary}`}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                >
                    Next <i className="fas fa-chevron-right"></i>
                </button>
            </div>
        );
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className={styles.instructorModalFlex}
            onClick={onClose}
        >
            <div className={`${styles.instructorModalContent} ${styles.ratingsModalContent} ${commonStyles.customScrollbar}`} onClick={e => e.stopPropagation()}>
                <div className={styles.instructorModalHeader}>
                    <h3 className={styles.instructorModalTitle}>{t('ratings.title')}</h3>
                    <span className={styles.instructorClose} onClick={onClose}><i className="fas fa-xmark"></i></span>
                </div>
                <div className={`${styles.instructorModalBody} ${commonStyles.customScrollbar}`}>
                    {loading ? (
                        <div className="text-center p-4">
                            <i className="fas fa-spinner fa-spin"></i> Loading ratings...
                        </div>
                    ) : error ? (
                        <div className="alert alert-danger">
                            <i className="fas fa-exclamation-triangle"></i> {error}
                            <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSmall} ${commonBtnStyles.btnPrimary} d-block mt-2`} onClick={fetchRatings}>
                                Retry
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Rating Summary */}
                            <div className={styles.ratingsSummary}>
                                <div className={styles.ratingsOverview}>
                                    <div className={styles.ratingsAverage}>
                                        <div className={styles.ratingsScore}>
                                            <div>{renderStars(stats.average_rating)}</div>
                                            <span className={styles.ratingsNumber}>{stats.average_rating.toFixed(1)}</span>
                                        </div>
                                        <div className={styles.ratingsSubtitle}>
                                            {stats.total_ratings} {stats.total_ratings === 1 ? 'Rating' : 'Ratings'}
                                        </div>
                                    </div>

                                    {/* Rating Distribution */}
                                    <div className={styles.ratingsDistribution}>
                                        <h4>{t('ratings.distribution')}</h4>
                                        {[5, 4, 3, 2, 1].map(star => (
                                            <div key={star} className={styles.distributionRow}>
                                                <span className={styles.distributionLabel}>
                                                    {star} {star === 1 ? 'star' : 'stars'}
                                                </span>
                                                <div className={styles.distributionBar}>
                                                    <div
                                                        className={styles.distributionFill}
                                                        style={{
                                                            width: `${stats.total_ratings > 0 ? (stats.rating_distribution[star] / stats.total_ratings) * 100 : 0}%`
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className={styles.distributionCount}>
                                                    {stats.rating_distribution[star]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Individual Ratings */}
                            <div className={styles.ratingsList}>
                                <h4>{t('ratings.individualFeedback')}</h4>
                                {ratings.length === 0 ? (
                                    <div className={styles.noRatings}>
                                        <i className="fas fa-star"></i>
                                        <p>{t('ratings.noRatings')}</p>
                                    </div>
                                ) : (
                                    <div className={styles.ratingsItems}>
                                        {ratings.map((rating) => (
                                            <div key={rating.id} className={styles.ratingItem}>
                                                <div className={styles.ratingHeader}>
                                                    <div className={styles.ratingFarmer}>
                                                        <strong>{rating.farmer_name}</strong>
                                                    </div>
                                                    <div className={styles.ratingDate}>
                                                        {formatDate(rating.created_at)}
                                                    </div>
                                                </div>
                                                <div className={styles.ratingStars}>
                                                    {renderStars(rating.rating)}
                                                    <span className={styles.ratingNumber}>{rating.rating}/5</span>
                                                </div>
                                                {rating.comments && (
                                                    <div className={styles.ratingComments}>
                                                        "{rating.comments}"
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {renderPagination()}
                        </>
                    )}
                </div>
                <div className={styles.instructorModalFooter}>
                    <button type="button" className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} onClick={onClose}>Close</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

RatingsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

export default RatingsModal;
