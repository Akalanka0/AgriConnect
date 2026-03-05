import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '@/services/adminService';
import AdminSidebar from './AdminSidebar';
import { useToast } from '@/components/common/feedback/ToastProvider';
import AdminMessageCenterUnique from './AdminMessageCenterUnique';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { getAccessToken, clearAccessToken } from '@/utils/authStorage';
import { getStoredUser, clearStoredUser } from '@/utils/userStorage';
import io from 'socket.io-client';
import { SOCKET_URL } from '@/config/realtime';
import styles from '@/features/admin/styles/AdminLayout.module.css';

const AdminLayout = () => {
    const { showToast } = useToast();
    const { t } = useTranslation('admin');
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarActive, setSidebarActive] = useState(false);
    const [isMessageCenterOpen, setIsMessageCenterOpen] = useState(false);
    const [messages, setMessages] = useState([]);

    // Get real user data
    const [userData, setUserData] = useState(() => getStoredUser() || {});
    const userAvatar = userData.avatar || userData.profile_picture || null;
    const userName = userData.full_name || 'Admin User';
    const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Update user data on storage/custom events
    useEffect(() => {
        const updateUserData = () => {
            setUserData(getStoredUser() || {});
        };

        window.addEventListener('storage', updateUserData);
        window.addEventListener('user-updated', updateUserData);

        return () => {
            window.removeEventListener('storage', updateUserData);
            window.removeEventListener('user-updated', updateUserData);
        };
    }, []);

    // Fetch messages from API
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await adminAPI.getMessages();
                const messagesData = response.data || response || [];
                
                if (Array.isArray(messagesData)) {
                    const formattedMessages = messagesData.map(msg => ({
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

    const openMessageCenter = () => {
        setIsMessageCenterOpen(true);
    };

    const closeMessageCenter = () => {
        setIsMessageCenterOpen(false);
    };

    const unreadCount = messages.filter(m => m.type === 'received' && !m.is_read).length;

    const handleMessageRead = async (messageId) => {
        if (messageId === 'refresh') {
            // Refresh signal — fetch new messages from API so all fields are correctly populated
            try {
                const response = await adminAPI.getMessages();
                const raw = response.data || response || [];
                const messagesData = Array.isArray(raw)
                    ? raw.map(msg => ({ ...msg, is_read: msg.is_read ?? false }))
                    : [];
                setMessages(messagesData);
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

    const handleNavigation = () => {
        if (window.innerWidth <= 768) {
            setSidebarActive(false);
        }
    };

    const getPageTitle = (pathname) => {
        if (pathname === '/admin' || pathname === '/admin/') return t('layout.pageHome');
        if (pathname.includes('/users')) return t('layout.pageUsers');
        if (pathname.includes('/engagement')) return t('layout.pageEngagement');
        if (pathname.includes('/reports')) return t('layout.pageReports');
        if (pathname.includes('/ids')) return t('layout.pageIds');
        if (pathname.includes('/settings')) return t('layout.pageSettings');
        return t('layout.dashboard');
    };

    const logout = () => {
        clearAccessToken();
        clearStoredUser();
        showToast(t('layout.loggingOut'), 'success');
        setTimeout(() => {
            navigate('/login');
        }, 800);
    };

    return (
        <div className={`${styles.dashboard} theme-admin`}>
            <AdminSidebar
                sidebarActive={sidebarActive}
                onNavigate={handleNavigation}
                logout={logout}
            />

            <div className={`${styles.mainContent} ${sidebarActive ? styles.active : ''}`}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <button
                            className={styles.hamburgerBtn}
                            onClick={() => setSidebarActive(prev => !prev)}
                            aria-label="Toggle navigation menu"
                        >
                            <i className="fas fa-bars"></i>
                        </button>
                        <h2>{getPageTitle(location.pathname)}</h2>
                    </div>
                    <div className={styles.userInfo}>
                        <div className={styles.notificationContainer}>
                            <button className={styles.notificationBtn} onClick={openMessageCenter}>
                                <i className="fas fa-envelope"></i>
                                {unreadCount > 0 && <div className={styles.notificationBadge}>{unreadCount}</div>}
                            </button>
                        </div>
                        <div
                            className={`${styles.avatar} ${styles.clickable}`}
                            onClick={() => navigate('/admin/settings')}
                        >
                            {userAvatar ? (
                                <img src={userAvatar} alt="User" className={styles.avatarFullImg} />
                            ) : (
                                userInitials
                            )}
                        </div>
                        <div onClick={() => navigate('/admin/settings')} className={styles.clickable}>{userName}</div>
                        <LanguageSwitcher />
                    </div>
                </div>

                <div className={styles.content}>
                    <Outlet context={{ openNotificationsModal: openMessageCenter, showToast, refreshMessages: () => handleMessageRead('refresh') }} />
                </div>
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarActive && (
                <div
                    className={styles.mobileOverlay}
                    onClick={() => setSidebarActive(false)}
                    aria-hidden="true"
                />
            )}

            {/* Admin Message Center Modal */}
            <AdminMessageCenterUnique
                isOpen={isMessageCenterOpen}
                onClose={closeMessageCenter}
                messages={messages}
                onMessageRead={handleMessageRead}
            />
        </div>
    );
};

export default AdminLayout;
