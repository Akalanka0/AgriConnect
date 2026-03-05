import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import InstructorSidebar from './InstructorSidebar';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import InstructorMessageModal from './modals/InstructorMessageModal';
import RatingsModal from './modals/RatingsModal';
import InstructorWeatherModal from './modals/InstructorWeatherModal';
import InstructorMessageCenter from './InstructorMessageCenterUnique';
import { ToastProvider as CommonToastProvider, useToast } from '@/components/common/feedback/ToastProvider';
import { getAccessToken, clearAccessToken } from '@/utils/authStorage';
import { getStoredUser, clearStoredUser } from '@/utils/userStorage';
import io from 'socket.io-client';
import { SOCKET_URL } from '@/config/realtime';
import styles from '../styles/InstructorLayout.module.css';

const InstructorLayoutContent = () => {
    const { showToast } = useToast();
    const { t } = useTranslation('instructor');
    const [isSidebarActive, setIsSidebarActive] = useState(false);
    const [isMessageCenterOpen, setIsMessageCenterOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [userData, setUserData] = useState({ full_name: 'Instructor', initials: 'I' });

    // Modal Management in Layout to support global triggers from pages
    const [showModals, setShowModals] = useState({
        sendMessage: false,
        addTimeSlot: false,
        feedback: false,
        help: false,
        ratings: false,
        weather: false
    });

    useEffect(() => {
        let isMounted = true;

        const updateUserData = () => {
            try {
                const user = getStoredUser() || {};

                if (user.full_name && isMounted) {
                    setUserData({
                        full_name: user.full_name,
                        initials: user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
                        avatar: user.avatar || user.profile_picture  // Use avatar field since that's where profile picture is stored
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
        window.addEventListener('user-updated', updateUserData);
        window.addEventListener('storage', updateUserData);

        const fetchMessages = async () => {
            if (!isMounted) return;
            try {
                const token = getAccessToken();
                const res = await fetch('/api/instructor/messages', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success && isMounted) {
                    const formattedMessages = data.data.map(msg => ({
                        ...msg,
                        is_read: msg.is_read ?? false
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
            window.removeEventListener('user-updated', updateUserData);
            window.removeEventListener('storage', updateUserData);
        };
    }, []);

    // Persistent WebSocket connection for real-time messaging
    const socketRef = React.useRef(null);

    // Declared here; assigned after handleMessageRead is defined (below) to avoid temporal dead zone
    const refreshRef = React.useRef(null);

    React.useEffect(() => {
        const token = getAccessToken();
        if (token && !socketRef.current) {
            const newSocket = io(SOCKET_URL, {
                auth: { token },
                transports: ['polling', 'websocket']
            });

            newSocket.on('newMessage', (message) => {
                // Re-fetch from API so all fields (recipient, recipientDisplayId, time, type)
                // are correctly formatted by the backend — WS payload is partial and missing these
                if (refreshRef.current) refreshRef.current();

                // Show toast only for messages sent by someone else
                const currentUser = getStoredUser() || {};
                if (message.sender_id !== currentUser.id) {
                    showToast(`New message: ${message.subject}`, 'info');
                }
            });

            socketRef.current = newSocket;
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []); // Empty dependency array - connect once on mount

    const unreadCount = messages.filter(m => m.type === 'received' && !m.is_read).length;

    const handleMessageRead = async (messageId) => {
        if (messageId === 'refresh') {
            // Refresh signal — fetch new messages from API so all fields are correctly populated
            try {
                const token = getAccessToken();
                const response = await fetch('/api/instructor/messages', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && Array.isArray(data.data)) {
                        setMessages(data.data.map(msg => ({ ...msg, is_read: msg.is_read ?? false })));
                    }
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

    // Assign after handleMessageRead is defined — keeps the ref always pointing to the latest version
    refreshRef.current = () => handleMessageRead('refresh');

    const openModal = (modalName) => {
        setShowModals({ ...showModals, [modalName]: true });
    };

    const closeModal = (modalName) => {
        setShowModals({ ...showModals, [modalName]: false });
    };

    const handleLogout = () => {
        clearAccessToken();
        clearStoredUser();
        showToast(t('layout.loggingOut'), 'success');
        setTimeout(() => {
            navigate('/login');
        }, 800);
    };

    const getPageTitle = (pathname) => {
        if (pathname === '/instructor' || pathname === '/instructor/') return t('layout.pageHome');
        if (pathname.includes('farmers')) return t('layout.pageFarmers');
        if (pathname.includes('crop-plans')) return t('layout.pageCropPlans');
        if (pathname.includes('pest-management')) return t('layout.pagePest');
        if (pathname.includes('reports')) return t('layout.pageReports');
        if (pathname.includes('schedule')) return t('layout.pageSchedule');
        if (pathname.includes('settings')) return t('layout.pageSettings');
        return t('layout.dashboard');
    };

    return (
        <div className={styles.appContainer}>

            <InstructorSidebar isActive={isSidebarActive} onLogout={handleLogout} />

            {isSidebarActive && (
                <div
                    className={styles.mobileOverlay}
                    onClick={() => setIsSidebarActive(false)}
                    aria-hidden="true"
                />
            )}

            <div className={`${styles.mainContent} ${isSidebarActive ? styles.sidebarActive : ''}`} id="mainContent">
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <button className={styles.mobileToggle} onClick={() => setIsSidebarActive(!isSidebarActive)}>
                            <i className={`fas ${isSidebarActive ? 'fa-times' : 'fa-bars'}`}></i>
                        </button>
                        <h2 id="pageHeader">{getPageTitle(location.pathname)}</h2>
                    </div>
                    <div className={styles.userInfo}>
                        <button
                            type="button"
                            className={styles.notificationIcon}
                            onClick={() => setIsMessageCenterOpen(true)}
                            title="Message Center"
                        >
                            <i className="fas fa-envelope"></i>
                            {unreadCount > 0 && <div className={styles.notificationBadge}>{unreadCount}</div>}
                        </button>
                        <div className={`${styles.userAvatar} ${userData.avatar ? styles.hasImage : ''}`}>
                            {userData.avatar ? (
                                <img
                                    src={userData.avatar.startsWith('http') ? userData.avatar : `/${userData.avatar}`}
                                    alt={userData.full_name || "User Avatar"}
                                />
                            ) : (
                                userData.initials
                            )}
                        </div>
                        <div>{userData.full_name}</div>
                        <LanguageSwitcher />
                    </div>
                </div>

                <div className={styles.instructorPageContainer}>
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
                            const token = getAccessToken();
                            const res = await fetch('/api/instructor/messages', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                },
                                body: formData
                            });

                            const data = await res.json();

                            if (res.ok && data.success) {
                                showToast('Message sent successfully!', 'success');
                                closeModal('sendMessage');
                                // Refresh messages so the sent message appears in the Sent tab
                                await handleMessageRead('refresh');
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

            {showModals.ratings && (
                <RatingsModal
                    isOpen={showModals.ratings}
                    onClose={() => closeModal('ratings')}
                />
            )}

            {showModals.weather && (
                <InstructorWeatherModal
                    isOpen={showModals.weather}
                    onClose={() => closeModal('weather')}
                />
            )}

        </div>
    );
};

const InstructorLayout = () => {
    return (
        <CommonToastProvider>
            <InstructorLayoutContent />
        </CommonToastProvider>
    );
};

export default InstructorLayout;
