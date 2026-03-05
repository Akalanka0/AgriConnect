import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/InstructorRatings.module.css';
import { getAccessToken } from '@/utils/authStorage';

const InstructorRatings = ({ instructorId }) => {
    const { t } = useTranslation('instructor');
    const [ratingsData, setRatingsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        let isMounted = true;

        const fetchRatings = async () => {
            if (!isMounted) return;
            try {
                setLoading(true);
                const token = getAccessToken();
                const response = await fetch(`/api/instructor/ratings?page=${currentPage}&limit=10`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const result = await response.json();

                if (result.success && isMounted) {
                    setRatingsData(result.data);
                    setError(null);
                } else if (isMounted) {
                    setError(result.error?.message || 'Failed to fetch ratings');
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Error fetching ratings:', error);
                    setError('Failed to fetch ratings');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchRatings();

        return () => {
            isMounted = false;
        };
    }, [instructorId, currentPage]);

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span
                key={i}
                className={`${styles.starIcon} ${i < rating ? styles.filled : ''}`}
            >
                ★
            </span>
        ));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className={styles.ratingsLoading}>
                <div className={styles.ratingsLoadingText}>{t('instructorRatings.loading')}</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.ratingsError}>
                <div className={styles.ratingsErrorText}>{error}</div>
            </div>
        );
    }

    if (!ratingsData || ratingsData.total_ratings === 0) {
        return (
            <div className={styles.ratingsEmpty}>
                <div className={styles.ratingsEmptyIcon}>⭐</div>
                <div className={styles.ratingsEmptyTitle}>{t('instructorRatings.noRatingsTitle')}</div>
                <div className={styles.ratingsEmptyDesc}>
                    {t('instructorRatings.noRatingsDesc')}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.ratingsContainer}>
            {/* Rating Summary */}
            <div className={styles.ratingsSummaryCard}>
                <div className={styles.ratingsHeader}>
                    <h4 className={styles.ratingsTitle}>
                        {t('instructorRatings.ratingsTitle')}
                    </h4>
                    <div className={styles.ratingsScoreBox}>
                        <div className={styles.ratingsAverage}>
                            {ratingsData.average_rating}
                        </div>
                        <div className={styles.ratingsTotal}>
                            {ratingsData.total_ratings} {ratingsData.total_ratings === 1 ? t('instructorRatings.ratingLabel') : t('instructorRatings.ratingsLabel')}
                        </div>
                    </div>
                </div>

                {/* Rating Distribution */}
                <div className={styles.ratingsDistribution}>
                    {Object.entries(ratingsData.rating_distribution).reverse().map(([stars, count]) => (
                        <div key={stars} className={styles.ratingsDistRow}>
                            <span className={styles.ratingsDistLabel}>
                                {stars} {parseInt(stars) === 1 ? t('instructorRatings.starLabel') : t('instructorRatings.starsLabel')}
                            </span>
                            <div className={styles.ratingsDistBarBg}>
                                <div
                                    className={styles.ratingsDistBarFill}
                                    style={{
                                        '--rating-percent': `${ratingsData.total_ratings > 0 ? (count / ratingsData.total_ratings) * 100 : 0}%`
                                    }}
                                />
                            </div>
                            <span className={styles.ratingsDistCount}>
                                {count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Individual Ratings */}
            <div>
                <h5 className={styles.ratingsListHeader}>
                    {t('instructorRatings.recentFeedback')} ({ratingsData.ratings.length} {t('instructorRatings.pageOf')} {ratingsData.total_ratings})
                </h5>

                {ratingsData.ratings.map((rating) => (
                    <div key={rating.id} className={styles.ratingItem}>
                        <div className={styles.ratingItemHeader}>
                            <div>
                                <div className={styles.ratingFarmerName}>
                                    {rating.farmer_name}
                                </div>
                                <div className={styles.ratingMeta}>
                                    {rating.farmer_district && `${rating.farmer_district}`}
                                    {rating.farmer_zone && rating.farmer_district && ` • ${rating.farmer_zone}`}
                                    {formatDate(rating.created_at)}
                                </div>
                            </div>
                            <div>
                                {renderStars(rating.rating)}
                            </div>
                        </div>

                        {rating.comments && (
                            <div className={styles.ratingCommentBox}>
                                "{rating.comments}"
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {ratingsData.total_pages > 1 && (
                <div className={styles.ratingsPagination}>
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`${styles.ratingsPageBtn} ${styles.prevBtn}`}
                    >
                        {t('instructorRatings.prevBtn')}
                    </button>

                    <span className={styles.ratingsPageInfo}>
                        {t('dataTable.page')} {currentPage} {t('instructorRatings.pageOf')} {ratingsData.total_pages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(ratingsData.total_pages, prev + 1))}
                        disabled={currentPage === ratingsData.total_pages}
                        className={`${styles.ratingsPageBtn} ${styles.nextBtn}`}
                    >
                        {t('instructorRatings.nextBtn')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default InstructorRatings;
