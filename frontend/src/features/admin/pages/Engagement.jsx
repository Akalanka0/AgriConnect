import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

// Portal Component for Modal
const ModalPortal = ({ children }) => {
    return ReactDOM.createPortal(children, document.body);
};

const Engagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInstructor, setSelectedInstructor] = useState(null);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [instructorEngagement, setInstructorEngagement] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalInstructors: 0,
        totalFarmers: 0,
        newRegistrations: 0,
        totalActiveUsers: 0,
        dailyActive: 0,
        registrationTrend: [],
        activityByRole: []
    });

    useEffect(() => {
        const fetchEngagementData = async () => {
            try {
                const response = await fetch('/api/admin/engagement/instructors');
                const result = await response.json();
                if (result.success) {
                    setInstructorEngagement(result.data);
                    const totalInst = result.data.length;
                    const totalFarm = result.data.reduce((acc, curr) => acc + curr.farmersCount, 0);
                    setStats(prevStats => ({ ...prevStats, totalInstructors: totalInst, totalFarmers: totalFarm }));
                }
            } catch (error) {
                console.error('Error fetching instructor engagement data:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchOverallStats = async () => {
            try {
                const response = await fetch('/api/admin/engagement');
                const result = await response.json();
                if (result.success) {
                    setStats(prevStats => ({
                        ...prevStats,
                        newRegistrations: result.data.summary.newRegistrations,
                        totalActiveUsers: result.data.summary.totalActiveUsers,
                        dailyActive: result.data.summary.dailyActive,
                        registrationTrend: result.data.trend,
                        activityByRole: result.data.distribution
                    }));
                }
            } catch (error) {
                console.error('Error fetching overall engagement stats:', error);
            }
        };

        fetchEngagementData();
        fetchOverallStats();
    }, []);



    const filteredInstructors = instructorEngagement.filter(instructor =>
        instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (instructor.displayId && instructor.displayId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        instructor.farmers.some(farmer =>
            farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (farmer.id && farmer.id.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    );

    if (loading) {
        return (
            <div className="page active" id="engagement">
                <div className="page-title">
                    <i className="fas fa-handshake"></i>
                    <h2>Instructor-Farmer Engagement</h2>
                </div>
                <div className="no-results-container">
                    <i className="fas fa-spinner fa-spin no-results-icon"></i>
                    <p>Loading engagement data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page active" id="engagement">
            <div className="page-title">
                <i className="fas fa-handshake"></i>
                <h2>Instructor-Farmer Engagement</h2>
            </div>

            {/* Centered Search Bar */}
            <div className="search-container-center">
                <div className="search-input-wrapper">
                    <i className="fas fa-search search-icon-absolute"></i>
                    <input
                        type="text"
                        placeholder="Search instructors or farmers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input-rounded"
                    />
                </div>
            </div>

            {/* Search Results Info */}
            <div className="results-info" style={{ justifyContent: 'center' }}>
                <span>Found <span className="results-count-badge">{filteredInstructors.length}</span> instructors</span>
                {searchTerm && (
                    <button
                        className="clear-filters-btn"
                        onClick={() => setSearchTerm('')}
                    >
                        Clear search
                    </button>
                )}
            </div>

            <div className="cards-grid">
                {filteredInstructors.length > 0 ? (
                    filteredInstructors.map((instructor) => (
                        <div className="card card-flex-column" key={instructor.id}>
                            <div className="card-header">
                                <div className="card-title card-header-flex">
                                    <div className="instructor-info">
                                        <span className="instructor-name">{instructor.name}</span>
                                        <span className="instructor-id">({instructor.displayId})</span>
                                    </div>
                                    <button
                                        className="btn btn-sm btn-primary btn-view-sm"
                                        onClick={() => setSelectedInstructor(instructor)}
                                    >
                                        View
                                    </button>
                                </div>
                            </div>
                            <div className="card-content card-content-flex">
                                <div className="farmers-count-wrapper">
                                    <div className="farmers-count-val">{instructor.farmersCount}</div>
                                    <div className="farmers-count-label">Farmers Assigned</div>
                                </div>

                                <div className="farmers-list-container">
                                    {instructor.farmers.map((farmer) => (
                                        <div key={farmer.id} className="farmer-list-item">
                                            <div>
                                                <div className="farmer-info-text">{farmer.name}</div>
                                                <div className="farmer-id-text">{farmer.id}</div>
                                            </div>
                                            <button
                                                className="btn-view-xs"
                                                onClick={() => setSelectedFarmer(farmer)}
                                            >
                                                View
                                            </button>
                                        </div>
                                    ))}
                                    <div className="more-farmers-text">
                                        + more farmers
                                    </div>
                                </div>

                                <button className="btn btn-primary btn-view-all">
                                    View All
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-results-container">
                        <i className="fas fa-search no-results-icon"></i>
                        <p>No instructors or farmers found matching &quot;{searchTerm}&quot;</p>
                    </div>
                )}
            </div>

            <div className="engagement-stats-container">
                <div className="engagement-card-inline">
                    <div className="engagement-stat-value">{stats.totalInstructors}</div>
                    <div className="engagement-stat-label">Total Instructors</div>
                    <div className="engagement-stat-value">{stats.totalFarmers}</div>
                    <div className="engagement-stat-label">Total Farmers</div>
                </div>
                <div className="engagement-card-inline">
                    <div className="engagement-stat-value">{stats.newRegistrations}</div>
                    <div className="engagement-stat-label">New Registrations (7 Days)</div>
                    <div className="engagement-stat-value">{stats.totalActiveUsers}</div>
                    <div className="engagement-stat-label">Total Active Users</div>
                    <div className="engagement-stat-value">{stats.dailyActive}</div>
                    <div className="engagement-stat-label">Daily Active Users (Est.)</div>
                </div>
            </div>

            {/* Instructor Details Modal */}
            {selectedInstructor && (
                <ModalPortal>
                    <div className="admin-modal active">
                        <div className="admin-modal-content modal-content-constrained">
                            <div className="admin-modal-header">
                                <div className="admin-modal-title">Instructor Details</div>
                                <button className="admin-modal-close-round" onClick={() => setSelectedInstructor(null)}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            <div className="admin-modal-body">
                                {/* Basic Info Section */}
                                <div className="instructor-profile-header">
                                    <div className="instructor-avatar-large" style={{
                                        background: selectedInstructor.avatar ? `url(${selectedInstructor.avatar}) center/cover no-repeat` : '#D2B48C'
                                    }}>
                                        {!selectedInstructor.avatar && selectedInstructor.name.charAt(0)}
                                    </div>
                                    <div className="instructor-details-wrapper">
                                        <div className="instructor-header-top">
                                            <h2 className="instructor-name-large">{selectedInstructor.name}</h2>
                                            {selectedInstructor.averageRating > 0 && (
                                                <div className="instructor-rating-badge">
                                                    <i className="fas fa-star" style={{ color: '#f59e0b' }}></i>
                                                    <span style={{ fontWeight: 'bold', color: '#b45309' }}>{selectedInstructor.averageRating}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="instructor-id" style={{ marginBottom: '15px' }}>{selectedInstructor.displayId}</div>

                                        <div className="instructor-grid-details">
                                            <div>
                                                <div className="info-label-sm">NIC Number</div>
                                                <div className="info-value-md">{selectedInstructor.nic}</div>
                                            </div>
                                            <div>
                                                <div className="info-label-sm">Phone Number</div>
                                                <div className="info-value-md">{selectedInstructor.phone}</div>
                                            </div>
                                            <div className="working-area-section">
                                                <div className="working-area-label">Working Area</div>

                                                <div className="working-area-details">
                                                    <div className="working-area-row">
                                                        <span className="working-area-key">District:</span>
                                                        <span className="working-area-val">{selectedInstructor.district}</span>
                                                    </div>

                                                    <div className="working-area-row">
                                                        <span className="working-area-key">Business Area:</span>
                                                        <span className="working-area-val">{selectedInstructor.businessArea}</span>
                                                    </div>

                                                    <div>
                                                        <div className="working-area-key" style={{ marginBottom: '6px' }}>Instructor Divisions:</div>
                                                        <div className="division-tags-wrapper">
                                                            {selectedInstructor.divisions.map((div, idx) => (
                                                                <span key={idx} className="division-tag">
                                                                    {div}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reviews Section */}
                                <div className="reviews-section">
                                    <h4 className="reviews-header">
                                        Farmer Reviews <span className="reviews-count">({selectedInstructor.reviews.length})</span>
                                    </h4>

                                    {selectedInstructor.reviews.length > 0 ? (
                                        <div className="reviews-list">
                                            {selectedInstructor.reviews.map((review) => (
                                                <div key={review.id} className="review-item">
                                                    <div className="review-header">
                                                        <span className="review-author">{review.farmer}</span>
                                                        <div className="review-stars">
                                                            {[...Array(5)].map((_, i) => (
                                                                <i key={i} className={i < review.rating ? "fas fa-star" : "far fa-star"} style={{ fontSize: '0.9rem' }}></i>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="review-text">&quot;{review.comment}&quot;</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-reviews">
                                            No reviews yet for this instructor.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* Farmer Details Modal */}
            {selectedFarmer && (
                <ModalPortal>
                    <div className="admin-modal active">
                        <div className="admin-modal-content farmer-modal-content">
                            <div className="admin-modal-header">
                                <div className="admin-modal-title">Farmer Details</div>
                                <button className="admin-modal-close-round" onClick={() => setSelectedFarmer(null)}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            <div className="admin-modal-body">
                                <div className="instructor-profile-header">
                                    <div className="instructor-avatar-large" style={{
                                        background: '#D2B48C'
                                    }}>
                                        {selectedFarmer.name.charAt(0)}
                                    </div>
                                    <div className="instructor-details-wrapper">
                                        <h2 className="instructor-name-large">{selectedFarmer.name}</h2>
                                        <div className="instructor-id" style={{ marginBottom: '15px' }}>{selectedFarmer.id}</div>

                                        <div className="instructor-grid-details">
                                            <div>
                                                <div className="info-label-sm">Phone Number</div>
                                                <div className="info-value-md">{selectedFarmer.phone}</div>
                                            </div>
                                            <div>
                                                <div className="info-label-sm">District</div>
                                                <div className="info-value-md">{selectedFarmer.district}</div>
                                            </div>
                                            <div>
                                                <div className="info-label-sm">Location</div>
                                                 <div className="info-value-md">{selectedFarmer.location}</div>
                                            </div>
                                            <div>
                                                <div className="info-label-sm">Instructor Division</div>
                                                <div className="info-value-md">{selectedFarmer.instructorDivision}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default Engagement;
