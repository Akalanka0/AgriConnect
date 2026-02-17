import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from "jspdf";
import AdminSidebar from './AdminSidebar';
import { ToastProvider, useToast } from './Toast';
import AdminMessageCenter from './AdminMessageCenter';
import '@/features/admin/styles/AdminDash.css';

// Portal Component for Modals
const ModalPortal = ({ children }) => {
    return ReactDOM.createPortal(children, document.body);
};

const AdminLayout = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarActive, setSidebarActive] = useState(false);
    const [isMessageCenterOpen, setIsMessageCenterOpen] = useState(false);
    const [messages, setMessages] = useState([]);

    // Get real user data
    const [userData, setUserData] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const userAvatar = userData.avatar;
    const userName = userData.full_name || 'Admin User';
    const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Update user data on storage/custom events
    useEffect(() => {
        const updateUserData = () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUserData(JSON.parse(storedUser));
            }
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
                const token = localStorage.getItem('token');
                const response = await fetch('/api/admin/messages', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                if (result.success) {
                    // Map status to is_read for MessageCenter compatibility
                    const formattedMessages = result.data.map(msg => ({
                        ...msg,
                        is_read: msg.status === 'read'
                    }));
                    setMessages(formattedMessages);
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();
    }, []);

    const openMessageCenter = () => {
        setIsMessageCenterOpen(true);
    };

    const closeMessageCenter = () => {
        setIsMessageCenterOpen(false);
    };

    const unreadCount = messages.filter(m => m.type === 'received' && !m.is_read).length;

    const handleMessageRead = async (messageId) => {
        if (messageId === 'refresh') {
            // Refresh signal from WebSocket - fetch new messages
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/admin/messages', {
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

    const getCurrentPage = () => {
        const path = location.pathname.split('/admin/')[1];
        return path || 'home';
    };

    const activePage = getCurrentPage();

    const handleNavigation = (path) => {
        navigate(path);
        if (window.innerWidth <= 768) {
            setSidebarActive(false);
        }
    };

    const logout = () => {
        navigate('/login');
    };

    return (
        <div className="admin-dashboard">
            <AdminSidebar
                activePage={activePage}
                sidebarActive={sidebarActive}
                handleNavigation={handleNavigation}
                logout={logout}
                location={location}
            />

            <div className={`admin-main-content ${sidebarActive ? 'active' : ''}`}>
                <div className="admin-header">
                    <div className="header-left">
                        <h2>Admin Dashboard</h2>
                    </div>
                    <div className="user-info">
                        <div className="notification-container">
                            <button className="notification-btn" onClick={openMessageCenter}>
                                <i className="fas fa-envelope"></i>
                                {unreadCount > 0 && <div className="notification-badge">{unreadCount}</div>}
                            </button>
                        </div>
                        <div
                            className="user-avatar clickable"
                            onClick={() => navigate('/admin/settings')}
                            style={{
                                backgroundImage: userAvatar ? `url(${userAvatar})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: userAvatar ? 'transparent' : 'var(--primary)',
                                color: 'white',
                                fontWeight: 'bold'
                            }}
                        >
                            {!userAvatar && userInitials}
                        </div>
                        <div onClick={() => navigate('/admin/settings')} className="clickable">{userName}</div>
                    </div>
                </div>

                <div className="admin-content">
                    <Outlet context={{ openNotificationsModal: openMessageCenter }} />
                </div>
            </div>

            {/* Admin Message Center Modal */}
            <AdminMessageCenter
                isOpen={isMessageCenterOpen}
                onClose={closeMessageCenter}
                messages={messages}
                onMessageRead={handleMessageRead}
            />
        </div>
    );
};

export default AdminLayout;
