import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import MessageModal from '../components/shared/MessageModal';
import SimpleInstructorModal from '../components/shared/SimpleInstructorModal';

const FarmerHome = () => {
    const { showToast } = useOutletContext();
    const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [selectedInstructor, setSelectedInstructor] = useState(null);

    // State for backend data
    const [stats, setStats] = useState({ activeCrops: 0, plansSubmitted: 0, pestIssues: 0 });
    const [recentHistory, setRecentHistory] = useState([]);
    const [availableInstructors, setAvailableInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRatings, setUserRatings] = useState({}); // Store user's existing ratings

    // Fetch user's existing ratings
    const fetchUserRatings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/farmer/my-ratings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    const ratingsMap = {};
                    result.data.forEach(rating => {
                        ratingsMap[rating.instructor_id] = rating;
                    });
                    setUserRatings(ratingsMap);
                }
            }
        } catch (error) {
            console.error('Error fetching user ratings:', error);
        }
    };

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');

                // Fetch stats
                const statsRes = await fetch('/api/farmer/dashboard/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const statsData = await statsRes.json();
                if (statsRes.ok && statsData.success) {
                    setStats(statsData.data);
                }

                // Fetch recent history
                const historyRes = await fetch('/api/farmer/dashboard/history', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const historyData = await historyRes.json();
                if (historyRes.ok && historyData.success) {
                    setRecentHistory(historyData.data);
                }


                // Fetch farmer profile to get assigned instructor IDs
                const profileRes = await fetch('/api/farmer/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const profileData = await profileRes.json();

                // Fetch all instructors to get full details (email, phone, etc.)
                const instructorsRes = await fetch('/api/farmer/instructors', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const instructorsData = await instructorsRes.json();

                if (profileRes.ok && profileData.success) {
                    let locations = profileData.data.locations;

                    // Handle potential string JSON from database
                    if (typeof locations === 'string') {
                        try {
                            locations = JSON.parse(locations);
                        } catch (e) {
                            console.error('❌ [Home] Failed to parse locations string:', e);
                            locations = [];
                        }
                    }

                    if (!Array.isArray(locations)) {
                        console.warn('⚠️ [Home] Locations is not an array:', locations);
                        locations = [];
                    }

                    const instructorMap = new Map();

                    // 1. First, populate from locations (source of truth for assignment)
                    locations.forEach((loc, index) => {
                        if (loc.assignedInstructorId && !instructorMap.has(loc.assignedInstructorId)) {
                            instructorMap.set(loc.assignedInstructorId, {
                                id: loc.assignedInstructorId,
                                name: loc.assignedInstructorName || 'Unknown Instructor',
                                title: 'Agriculture Instructor',
                                division: `${loc.instructorDivision}, ${loc.zone}`,
                                email: 'N/A',
                                phone: 'N/A',
                                specialization: 'General',
                                yearsOfExperience: 0,
                                qualifications: 'N/A',
                                averageRating: 0
                            });
                        }
                    });

                    // 2. Then, enrich with full details from instructors API if it succeeded
                    if (instructorsRes.ok && instructorsData.success && Array.isArray(instructorsData.data)) {
                        const allInstructors = instructorsData.data;
                        
                        // Iterate through our map of assigned instructors and try to find their full details
                        // We do this to handle potential ID mismatches (string vs number, custom ID vs DB ID)
                        for (const [key, val] of instructorMap.entries()) {
                            const match = allInstructors.find(inst => 
                                inst.id === val.id || 
                                inst.dbId === val.id || 
                                String(inst.id) === String(val.id) || 
                                String(inst.dbId) === String(val.id)
                            );

                            if (match) {
                                instructorMap.set(key, {
                                    ...val,
                                    ...match,
                                    title: 'Agriculture Instructor',
                                    division: match.division || val.division
                                });
                            }
                        }
                    }

                    const finalInstructors = Array.from(instructorMap.values());
                    setAvailableInstructors(finalInstructors);
                } else {
                    console.warn('⚠️ No locations found in profile');
                    setAvailableInstructors([]);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                showToast('Failed to load dashboard data', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        fetchUserRatings();
    }, [showToast]);

    const handleMessageSubmit = async (formData) => {
        try {
            console.log('📤 [FarmerHome] Sending Message Modal Data...');
            for (let pair of formData.entries()) {
                console.log(`   ${pair[0]}: ${pair[1] instanceof File ? pair[1].name : pair[1]}`);
            }
            const res = await fetch('/api/farmer/messages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData // Send FormData directly
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showToast('Message sent successfully!');
                setIsMessageModalOpen(false);
            } else {
                throw new Error(data.error?.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showToast(error.message, 'error');
            throw error; // Propagate to modal to handle loading state
        }
    };

    const handleRatingSubmit = async (ratingData) => {
        try {
            console.log('🔍 [FarmerHome] Submitting rating:', ratingData);
            console.log('🔍 [FarmerHome] Instructor ID:', selectedInstructor.id);
            
            const token = localStorage.getItem('token');
            const response = await fetch('/api/farmer/instructor-rating', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    instructor_id: selectedInstructor.id,
                    rating: ratingData.rating,
                    comments: ratingData.comments
                })
            });

            console.log('🔍 [FarmerHome] Response status:', response.status);
            const result = await response.json();
            console.log('🔍 [FarmerHome] Response data:', result);

            if (result.success) {
                console.log('✅ [FarmerHome] Rating submission successful');
                showToast(result.message, 'success');
                setIsInstructorModalOpen(false);
                setSelectedInstructor(null);
                
                // Add to userRatings state
                const newUserRatings = { ...userRatings };
                newUserRatings[selectedInstructor.id] = {
                    rating: ratingData.rating,
                    comments: ratingData.comments,
                    created_at: new Date().toISOString()
                };
                setUserRatings(newUserRatings);
                
                // Refresh instructor data to update average rating
                fetchDashboardData();
            } else {
                console.log('❌ [FarmerHome] Rating submission failed:', result.error?.message);
                showToast(result.error?.message || 'Failed to submit rating', 'error');
            }
        } catch (error) {
            console.error('❌ [FarmerHome] Error submitting rating:', error);
            showToast('Failed to submit rating', 'error');
        }
    };

    const handleRatingDelete = async () => {
        try {
            console.log('🔍 [FarmerHome] Deleting rating for instructor:', selectedInstructor.id);
            
            const token = localStorage.getItem('token');
            const response = await fetch('/api/farmer/instructor-rating', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    instructor_id: selectedInstructor.id
                })
            });

            console.log('🔍 [FarmerHome] Delete response status:', response.status);
            const result = await response.json();
            console.log('🔍 [FarmerHome] Delete response data:', result);

            if (result.success) {
                console.log('✅ [FarmerHome] Rating deletion successful');
                showToast(result.message, 'success');
                setIsInstructorModalOpen(false);
                setSelectedInstructor(null);
                
                // Remove from userRatings state
                const newUserRatings = { ...userRatings };
                delete newUserRatings[selectedInstructor.id];
                setUserRatings(newUserRatings);
                
                // Refresh instructor data to update average rating
                fetchDashboardData();
            } else {
                console.log('❌ [FarmerHome] Rating deletion failed:', result.error?.message);
                showToast(result.error?.message || 'Failed to delete rating', 'error');
            }
        } catch (error) {
            console.error('❌ [FarmerHome] Error deleting rating:', error);
            showToast('Failed to delete rating', 'error');
        }
    };

    return (
        <>
            <div className="page active" id="home" style={{ display: 'block' }}>
                <div className="page-title">
                    <i className="fas fa-home"></i>
                    <h2>Home</h2>
                </div>

                <div className="dashboard-stats" id="dashboardCards">
                    <div className="stat-card">
                        <div className="stat-value">{stats.activeCrops || 0}</div>
                        <div className="stat-label">Active Crops</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.plansSubmitted || 0}</div>
                        <div className="stat-label">Crop Plans Submitted</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.pestIssues || 0}</div>
                        <div className="stat-label">Pest Issues Reported</div>
                    </div>
                </div>

                <div className="cards-grid">
                    {/* Recent History Card */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Recent History</div>
                            <div className="card-icon"><i className="fas fa-history"></i></div>
                        </div>
                        <div className="card-content">
                            <ul className="card-list activities-list">
                                {recentHistory.length > 0 ? recentHistory.map((item, index) => (
                                    <li key={index}>
                                        <div className="activity-content">
                                            <div className="activity-text">{item.title}</div>
                                            <div className="activity-time">{new Date(item.date).toLocaleDateString()}</div>
                                        </div>
                                    </li>
                                )) : (
                                    <li style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                                        No recent activity
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Instructor Card */}
                    <div className="card instructor-card">
                        <div className="card-header">
                            <div className="card-title">Instructors</div>
                            <div className="card-icon"><i className="fas fa-chalkboard-teacher"></i></div>
                        </div>
                        <div className="card-content" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {availableInstructors.length > 0 ? availableInstructors.map((instructor, index) => (
                                <div key={instructor.id}
                                    className="instructor-list-item"
                                    onClick={() => {
                                        setSelectedInstructor(instructor);
                                        setIsInstructorModalOpen(true);
                                    }}
                                    style={{
                                        borderBottom: index !== availableInstructors.length - 1 ? '2px solid #e0e0e0' : 'none',
                                        padding: '15px 0',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        width: '100%'
                                    }}
                                >
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        marginRight: '15px',
                                        background: instructor.profilePicture ? 'transparent' : 'linear-gradient(135deg, #2e7d32, #66bb6a)',
                                        backgroundImage: instructor.profilePicture ? `url(${instructor.profilePicture.startsWith('http') ? instructor.profilePicture : `/${instructor.profilePicture}`})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        flexShrink: 0
                                    }}>
                                        {!instructor.profilePicture && (instructor.name ? instructor.name.charAt(0).toUpperCase() : 'I')}
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <div className="instructor-list-name" style={{ fontSize: '1.1em', fontWeight: '600', marginBottom: '5px', color: '#2e7d32' }}>
                                            {instructor.name}
                                        </div>
                                        <div className="instructor-list-details-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                            <div className="instructor-list-id" style={{ color: '#666', fontWeight: '500', fontSize: '0.9em' }}>
                                                {instructor.id}
                                            </div>
                                            <button
                                                className="btn btn-primary instructor-list-btn"
                                                style={{ padding: '5px 15px', borderRadius: '15px', fontSize: '0.8em', zIndex: 10, position: 'relative' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedInstructor(instructor);
                                                    setIsInstructorModalOpen(true);
                                                }}
                                            >
                                                View
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                                    No instructors assigned. Please update your Location & Land Details in Settings.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Send Message to Instructor Card */}
                    <div className="card" onClick={() => {
                        console.log('👆 [FarmerHome] "Send Message" Card clicked! Setting isMessageModalOpen to true');
                        if (availableInstructors.length > 0) {
                            setSelectedInstructor(availableInstructors[0]);
                        }
                        setIsMessageModalOpen(true);
                    }} style={{ cursor: 'pointer', zIndex: 1 }}>
                        <div className="card-header">
                            <div className="card-title">Send Message</div>
                            <div className="card-icon"><i className="fas fa-comment-alt"></i></div>
                        </div>
                        <div className="card-content">
                            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                                <div style={{ fontSize: '3em', color: 'var(--primary-light)', marginBottom: '15px' }}>
                                    <i className="fas fa-paper-plane"></i>
                                </div>
                                <div style={{ fontSize: '1.2em', color: 'var(--primary-dark)', fontWeight: '600', marginBottom: '10px' }}>
                                    Send Message
                                </div>
                                <div style={{ color: 'var(--gray)' }}>
                                    Click to compose and send messages to your instructor
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conditionally render modal to ensure state reset on open */}
            {isMessageModalOpen && (
                <MessageModal
                    isOpen={true}
                    onClose={() => {
                        console.log('🚪 [FarmerHome] Closing Message Modal');
                        setIsMessageModalOpen(false);
                    }}
                    recipientName={selectedInstructor?.name || "Agriculture Instructor"}
                    recipientId={selectedInstructor?.dbId || null}
                    onSubmit={handleMessageSubmit}
                />
            )}

            <SimpleInstructorModal
                isOpen={isInstructorModalOpen}
                onClose={() => setIsInstructorModalOpen(false)}
                onSubmit={handleRatingSubmit}
                onDelete={handleRatingDelete}
                instructor={selectedInstructor}
                existingRating={selectedInstructor ? userRatings[selectedInstructor.id] : null}
            />
        </>
    );
};

export default FarmerHome;
