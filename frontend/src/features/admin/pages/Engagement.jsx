import React, { useState } from 'react';
import ReactDOM from 'react-dom';

// Portal Component for Modal
const ModalPortal = ({ children }) => {
    return ReactDOM.createPortal(children, document.body);
};

const Engagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInstructor, setSelectedInstructor] = useState(null);
    const [selectedFarmer, setSelectedFarmer] = useState(null);

    const instructorEngagement = [
        {
            id: 'INST001',
            name: 'Rohan Silva',
            nic: '198512345678',
            phone: '077-1234567',
            district: 'Anuradhapura',
            businessArea: 'Padaviya',
            divisions: ['Boganewa', 'Kumbukwewa'],
            avatar: null,
            averageRating: 4.8,
            farmersCount: 5,
            farmers: [
                { id: 'FARM001', name: 'Sunil Perera', phone: '077-1234567', district: 'Anuradhapura', businessArea: 'Padaviya', instructorDivision: 'Boganewa' },
                { id: 'FARM002', name: 'Kamala Fernando', phone: '071-9876543', district: 'Anuradhapura', businessArea: 'Padaviya', instructorDivision: 'Boganewa' },
                { id: 'FARM003', name: 'Nimal Rathnayake', phone: '075-5555555', district: 'Anuradhapura', businessArea: 'Padaviya', instructorDivision: 'Kumbukwewa' },
                { id: 'FARM004', name: 'Saman Kumara', phone: '076-1112222', district: 'Anuradhapura', businessArea: 'Padaviya', instructorDivision: 'Kumbukwewa' },
                { id: 'FARM005', name: 'Ajith Weerasinghe', phone: '077-3334444', district: 'Anuradhapura', businessArea: 'Padaviya', instructorDivision: 'Boganewa' }
            ],
            reviews: [
                { id: 1, farmer: 'Sunil Perera', rating: 5, comment: 'Very helpful advice on pest control.' },
                { id: 2, farmer: 'Kamala Fernando', rating: 4, comment: 'Good guidance, visits regularly.' }
            ]
        },
        {
            id: 'INST002',
            name: 'Priya Bandara',
            nic: '199098765432',
            phone: '071-9876543',
            district: 'Anuradhapura',
            businessArea: 'Rajanganaya',
            divisions: ['Yaya 1', 'Yaya 2'],
            avatar: null,
            averageRating: 4.5,
            farmersCount: 5,
            farmers: [
                { id: 'FARM006', name: 'Chitra Kumari', phone: '071-2223333', district: 'Anuradhapura', businessArea: 'Rajanganaya', instructorDivision: 'Yaya 1' },
                { id: 'FARM007', name: 'Sarath Fonseka', phone: '077-4445555', district: 'Anuradhapura', businessArea: 'Rajanganaya', instructorDivision: 'Yaya 1' },
                { id: 'FARM008', name: 'Malini De Silva', phone: '075-6667777', district: 'Anuradhapura', businessArea: 'Rajanganaya', instructorDivision: 'Yaya 2' },
                { id: 'FARM009', name: 'Bandara Menike', phone: '070-1112222', district: 'Anuradhapura', businessArea: 'Rajanganaya', instructorDivision: 'Yaya 2' },
                { id: 'FARM010', name: 'Jagath Pushpakumara', phone: '076-3334444', district: 'Anuradhapura', businessArea: 'Rajanganaya', instructorDivision: 'Yaya 1' }
            ],
            reviews: [
                { id: 1, farmer: 'Chitra Kumari', rating: 5, comment: 'Excellent support during harvest.' }
            ]
        },
        {
            id: 'INST003',
            name: 'Anura Wickramasinghe',
            nic: '198855566677',
            phone: '075-5556667',
            district: 'Anuradhapura',
            businessArea: 'Vahalkada',
            divisions: ['Track 5', 'Track 6'],
            avatar: null,
            averageRating: 4.2,
            farmersCount: 5,
            farmers: [
                { id: 'FARM011', name: 'Gunapala Herath', phone: '071-5556666', district: 'Anuradhapura', businessArea: 'Vahalkada', instructorDivision: 'Track 5' },
                { id: 'FARM012', name: 'Siripala Gamage', phone: '077-7778888', district: 'Anuradhapura', businessArea: 'Vahalkada', instructorDivision: 'Track 5' },
                { id: 'FARM013', name: 'Chandani Liyanage', phone: '075-8889999', district: 'Anuradhapura', businessArea: 'Vahalkada', instructorDivision: 'Track 6' },
                { id: 'FARM014', name: 'Duminda Silva', phone: '070-2223333', district: 'Anuradhapura', businessArea: 'Vahalkada', instructorDivision: 'Track 6' },
                { id: 'FARM015', name: 'Mahesh Senanayake', phone: '076-4445555', district: 'Anuradhapura', businessArea: 'Vahalkada', instructorDivision: 'Track 5' }
            ],
            reviews: []
        },
        {
            id: 'INST004',
            name: 'Kasun Jayasuriya',
            nic: '199244455566',
            phone: '070-7778888',
            district: 'Anuradhapura',
            businessArea: 'Medawachchiya',
            divisions: ['Tulana 1', 'Tulana 2'],
            avatar: null,
            averageRating: 4.0,
            farmersCount: 5,
            farmers: [
                { id: 'FARM016', name: 'Thilini Priyadarshani', phone: '071-6667777', district: 'Anuradhapura', businessArea: 'Medawachchiya', instructorDivision: 'Tulana 1' },
                { id: 'FARM017', name: 'Ruwan Hettiarachchi', phone: '077-9990000', district: 'Anuradhapura', businessArea: 'Medawachchiya', instructorDivision: 'Tulana 1' },
                { id: 'FARM018', name: 'Sanath Jayasuriya', phone: '075-1112222', district: 'Anuradhapura', businessArea: 'Medawachchiya', instructorDivision: 'Tulana 2' },
                { id: 'FARM019', name: 'Upul Tharanga', phone: '070-3334444', district: 'Anuradhapura', businessArea: 'Medawachchiya', instructorDivision: 'Tulana 2' },
                { id: 'FARM020', name: 'Damitha Abeyratne', phone: '076-5556666', district: 'Anuradhapura', businessArea: 'Medawachchiya', instructorDivision: 'Tulana 1' }
            ],
            reviews: [
                { id: 1, farmer: 'Thilini Priyadarshani', rating: 4, comment: 'Responsive and knowledgeable.' }
            ]
        },
        {
            id: 'INST005',
            name: 'Nimali Perera',
            nic: '199511122233',
            phone: '076-9990000',
            district: 'Anuradhapura',
            businessArea: 'Kebithigollewa',
            divisions: ['Handagala', 'Kanugahawewa'],
            avatar: null,
            averageRating: 4.7,
            farmersCount: 5,
            farmers: [
                { id: 'FARM021', name: 'Kanthi Perera', phone: '071-8889999', district: 'Anuradhapura', businessArea: 'Kebithigollewa', instructorDivision: 'Handagala' },
                { id: 'FARM022', name: 'Nihal Fernando', phone: '077-2223333', district: 'Anuradhapura', businessArea: 'Kebithigollewa', instructorDivision: 'Handagala' },
                { id: 'FARM023', name: 'Wasantha Kumar', phone: '075-4445555', district: 'Anuradhapura', businessArea: 'Kebithigollewa', instructorDivision: 'Kanugahawewa' },
                { id: 'FARM024', name: 'Nayana Kumari', phone: '070-6667777', district: 'Anuradhapura', businessArea: 'Kebithigollewa', instructorDivision: 'Kanugahawewa' },
                { id: 'FARM025', name: 'Ranjith Premadasa', phone: '076-8889999', district: 'Anuradhapura', businessArea: 'Kebithigollewa', instructorDivision: 'Handagala' }
            ],
            reviews: [
                { id: 1, farmer: 'Kanthi Perera', rating: 5, comment: 'Best instructor we have had.' }
            ]
        }
    ];

    const filteredInstructors = instructorEngagement.filter(instructor =>
        instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.farmers.some(farmer =>
            farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            farmer.id.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

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
                                        <span className="instructor-id">({instructor.id})</span>
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
                    <div className="engagement-stat-value">5</div>
                    <div className="engagement-stat-label">Total Instructors</div>
                    <div className="engagement-stat-value">25</div>
                    <div className="engagement-stat-label">Total Farmers</div>
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
                                        <div className="instructor-id" style={{ marginBottom: '15px' }}>{selectedInstructor.id}</div>

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
                                                <div className="info-label-sm">Business Area</div>
                                                <div className="info-value-md">{selectedFarmer.businessArea}</div>
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
