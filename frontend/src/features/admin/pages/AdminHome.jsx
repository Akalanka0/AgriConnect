import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { useToast } from '../components/Toast';
import '../styles/AdminDash.css';

// Portal Component for Modals
const ModalPortal = ({ children }) => {
    return ReactDOM.createPortal(children, document.body);
};

const AdminHome = () => {
    const { openNotificationsModal } = useOutletContext();
    // State for Modals
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('Send Message');
    const [recipientType, setRecipientType] = useState('all');
    const [showUserSelection, setShowUserSelection] = useState(false);

    // State for Message Form
    const [messageSubject, setMessageSubject] = useState('');
    const [messageText, setMessageText] = useState('');
    const [attachment, setAttachment] = useState(null);
    const fileInputRef = useRef(null);

    // Context and State
    const { showToast } = useToast();
    const [isSending, setIsSending] = useState(false);

    // Mock Data for Dashboard
    const stats = [
        {
            label: 'Total Users',
            value: '35',
            icon: 'fas fa-users',
            color: 'blue'
        },
        {
            label: 'Farmers',
            value: '25',
            icon: 'fas fa-tractor',
            color: 'success'
        },
        {
            label: 'Instructors',
            value: '5',
            icon: 'fas fa-chalkboard-teacher',
            color: 'orange'
        },
        {
            label: 'Admins',
            value: '5',
            icon: 'fas fa-user-shield',
            color: 'purple'
        }
    ];

    const recentActivities = [
        { action: 'User FARM001 joined', time: 'Today', icon: 'fas fa-user-plus', color: '#2ecc71' },
        { action: 'User FARM004 blocked', time: '2 hours ago', icon: 'fas fa-user-slash', color: '#e74c3c' },
        { action: 'User INST002 joined', time: 'Yesterday', icon: 'fas fa-user-plus', color: '#3498db' },
        { action: 'User INST005 joined', time: '2 days ago', icon: 'fas fa-user-plus', color: '#f39c12' }
    ];

    // Helper Functions
    const openNotifications = () => {
        openNotificationsModal();
    };

    const openMessageModal = (type) => {
        setRecipientType(type);
        if (type === 'farmers') {
            setModalTitle('Send Message to Farmers');
            setShowUserSelection(false);
        } else if (type === 'instructors') {
            setModalTitle('Send Message to Instructors');
            setShowUserSelection(false);
        } else if (type === 'custom') {
            setRecipientType('select');
            setModalTitle('Send Custom Message');
            setShowUserSelection(true);
        } else {
            setRecipientType('all');
            setModalTitle('Send Message');
            setShowUserSelection(false);
        }
        setIsMessageModalOpen(true);
    };

    const closeMessageModal = () => {
        setIsMessageModalOpen(false);
        setMessageSubject('');
        setMessageText('');
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRecipientChange = (e) => {
        const type = e.target.value;
        setRecipientType(type);
        setShowUserSelection(type === 'select');
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAttachment(file);
        }
    };

    const removeAttachment = () => {
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const sendMessage = async () => {
        if (!messageSubject.trim()) {
            showToast('Please enter a subject for the message', 'error');
            return;
        }
        if (!messageText.trim()) {
            showToast('Please enter a message', 'error');
            return;
        }

        setIsSending(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        showToast('Message sent successfully!');
        setIsSending(false);
        closeMessageModal();
    };

    return (
        <div className="page active" id="home">
            <div className="page-title">
                <i className="fas fa-home"></i>
                <h2>Home</h2>
            </div>

            {/* Stats Grid */}
            <div className="dashboard-stats">
                {stats.map((stat, index) => (
                    <StatCard
                        key={index}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        trend={stat.trend}
                        trendValue={stat.trendValue}
                        color={stat.color}
                    />
                ))}
            </div>

            <div className="cards-grid">
                {/* Recent Activities */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Recent Activities</div>
                        <div className="card-icon"><i className="fas fa-history"></i></div>
                    </div>
                    <div className="card-content">
                        <ul className="card-list">
                            {recentActivities.map((activity, index) => (
                                <li key={index}>
                                    <div className="activity-content">
                                        <div className="activity-text">{activity.action}</div>
                                        <div className="activity-time">{activity.time}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Quick Actions</div>
                        <div className="card-icon"><i className="fas fa-bolt"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="quick-actions-grid">
                            <div className="quick-action-item" onClick={openNotifications}>
                                <i className="fas fa-bell"></i>
                                <span>View Notifications</span>
                            </div>
                            <div className="quick-action-item" onClick={() => openMessageModal('all')}>
                                <i className="fas fa-envelope"></i>
                                <span>Send Message to All</span>
                            </div>
                            <div className="quick-action-item" onClick={() => openMessageModal('farmers')}>
                                <i className="fas fa-user-friends"></i>
                                <span>Send to Farmers</span>
                            </div>
                            <div className="quick-action-item" onClick={() => openMessageModal('instructors')}>
                                <i className="fas fa-chalkboard-teacher"></i>
                                <span>Send to Instructors</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Send Message Card */}
                <div className="card card-send-message" onClick={() => openMessageModal('all')}>
                    <div className="card-header">
                        <div className="card-title">Send Message</div>
                        <div className="card-icon"><i className="fas fa-comment-alt"></i></div>
                    </div>
                    <div className="card-content send-message-wrapper">
                        <div className="send-message-content">
                            <div className="send-message-icon">
                                <i className="fas fa-paper-plane"></i>
                            </div>
                            <div className="send-message-title">
                                Send Message
                            </div>
                            <div className="send-message-desc">
                                Click to compose and send messages to farmers and instructors
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message Modal */}
            {isMessageModalOpen && (
                <ModalPortal>
                    <div className="admin-modal active" id="messageModal">
                        <div className="admin-modal-content">
                            <div className="admin-modal-header">
                                <div className="admin-modal-title">{modalTitle}</div>
                                <button className="admin-modal-close-round" onClick={closeMessageModal}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="admin-modal-body">
                                <div className="admin-form-group">
                                    <label htmlFor="recipientType">Send to:</label>
                                    <select
                                        id="recipientType"
                                        className="admin-form-control"
                                        value={recipientType}
                                        onChange={handleRecipientChange}
                                    >
                                        <option value="all">All Users (8460)</option>
                                        <option value="farmers">All Farmers (8420)</option>
                                        <option value="instructors">All Instructors (40)</option>
                                        <option value="select">Select Users</option>
                                    </select>
                                </div>

                                {showUserSelection && (
                                    <div className="admin-form-group" id="userSelectionModal">
                                        <label>Select Users:</label>
                                        <div className="user-selection-container">
                                            <div className="user-group-title">
                                                Farmers
                                            </div>
                                            <label className="user-checkbox-item">
                                                <input type="checkbox" value="sunil" />
                                                <span>Sunil Perera</span>
                                            </label>
                                            <label className="user-checkbox-item">
                                                <input type="checkbox" value="kamala" />
                                                <span>Kamala Fernando</span>
                                            </label>
                                            <label className="user-checkbox-item">
                                                <input type="checkbox" value="nimal" />
                                                <span>Nimal Rajapaksa</span>
                                            </label>
                                            <label className="user-checkbox-item">
                                                <input type="checkbox" value="saman" />
                                                <span>Saman Kumara</span>
                                            </label>

                                            <div className="user-group-title">
                                                Instructors
                                            </div>
                                            <label className="user-checkbox-item">
                                                <input type="checkbox" value="rohan" />
                                                <span>Rohan Silva</span>
                                            </label>
                                            <label className="user-checkbox-item">
                                                <input type="checkbox" value="priya" />
                                                <span>Priya Bandara</span>
                                            </label>
                                            <label className="user-checkbox-item">
                                                <input type="checkbox" value="anura" />
                                                <span>Anura Wickramasinghe</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className="admin-form-group">
                                    <label htmlFor="messageSubject">Subject:</label>
                                    <input
                                        type="text"
                                        id="messageSubject"
                                        className="admin-form-control"
                                        placeholder="Enter message subject"
                                        value={messageSubject}
                                        onChange={(e) => setMessageSubject(e.target.value)}
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="messageText">Message:</label>
                                    <textarea
                                        id="messageText"
                                        className="admin-form-control"
                                        rows="6"
                                        placeholder="Type your message here..."
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="admin-form-group">
                                    <label>Attachment:</label>
                                    <div
                                        className="file-upload-zone"
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <div className="upload-icon-wrapper">
                                            <i className="fas fa-cloud-upload-alt"></i>
                                        </div>
                                        <div className="upload-text-primary">Click to upload file or drag and drop</div>
                                        <div className="upload-text-secondary">Maximum file size: 10MB</div>
                                        <input
                                            type="file"
                                            id="fileAttachment"
                                            style={{ display: 'none' }}
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                        />
                                    </div>
                                    {attachment && (
                                        <div className="file-info-card">
                                            <div className="file-icon">
                                                <i className="fas fa-file"></i>
                                            </div>
                                            <span className="file-name">{attachment.name}</span>
                                            <button type="button" className="btn-remove-file" onClick={removeAttachment}>
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="admin-modal-footer">
                                    <button className="btn btn-secondary" onClick={closeMessageModal} disabled={isSending}>Cancel</button>
                                    <button className="btn btn-send" onClick={sendMessage} disabled={isSending}>
                                        {isSending ? (
                                            <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                                        ) : (
                                            <><i className="fas fa-paper-plane"></i> Send Message</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}


        </div>
    );
};

export default AdminHome;
