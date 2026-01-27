import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import MessageModal from '../components/shared/MessageModal';
import InstructorModal from '../components/shared/InstructorModal';

const FarmerHome = () => {
    const { showToast } = useOutletContext();
    const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [selectedInstructor, setSelectedInstructor] = useState(null);

    const availableInstructors = [
        { id: 'INST-2026-0001', name: 'Rohan Silva', title: 'Agriculture Instructor', email: 'rohan.silva@agri.gov', phone: '071-1234567', division: 'Yaya 4, Rajanganaya', specialization: 'Sustainable Agriculture, Crop Management', yearsOfExperience: 8, qualifications: 'B.Sc. in Agriculture, Certified Crop Advisor', averageRating: 4.2 },
        { id: 'INST-2026-0002', name: 'Upul Tharanga', title: 'Agriculture Instructor', email: 'upul.tharanga@agri.gov', phone: '077-9876543', division: 'Track 4, Vilachchiya', specialization: 'Pest & Disease Management, Soil Science', yearsOfExperience: 12, qualifications: 'M.Sc. in Agronomy, Ph.D. in Entomology', averageRating: 4.7 },
        { id: 'INST-2026-0003', name: 'Kamala Perera', title: 'Agriculture Instructor', email: 'kamala.perera@agri.gov', phone: '075-5432109', division: 'Palugaswewa, Anuradhapura', specialization: 'Organic Farming, Water Management', yearsOfExperience: 5, qualifications: 'Diploma in Organic Agriculture, B.Sc. in Environmental Science', averageRating: 3.9 },
        { id: 'INST-2026-0004', name: 'Nimal Fernando', title: 'Agriculture Instructor', email: 'nimal.fernando@agri.gov', phone: '070-1122334', division: 'Galenbindunuwewa, Polonnaruwa', specialization: 'Horticulture, Farm Mechanization', yearsOfExperience: 15, qualifications: 'B.Sc. in Agricultural Engineering, Certified Horticulturist', averageRating: 4.5 },
    ];

    const handleMessageSubmit = () => {
        showToast('Message sent successfully to Rohan Silva!');
        setIsMessageModalOpen(false);
    };

    const handleRatingSubmit = () => {
        showToast('Thank you for your feedback! Your rating has been submitted.');
        setIsInstructorModalOpen(false);
    };

    return (
        <div className="page active" id="home" style={{ display: 'block' }}>
            <div className="page-title">
                <i className="fas fa-home"></i>
                <h2>Home</h2>
            </div>

            <div className="dashboard-stats" id="dashboardCards">
                <div className="stat-card">
                    <div className="stat-value">3</div>
                    <div className="stat-label">Active Crops</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">2</div>
                    <div className="stat-label">Crop Plans Submitted</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">6</div>
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
                        <div className="history-list">
                            {[
                                { title: 'Crop Plan Sent', date: '2025-10-18' },
                                { title: 'Harvest Record', date: '2025-08-18' },
                                { title: 'Activity Logged', date: '2025-05-08' },
                                { title: 'Pest Report', date: '2025-04-22' },
                                { title: 'Meeting Request', date: '2025-03-15' }
                            ].map((item, index) => (
                                <React.Fragment key={index}>
                                    <div className="history-item">
                                        <div className="history-title">{item.title}</div>
                                        <div className="history-date">{item.date}</div>
                                    </div>
                                    {index < 4 && <div className="history-divider"></div>}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Instructor Card */}
                <div className="card instructor-card">
                    <div className="card-header">
                        <div className="card-title">Instructors</div>
                        <div className="card-icon"><i className="fas fa-chalkboard-teacher"></i></div>
                    </div>
                    <div className="card-content" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {availableInstructors.map((instructor, index) => (
                            <div key={instructor.id}
                                className="instructor-list-item"
                                onClick={() => { setSelectedInstructor(instructor); setIsInstructorModalOpen(true); }}
                                style={{
                                    borderBottom: index !== availableInstructors.length - 1 ? '2px solid #e0e0e0' : 'none',
                                    padding: '15px 0',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    width: '100%'
                                }}
                            >
                                <div className="instructor-list-name" style={{ fontSize: '1.1em', fontWeight: '600', marginBottom: '5px', color: '#2e7d32' }}>
                                    {instructor.name}
                                </div>
                                <div className="instructor-list-details-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <div className="instructor-list-id" style={{ color: '#666', fontWeight: '500', fontSize: '0.9em' }}>
                                        {instructor.id}
                                    </div>
                                    <button className="btn btn-primary instructor-list-btn" style={{ padding: '5px 15px', borderRadius: '15px', fontSize: '0.8em' }}>
                                        View
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Send Message to Instructor Card */}
                <div className="card" onClick={() => setIsMessageModalOpen(true)} style={{ cursor: 'pointer' }}>
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

            <MessageModal isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} onSubmit={handleMessageSubmit} />
            <InstructorModal isOpen={isInstructorModalOpen} onClose={() => setIsInstructorModalOpen(false)} onSubmit={handleRatingSubmit} instructor={selectedInstructor} />
        </div>
    );
};

export default FarmerHome;
