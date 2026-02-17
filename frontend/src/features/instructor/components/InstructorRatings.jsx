import React, { useState, useEffect } from 'react';

const InstructorRatings = ({ instructorId }) => {
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
                const token = localStorage.getItem('token');
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
                style={{
                    color: i < rating ? '#ffc107' : '#ddd',
                    fontSize: '1.2em',
                    marginRight: '2px'
                }}
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
            <div style={{ textAlign: 'center', padding: '30px' }}>
                <div style={{ color: '#666' }}>Loading ratings...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '30px' }}>
                <div style={{ color: '#dc3545' }}>{error}</div>
            </div>
        );
    }

    if (!ratingsData || ratingsData.total_ratings === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                <div style={{ fontSize: '3em', marginBottom: '10px' }}>⭐</div>
                <div style={{ fontSize: '1.1em', marginBottom: '5px' }}>No ratings yet</div>
                <div style={{ fontSize: '0.9em' }}>
                    Detailed ratings and feedback from farmers will be displayed here.
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            {/* Rating Summary */}
            <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '25px',
                border: '1px solid #e0e0e0'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{ margin: 0, color: '#2e7d32', fontSize: '1.2em' }}>
                        Instructor Ratings
                    </h4>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#2e7d32' }}>
                            {ratingsData.average_rating}
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>
                            {ratingsData.total_ratings} {ratingsData.total_ratings === 1 ? 'Rating' : 'Ratings'}
                        </div>
                    </div>
                </div>

                {/* Rating Distribution */}
                <div style={{ marginBottom: '15px' }}>
                    {Object.entries(ratingsData.rating_distribution).reverse().map(([stars, count]) => (
                        <div key={stars} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                            <span style={{ width: '60px', fontSize: '0.9em' }}>
                                {stars} {parseInt(stars) === 1 ? 'star' : 'stars'}
                            </span>
                            <div style={{
                                flex: 1,
                                height: '8px',
                                background: '#e0e0e0',
                                borderRadius: '4px',
                                margin: '0 10px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${ratingsData.total_ratings > 0 ? (count / ratingsData.total_ratings) * 100 : 0}%`,
                                    height: '100%',
                                    background: '#ffc107',
                                    borderRadius: '4px'
                                }} />
                            </div>
                            <span style={{ width: '30px', textAlign: 'right', fontSize: '0.9em' }}>
                                {count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Individual Ratings */}
            <div>
                <h5 style={{ marginBottom: '15px', color: '#2e7d32' }}>
                    Recent Feedback ({ratingsData.ratings.length} of {ratingsData.total_ratings})
                </h5>
                
                {ratingsData.ratings.map((rating) => (
                    <div key={rating.id} style={{
                        background: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '15px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div>
                                <div style={{ fontWeight: '600', color: '#333', marginBottom: '3px' }}>
                                    {rating.farmer_name}
                                </div>
                                <div style={{ fontSize: '0.85em', color: '#666' }}>
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
                            <div style={{
                                background: '#f8f9fa',
                                padding: '10px',
                                borderRadius: '6px',
                                fontSize: '0.95em',
                                color: '#555',
                                fontStyle: 'italic'
                            }}>
                                "{rating.comments}"
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {ratingsData.total_pages > 1 && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        style={{
                            padding: '8px 16px',
                            marginRight: '10px',
                            background: currentPage === 1 ? '#e0e0e0' : '#2e7d32',
                            color: currentPage === 1 ? '#999' : 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Previous
                    </button>
                    
                    <span style={{ margin: '0 15px', color: '#666' }}>
                        Page {currentPage} of {ratingsData.total_pages}
                    </span>
                    
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(ratingsData.total_pages, prev + 1))}
                        disabled={currentPage === ratingsData.total_pages}
                        style={{
                            padding: '8px 16px',
                            marginLeft: '10px',
                            background: currentPage === ratingsData.total_pages ? '#e0e0e0' : '#2e7d32',
                            color: currentPage === ratingsData.total_pages ? '#999' : 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: currentPage === ratingsData.total_pages ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default InstructorRatings;
