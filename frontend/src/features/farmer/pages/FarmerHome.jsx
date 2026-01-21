import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import MessageModal from '@/shared/components/MessageModal';
import InstructorModal from '@/shared/components/InstructorModal';

const FarmerHome = () => {
    const { showToast } = useOutletContext();
    const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

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
                    <div className="instructor-avatar">RS</div>
                    <div className="instructor-name">Rohan Silva</div>
                    <div className="instructor-title">Agriculture Instructor</div>
                    <button className="btn btn-primary instructor-btn" onClick={() => setIsInstructorModalOpen(true)}>
                        Click Here
                    </button>
                </div>

                {/* Send Message to Instructor Card */}
                <div className="card" onClick={() => setIsMessageModalOpen(true)} style={{ cursor: 'pointer' }}>
                    <div className="card-header">
                        <div className="card-title">Send Message to Instructor</div>
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
            <InstructorModal isOpen={isInstructorModalOpen} onClose={() => setIsInstructorModalOpen(false)} onSubmit={handleRatingSubmit} />
        </div>
    );
};

export default FarmerHome;
