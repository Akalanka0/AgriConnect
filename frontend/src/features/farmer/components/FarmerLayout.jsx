import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import FarmerSidebar from './FarmerSidebar';
import FarmerMessageCenterUnique from './FarmerMessageCenterUnique';
import { ToastProvider as CommonToastProvider, useToast } from '@/components/common/feedback/ToastProvider';
import { getAccessToken, clearAccessToken } from '@/utils/authStorage';
import { getStoredUser, clearStoredUser } from '@/utils/userStorage';
import io from 'socket.io-client';
import { SOCKET_URL } from '@/config/realtime';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import styles from '../styles/FarmerLayout.module.css';

const FarmerLayoutContent = () => {
    const { showToast } = useToast();
    const { t } = useTranslation('farmer');
    const [isSidebarActive, setIsSidebarActive] = useState(false);
    const [isMessageCenterOpen, setIsMessageCenterOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [userData, setUserData] = useState({ full_name: 'Farmer', initials: 'F', avatar: null });

    useEffect(() => {
        const updateUserData = () => {
            try {
                const user = getStoredUser();
                if (!user || typeof user !== 'object') return;
                const fullName = user.full_name || 'Farmer';
                const initials = fullName
                    ? fullName.split(' ').map(n => n && n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase()
                    : 'F';
                setUserData({
                    full_name: fullName,
                    initials: initials || 'F',
                    avatar: user.avatar || user.profile_picture || null
                });
            } catch (err) {
                console.error('Failed to parse user data from storage:', err);
                clearStoredUser();
            }
        };

        // Initial load
        updateUserData();

        // Listen for storage events (for cross-tab updates)
        window.addEventListener('storage', updateUserData);
        // Listen for custom event (for same-tab updates)
        window.addEventListener('user-updated', updateUserData);

        return () => {
            window.removeEventListener('storage', updateUserData);
            window.removeEventListener('user-updated', updateUserData);
        };
    }, []);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const token = getAccessToken();
                const res = await fetch('/api/farmer/messages', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    const formattedMessages = data.data.map(msg => ({
                        ...msg,
                        is_read: msg.is_read ?? false
                    }));
                    setMessages(formattedMessages);
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();
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
                    showToast(t('layout.newMessage', { subject: message.subject }), 'info');
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
                const response = await fetch('/api/farmer/messages', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && Array.isArray(data.data)) {
                        const formattedMessages = data.data.map(msg => ({
                            ...msg,
                            is_read: msg.is_read ?? false
                        }));
                        setMessages(formattedMessages);
                    }
                }
            } catch (error) {
                console.error('Failed to refresh messages:', error);
            }
        } else {
            // Update the messages list to mark the message as read
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.id === messageId ? { ...msg, is_read: true } : msg
                )
            );
        }
    };

    // Assign after handleMessageRead is defined — keeps the ref always pointing to the latest version
    refreshRef.current = () => handleMessageRead('refresh');

    const handleLogout = () => {
        clearAccessToken();
        clearStoredUser();
        showToast(t('layout.loggingOut'), 'success');
        setTimeout(() => {
            navigate('/login');
        }, 800);
    };

    const getPageTitle = (pathname) => {
        if (pathname === '/farmer' || pathname === '/farmer/') return t('layout.pageHome');
        if (pathname.includes('crop')) return t('layout.pageCrops');
        if (pathname.includes('activity')) return t('layout.pageActivities');
        if (pathname.includes('pest')) return t('layout.pagePest');
        if (pathname.includes('harvest')) return t('layout.pageHarvest');
        if (pathname.includes('meeting')) return t('layout.pageMeeting');
        if (pathname.includes('alerts')) return t('layout.pageWeather');
        if (pathname.includes('settings')) return t('layout.pageSettings');
        return t('layout.dashboard');
    };

    return (
        <div className={`${styles.appContainer} theme-farmer`}>
            <FarmerSidebar isActive={isSidebarActive} onLogout={handleLogout} />
            {isSidebarActive && (
                <div
                    className={styles.mobileOverlay}
                    onClick={() => setIsSidebarActive(false)}
                    aria-hidden="true"
                />
            )}

            <div className={`${styles.mainContent} ${isSidebarActive ? styles.sidebarActive : ''}`} id="mainContent">
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <button className={styles.mobileToggle} onClick={() => setIsSidebarActive(!isSidebarActive)}>
                            <i className="fas fa-bars"></i>
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
                                    alt={userData.full_name}
                                    className={styles.userAvatarImg}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.textContent = userData.initials;
                                    }}
                                />
                            ) : (
                                userData.initials
                            )}
                        </div>
                        <div>{userData.full_name}</div>
                        <LanguageSwitcher />
                    </div>
                </div>

                <div className={styles.pageContent}>
                    <Outlet context={{ showToast, refreshMessages: () => handleMessageRead('refresh') }} />
                </div>

                {/* Farmer Message Center Modal */}
                <FarmerMessageCenterUnique
                    isOpen={isMessageCenterOpen}
                    onClose={() => setIsMessageCenterOpen(false)}
                    messages={messages}
                    onMessageRead={handleMessageRead}
                />
            </div>
        </div>
    );
};

const FarmerLayout = () => {
    return (
        <CommonToastProvider>
            <FarmerLayoutContent />
        </CommonToastProvider>
    );
};

export default FarmerLayout;
