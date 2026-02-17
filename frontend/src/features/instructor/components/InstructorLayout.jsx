import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import InstructorSidebar from './InstructorSidebar';
import InstructorMessageModal from './modals/InstructorMessageModal';
import AddFarmerModal from './modals/AddFarmerModal';
import RatingsModal from './modals/RatingsModal';
import WeatherDetailModal from './modals/WeatherDetailModal';
import InstructorMessageCenter from './InstructorMessageCenter';
import { useToast } from '../../admin/components/Toast';
import '@/features/instructor/styles/InstructorDash.css'; // Independent styles

const InstructorLayout = () => {
    const { showToast } = useToast();
    const [isSidebarActive, setIsSidebarActive] = useState(false);
    const [isMessageCenterOpen, setIsMessageCenterOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [userData, setUserData] = useState({ full_name: 'Instructor', initials: 'I' });

    useEffect(() => {
        let isMounted = true;
        
        const updateUserData = () => {
            try {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : {};
                if (user.full_name && isMounted) {
                    setUserData({
                        full_name: user.full_name,
                        initials: user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
                        avatar: user.profile_picture || user.avatar
                    });
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        };

        // Initial load
        updateUserData();

        // Listen for updates
        window.addEventListener('userProfileUpdated', updateUserData);
        window.addEventListener('storage', updateUserData);

        const fetchMessages = async () => {
            if (!isMounted) return;
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/instructor/messages', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success && isMounted) {
                    // Map status to is_read for MessageCenter compatibility
                    const formattedMessages = data.data.map(msg => ({
                        ...msg,
                        is_read: msg.status === 'read'
                    }));
                    setMessages(formattedMessages);
                }
            } catch (error) {
                if (isMounted) console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();

        // Cleanup function
        return () => {
            isMounted = false;
            window.removeEventListener('userProfileUpdated', updateUserData);
            window.removeEventListener('storage', updateUserData);
        };
    }, []);

    const unreadCount = messages.filter(m => m.type === 'received' && !m.is_read).length;

    const handleMessageRead = async (messageId) => {
        if (messageId === 'refresh') {
            // Refresh signal from WebSocket - fetch new messages
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/instructor/messages', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setMessages(data.data || []);
                }
            } catch (error) {
                console.error('Failed to refresh messages:', error);
            }
        } else {
            // Update messages list to mark message as read
            setMessages(prevMessages => 
                prevMessages.map(msg => 
                    msg.id === messageId ? { ...msg, is_read: true } : msg
                )
            );
        }
    };

    // Modal Management in Layout to support global triggers from pages
    const [showModals, setShowModals] = useState({
        sendMessage: false,
        addFarmer: false,
        addTimeSlot: false,
        feedback: false,
        help: false,
        ratings: false,
        weather: false
    });

    const openModal = (modalName) => {
        setShowModals({ ...showModals, [modalName]: true });
    };

    const closeModal = (modalName) => {
        setShowModals({ ...showModals, [modalName]: false });
    };

    const handleLogout = () => {
        showToast('Logging out...', 'success');
        setTimeout(() => {
            navigate('/login');
        }, 800);
    };

    const getPageTitle = (pathname) => {
        if (pathname === '/instructor' || pathname === '/instructor/') return 'Home';
        if (pathname.includes('farmers')) return 'Farmer Management';
        if (pathname.includes('crop-plans')) return 'Crop Plan Management';
        if (pathname.includes('pest-management')) return 'Pest & Disease Management';
        if (pathname.includes('reports')) return 'Reports';
        if (pathname.includes('schedule')) return 'Schedule & Availability';
        if (pathname.includes('settings')) return 'Settings';
        return 'Dashboard';
    };

    return (
        <div className="app-container theme-instructor">

            <InstructorSidebar isActive={isSidebarActive} onLogout={handleLogout} />

            <div className={`main-content ${isSidebarActive ? 'sidebar-active' : ''}`} id="mainContent">
                {/* Header */}
                <div className="header">
                    <div className="header-left">
                        <button className="mobile-toggle" onClick={() => setIsSidebarActive(!isSidebarActive)}>
                            <i className={`fas ${isSidebarActive ? 'fa-times' : 'fa-bars'}`}></i>
                        </button>
                        <h2 id="pageHeader">{getPageTitle(location.pathname)}</h2>
                    </div>
                    <div className="user-info">
                        <div
                            className="notification-icon"
                            onClick={() => setIsMessageCenterOpen(true)}
                            style={{ cursor: 'pointer' }}
                            title="Message Center"
                        >
                            <i className="fas fa-envelope"></i>
                            {unreadCount > 0 && <div className="notification-badge">{unreadCount}</div>}
                        </div>
                        <div className="user-avatar" style={{
                            backgroundImage: userData.avatar ? `url(${userData.avatar.startsWith('http') ? userData.avatar : `/${userData.avatar}`})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundColor: userData.avatar ? 'transparent' : 'var(--primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {!userData.avatar && userData.initials}
                        </div>
                        <div>{userData.full_name}</div>
                    </div>
                </div>

                <div className="instructor-page-container">
                    <Outlet context={{ openModal, showToast }} />
                </div>

                {/* Instructor Message Center Modal */}
                <InstructorMessageCenter
                    isOpen={isMessageCenterOpen}
                    onClose={() => setIsMessageCenterOpen(false)}
                    messages={messages}
                    onMessageRead={handleMessageRead}
                />
            </div>

            {/* 
               Modals rendered here to overlay the entire layout
            */}
            {showModals.sendMessage && (
                <InstructorMessageModal
                    isOpen={showModals.sendMessage}
                    onClose={() => closeModal('sendMessage')}
                    onSubmit={async (formData) => {
                        try {
                            console.log('📤 [InstructorLayout] Sending Message Modal Data...');
                            for (let pair of formData.entries()) {
                                console.log(`   ${pair[0]}: ${pair[1] instanceof File ? pair[1].name : pair[1]}`);
                            }
                            const res = await fetch('/api/instructor/messages', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: formData
                            });

                            const data = await res.json();

                            if (res.ok && data.success) {
                                showToast('Message sent successfully!', 'success');
                                closeModal('sendMessage');
                            } else {
                                throw new Error(data.error?.message || 'Failed to send message');
                            }
                        } catch (error) {
                            console.error('Error sending message:', error);
                            showToast(error.message, 'error');
                            throw error;
                        }
                    }}
                />
            )}

            {showModals.addFarmer && (
                <AddFarmerModal
                    isOpen={showModals.addFarmer}
                    onClose={() => closeModal('addFarmer')}
                    onSubmit={(data) => {
                        console.log('Farmer added:', data);
                        closeModal('addFarmer');
                        showToast('Farmer added successfully!', 'success');
                    }}
                />
            )}

            {showModals.ratings && (
                <RatingsModal
                    isOpen={showModals.ratings}
                    onClose={() => closeModal('ratings')}
                />
            )}

            {showModals.weather && (
                <WeatherDetailModal
                    isOpen={showModals.weather}
                    onClose={() => closeModal('weather')}
                />
            )}

        </div>
    );
};

export default InstructorLayout;
