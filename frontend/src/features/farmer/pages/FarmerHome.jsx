import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MessageModal from '../components/MessageModal';
import SimpleInstructorModal from '../components/modals/SimpleInstructorModal';
import styles from '../styles/FarmerHome.module.css';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import { getAccessToken } from '@/utils/authStorage';

const FarmerHome = () => {
    const { showToast, refreshMessages } = useOutletContext();
    const { t } = useTranslation('farmer');
    const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [selectedInstructor, setSelectedInstructor] = useState(null);

    // State for backend data
    const [stats, setStats] = useState({ activeCrops: 0, plansSubmitted: 0, pestIssues: 0 });
    const [recentHistory, setRecentHistory] = useState([]);
    const [availableInstructors, setAvailableInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRatings, setUserRatings] = useState({}); // Store user's existing ratings

    const fetchDashboardData = async () => {
        try {
            const token = getAccessToken();

            const statsRes = await fetch('/api/farmer/dashboard/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const statsData = await statsRes.json();
            if (statsRes.ok && statsData.success) {
                setStats(statsData.data);
            }

            const historyRes = await fetch('/api/farmer/dashboard/history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const historyData = await historyRes.json();
            if (historyRes.ok && historyData.success) {
                setRecentHistory(historyData.data);
            }

            const profileRes = await fetch('/api/farmer/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const profileData = await profileRes.json();

            const instructorsRes = await fetch('/api/farmer/instructors', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const instructorsData = await instructorsRes.json();

            if (profileRes.ok && profileData.success) {
                let locations = profileData.data.locations;

                if (typeof locations === 'string') {
                    try {
                        locations = JSON.parse(locations);
                    } catch (e) {
                        console.error('Failed to parse locations data:', e);
                        locations = [];
                    }
                }

                if (!Array.isArray(locations)) {
                    console.warn('Locations data is not an array, resetting to empty');
                    locations = [];
                }

                const instructorMap = new Map();
                locations.forEach((loc) => {
                    if (loc.assignedInstructorId && !instructorMap.has(loc.assignedInstructorId)) {
                        instructorMap.set(loc.assignedInstructorId, {
                            id: loc.assignedInstructorId,
                            name: loc.assignedInstructorName || 'Unknown Instructor',
                            title: 'Agriculture Instructor',
                            zone: loc.zone || 'N/A',
                            division: loc.instructorDivision || 'N/A',
                            email: 'N/A',
                            phone: 'N/A',
                            specialization: 'General',
                            yearsOfExperience: 0,
                            qualifications: 'N/A',
                            averageRating: 0
                        });
                    }
                });

                if (instructorsRes.ok && instructorsData.success && Array.isArray(instructorsData.data)) {
                    const allInstructors = instructorsData.data;
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
                console.warn('No locations found in profile');
                setAvailableInstructors([]);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            showToast(t('home.loadError'), 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch user's existing ratings
    const fetchUserRatings = async () => {
        try {
            const token = getAccessToken();
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
        fetchDashboardData();
        fetchUserRatings();
    }, [showToast]);

    const handleMessageSubmit = async (formData) => {
        try {
            const res = await fetch('/api/farmer/messages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`
                },
                body: formData // Send FormData directly
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showToast(t('home.messageSent'));
                setIsMessageModalOpen(false);
                if (refreshMessages) refreshMessages();
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

            const token = getAccessToken();
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

            const result = await response.json();

            if (result.success) {
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
                showToast(result.error?.message || 'Failed to submit rating', 'error');
            }
        } catch (error) {
            console.error('❌ [FarmerHome] Error submitting rating:', error);
            showToast(t('home.ratingError'), 'error');
        }
    };

    const handleRatingDelete = async () => {
        try {

            const token = getAccessToken();
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

            const result = await response.json();

            if (result.success) {
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
                showToast(result.error?.message || 'Failed to delete rating', 'error');
            }
        } catch (error) {
            console.error('❌ [FarmerHome] Error deleting rating:', error);
            showToast(t('home.ratingDeleteError'), 'error');
        }
    };

    return (
        <>
            <div className={styles.page}>
                <div className={styles.pageTitle}>
                    <i className="fas fa-home"></i>
                    <h2>{t('layout.pageHome')}</h2>
                </div>

                <div className={styles.dashboardStats} id="dashboardCards">
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{stats.activitiesCount || 0}</div>
                        <div className={styles.statLabel}>{t('home.statActivities')}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{stats.plansSubmitted || 0}</div>
                        <div className={styles.statLabel}>{t('home.statCropsSubmitted')}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{stats.pestIssues || 0}</div>
                        <div className={styles.statLabel}>{t('home.statPestReported')}</div>
                    </div>
                </div>

                <div className={styles.cardsGrid}>
                    {/* Recent History Card */}
                    <div className={commonCardStyles.card}>
                        <div className={commonCardStyles.cardHeader}>
                            <div className={commonCardStyles.cardTitle}>{t('home.recentHistory')}</div>
                            <div className={commonCardStyles.cardIcon}><i className="fas fa-clock-rotate-left"></i></div>
                        </div>
                        <div className={commonCardStyles.cardContent}>
                            <ul className={`${styles.cardList} ${styles.activitiesList}`}>
                                {recentHistory.length > 0 ? recentHistory.map((item, index) => (
                                    <li key={index}>
                                        <div className={styles.activityContent}>
                                            <div className={styles.activityText}>{item.title}</div>
                                            <div className={styles.activityTime}>{new Date(item.date).toLocaleDateString()}</div>
                                        </div>
                                    </li>
                                )) : (
                                    <li className={styles.emptyActivity}>
                                        {t('home.noActivity')}
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Instructor Card */}
                    <div className={`${commonCardStyles.card} ${styles.instructorCard}`}>
                        <div className={commonCardStyles.cardHeader}>
                            <div className={commonCardStyles.cardTitle}>{t('home.instructors')}</div>
                            <div className={commonCardStyles.cardIcon}><i className="fas fa-chalkboard-teacher"></i></div>
                        </div>
                        <div className={`${commonCardStyles.cardContent} ${styles.instructorListContainer}`}>
                            {availableInstructors.length > 0 ? availableInstructors.map((instructor, index) => (
                                <div key={instructor.id}
                                    className={styles.instructorListItem}
                                    onClick={() => {
                                        setSelectedInstructor(instructor);
                                        setIsInstructorModalOpen(true);
                                    }}
                                >
                                    <div className={`${styles.instructorAvatarCircle} ${instructor.profilePicture ? styles.hasImage : ''}`}>
                                        {instructor.profilePicture ? (
                                            <img
                                                src={instructor.profilePicture.startsWith('http') ? instructor.profilePicture : `/${instructor.profilePicture}`}
                                                alt={instructor.name}
                                                className={styles.instructorAvatarImg}
                                            />
                                        ) : (
                                            instructor.name ? instructor.name.charAt(0).toUpperCase() : 'I'
                                        )}
                                    </div>
                                    <div className={styles.instructorInfo}>
                                        <div className={styles.instructorName}>{instructor.name}</div>
                                        <div className={styles.instructorId}>{instructor.id}</div>
                                    </div>
                                    <button
                                        className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary} ${commonBtnStyles.btnSm}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedInstructor(instructor);
                                            setIsInstructorModalOpen(true);
                                        }}
                                    >
                                        {t('home.viewBtn')}
                                    </button>
                                </div>
                            )) : (
                                <div className={styles.noInstructors}>
                                    {t('home.noInstructorsFull')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Send Message to Instructor Card */}
                    <div className={`${commonCardStyles.card} ${styles.sendMessageCard}`} onClick={() => {
                        setIsMessageModalOpen(true);
                    }}>
                        <div className={commonCardStyles.cardHeader}>
                            <div className={commonCardStyles.cardTitle}>{t('home.sendMessage')}</div>
                            <div className={commonCardStyles.cardIcon}><i className="fas fa-message"></i></div>
                        </div>
                        <div className={commonCardStyles.cardContent}>
                            <div className={styles.sendMessageContent}>
                                <div className={styles.sendMessageIcon}>
                                    <i className="fas fa-paper-plane"></i>
                                </div>
                                <div className={styles.sendMessageTitle}>
                                    {t('home.sendMessage')}
                                </div>
                                <div className={styles.sendMessageDesc}>
                                    {t('home.sendMessageDesc')}
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
                        setIsMessageModalOpen(false);
                    }}
                    instructors={availableInstructors}
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
