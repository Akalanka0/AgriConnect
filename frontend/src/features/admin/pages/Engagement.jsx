import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { adminAPI } from '@/services/adminService';
import { useTranslation } from 'react-i18next';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import styles from '../styles/Engagement.module.css';

// Portal Component for Modal
const ModalPortal = ({ children }) => {
    return ReactDOM.createPortal(children, document.body);
};

const Engagement = () => {
    // Helper to format zone names (remove "Zone" suffix if present)
    const formatZoneName = (name) => {
        if (!name) return '-';
        // More robust removal: handle trailing spaces and case-insensitive "Zone"
        return name.toString().replace(/\s+Zone\s*$/i, '').trim();
    };

    const { t } = useTranslation('admin');

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInstructor, setSelectedInstructor] = useState(null);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [instructorEngagement, setInstructorEngagement] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEngagementData = async () => {
            try {
                const response = await adminAPI.getInstructorEngagement();
                // response from adminAPI could be directly the data array or wrapped in data property
                const data = response.data || response;
                
                if (data && Array.isArray(data)) {
                    // Transform data to format zone names
                    const transformedData = data.map(instructor => ({
                        ...instructor,
                        zone: formatZoneName(instructor.zone),
                        farmers: instructor.farmers ? instructor.farmers.map(farmer => ({
                            ...farmer,
                            location: formatZoneName(farmer.zone)
                        })) : []
                    }));
                    setInstructorEngagement(transformedData);
                }
            } catch (error) {
                console.error('Error fetching instructor engagement data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEngagementData();
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
            <div className={`${styles.pageActive}`} id="engagement">
                <div className={styles.pageTitle}>
                    <i className="fas fa-handshake"></i>
                    <h2>{t('engagement.engagementTitle')}</h2>
                </div>
                <div className={styles.noResultsContainer}>
                    <i className="fas fa-spinner fa-spin no-results-icon"></i>
                    <p>{t('engagement.loadingEngagement')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.pageActive}`} id="engagement">
            <div className={styles.pageTitle}>
                <i className="fas fa-handshake"></i>
                <h2>{t('engagement.engagementTitle')}</h2>
            </div>

            {/* Centered Search Bar */}
            <div className={styles.searchContainerCenter}>
                <div className={styles.searchInputWrapper}>
                    <i className={`fas fa-search ${styles.searchIconAbsolute}`}></i>
                    <input
                        type="text"
                        placeholder={t('engagement.searchEngagementPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInputRounded}
                    />
                </div>
            </div>

            {/* Search Results Info */}
            <div className={styles.resultsInfo}>
                <span>{t('engagement.foundInstructors')} <span className={styles.resultsCountBadge}>{filteredInstructors.length}</span> {t('engagement.instructorsLabel')}</span>
                {searchTerm && (
                    <button
                        className={styles.clearFiltersBtn}
                        onClick={() => setSearchTerm('')}
                    >
                        {t('engagement.clearSearch')}
                    </button>
                )}
            </div>

            <div className={styles.cardsGrid}>
                {filteredInstructors.length > 0 ? (
                    filteredInstructors.map((instructor) => (
                        <div className={`${commonCardStyles.card} ${styles.cardFlexColumn}`} key={instructor.id}>
                            <div className={styles.cardHeader}>
                                <div className={`${commonCardStyles.cardTitle} ${styles.cardHeaderFlex}`}>
                                    <div className={styles.instructorInfo}>
                                        <span className={styles.instructorName}>{instructor.name}</span>
                                        <span className={styles.instructorId}>({instructor.displayId})</span>
                                    </div>
                                    <button
                                        className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnPrimary}`}
                                        onClick={() => setSelectedInstructor(instructor)}
                                    >
                                        {t('engagement.viewBtn')}
                                    </button>
                                </div>
                            </div>
                            <div className={`${styles.cardContent} ${styles.cardContentFlex}`}>
                                <div className={styles.farmersCountWrapper}>
                                    <div className={styles.farmersCountVal}>{instructor.farmersCount}</div>
                                    <div className={styles.farmersCountLabel}>{t('engagement.farmersAssigned')}</div>
                                </div>

                                <div className={styles.farmersListContainer}>
                                    {instructor.farmers.map((farmer) => (
                                        <div key={farmer.id} className={styles.farmerListItem}>
                                            <div>
                                                <div className={styles.farmerInfoText}>{farmer.name}</div>
                                                <div className={styles.farmerIdText}>{farmer.id}</div>
                                            </div>
                                            <button
                                                className={styles.btnViewXs}
                                                onClick={() => setSelectedFarmer(farmer)}
                                            >
                                                {t('engagement.viewBtn')}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.noResultsContainer}>
                        <i className={`fas fa-search ${styles.noResultsIcon}`}></i>
                        <p>No instructors or farmers found matching &quot;{searchTerm}&quot;</p>
                    </div>
                )}
            </div>

            {/* Instructor Details Modal */}
            {selectedInstructor && (
                <ModalPortal>
                    <div className={`${styles.adminModal} ${styles.active}`}>
                        <div className={styles.adminModalContent}>
                            <div className={styles.adminModalHeader}>
                                <div className={styles.adminModalTitle}>{t('engagement.instructorDetails')}</div>
                                <button className={styles.adminModalCloseRound} onClick={() => setSelectedInstructor(null)}>
                                    <i className="fas fa-xmark"></i>
                                </button>
                            </div>

                            <div className={styles.adminModalBody}>
                                {/* Basic Info Section */}
                                <div className={styles.instructorProfileHeader}>
                                    <div className={`${styles.instructorAvatarLarge} ${selectedInstructor.avatar ? styles.hasAvatar : styles.noAvatar}`}>
                                        {selectedInstructor.avatar ? (
                                            <img src={selectedInstructor.avatar} alt={t('engagement.instructorAlt')} className={styles.avatarFullImg} />
                                        ) : (
                                            selectedInstructor.name.charAt(0)
                                        )}
                                    </div>
                                    <div className={styles.instructorDetailsWrapper}>
                                        <div className={styles.instructorHeaderTop}>
                                            <h2 className={styles.instructorNameLarge}>{selectedInstructor.name}</h2>
                                            {selectedInstructor.averageRating > 0 && (
                                                <div className={styles.instructorRatingBadge}>
                                                    <i className={`fas fa-star ${styles.starIconWarning}`}></i>
                                                    <span className={styles.ratingTextBold}>{selectedInstructor.averageRating}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.instructorIdMargin}>{selectedInstructor.displayId}</div>

                                        <div className={styles.instructorGridDetails}>
                                            <div>
                                                <div className={styles.detailLabel}>{t('engagement.nicNumber')}</div>
                                                <div className={styles.detailValue}>{selectedInstructor.nic}</div>
                                            </div>
                                            <div>
                                                <div className={styles.infoLabelSm}>{t('engagement.phoneNumber')}</div>
                                                <div className={styles.infoValueMd}>{selectedInstructor.phone}</div>
                                            </div>
                                            <div className={styles.workingAreaSection}>
                                                <div className={styles.workingAreaLabel}>{t('engagement.workingArea')}</div>

                                                <div className={styles.workingAreaDetails}>
                                                    <div className={styles.workingAreaRow}>
                                                        <span className={styles.workingAreaKey}>{t('engagement.districtLabel')}:</span>
                                                        <span className={styles.workingAreaVal}>{selectedInstructor.district}</span>
                                                    </div>

                                                    <div className={styles.workingAreaRow}>
                                                        <span className={styles.workingAreaKey}>{t('engagement.zoneLabel')}:</span>
                                                        <span className={styles.workingAreaVal}>{selectedInstructor.zone}</span>
                                                    </div>

                                                    <div>
                                                        <div className={`${styles.workingAreaKey} ${styles.workingAreaKeyMargin}`}>{t('engagement.instructorDivisionsLabel')}</div>
                                                        <div className={styles.divisionTagsWrapper}>
                                                            {selectedInstructor.divisions.map((div, idx) => (
                                                                <span key={idx} className={styles.divisionTag}>
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
                                <div className={styles.reviewsSection}>
                                    <h4 className={styles.reviewsHeader}>
                                        {t('engagement.farmerReviews')} <span className={styles.reviewsCount}>({selectedInstructor.reviews.length})</span>
                                    </h4>

                                    {selectedInstructor.reviews.length > 0 ? (
                                        <div className={styles.reviewsList}>
                                            {selectedInstructor.reviews.map((review) => (
                                                <div key={review.id} className={styles.reviewItem}>
                                                    <div className={styles.reviewHeader}>
                                                        <span className={styles.reviewAuthor}>{review.farmer}</span>
                                                        <div className={styles.reviewStars}>
                                                            {[...Array(5)].map((_, i) => (
                                                                <i key={i} className={`fas fa-star ${styles.reviewStarSmall}`} style={{ color: i < review.rating ? 'var(--state-warning)' : 'var(--neutral-300)' }}></i>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className={styles.reviewText}>&quot;{review.comment}&quot;</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={styles.noReviews}>
                                            {t('engagement.noReviews')}
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
                    <div className={`${styles.adminModal} ${styles.active}`}>
                        <div className={`${styles.adminModalContent} ${styles.farmerModalContent}`}>
                            <div className={styles.adminModalHeader}>
                                <div className={styles.adminModalTitle}>{t('engagement.farmerDetails')}</div>
                                <button className={styles.adminModalCloseRound} onClick={() => setSelectedFarmer(null)}>
                                    <i className="fas fa-xmark"></i>
                                </button>
                            </div>

                            <div className={styles.adminModalBody}>
                                <div className={styles.instructorProfileHeader}>
                                    <div
                                        className={`${styles.instructorAvatarLarge} ${selectedFarmer.avatar ? styles.hasAvatar : styles.noAvatar}`}
                                    >
                                        {selectedFarmer.avatar ? (
                                            <img src={selectedFarmer.avatar} alt={t('engagement.farmerAlt')} className={styles.avatarFullImg} />
                                        ) : (
                                            selectedFarmer.name.charAt(0)
                                        )}
                                    </div>
                                    <div className={styles.farmerDetailsWrapper}>
                                        <h2 className={styles.farmerNameLargeModal}>{selectedFarmer.name}</h2>
                                        <div className={styles.farmerIdModal}>{selectedFarmer.id}</div>

                        <div className={styles.farmerGridDetails}>
                                            <div>
                                                <div className={styles.infoLabelSm}>{t('engagement.nicLabel')}</div>
                                                <div className={styles.infoValueMd}>{selectedFarmer.nic}</div>
                                            </div>
                                            <div>
                                                <div className={styles.infoLabelSm}>{t('engagement.phoneFarmerLabel')}</div>
                                                <div className={styles.infoValueMd}>{selectedFarmer.phone}</div>
                                            </div>
                                            <div>
                                                <div className={styles.infoLabelSm}>{t('engagement.districtFarmerLabel')}</div>
                                                <div className={styles.infoValueMd}>{selectedFarmer.district}</div>
                                            </div>
                                            <div>
                                                <div className={styles.infoLabelSm}>{t('engagement.zoneFarmerLabel')}</div>
                                                <div className={styles.infoValueMd}>{selectedFarmer.location}</div>
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <div className={styles.infoLabelSm}>{t('engagement.instructorDivisionsFarmerLabel')}</div>
                                                <div className={styles.infoValueMd}>
                                                    {selectedFarmer.farmerLocations && selectedFarmer.farmerLocations.length > 0 ? (
                                                        <div className={styles.divisionTagsWrapper}>
                                                            {selectedFarmer.farmerLocations.map((loc, idx) => (
                                                                <span key={idx} className={styles.divisionTag}>
                                                                    {loc.division || loc.instructorDivision || loc.instructor_division || '-'}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        selectedFarmer.instructorDivision
                                                    )}
                                                </div>
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
