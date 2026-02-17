import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import FarmerSidebar from './FarmerSidebar';
import FarmerMessageCenter from './FarmerMessageCenter';
import { useToast } from '../../admin/components/Toast';
import '@/features/farmer/styles/FarmerCore.css';

const FarmerLayout = () => {
    const { showToast } = useToast();
    const [isSidebarActive, setIsSidebarActive] = useState(false);
    const [isMessageCenterOpen, setIsMessageCenterOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [userData, setUserData] = useState({ full_name: 'Farmer', initials: 'F', avatar: null });

    useEffect(() => {
        const updateUserData = () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserData({
                    full_name: user.full_name,
                    initials: user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'F',
                    avatar: user.profile_picture || user.avatar
                });
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
                const res = await fetch('/api/farmer/messages', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();
                if (data.success) {
                    // Map status to is_read for MessageCenter compatibility
                    const formattedMessages = data.data.map(msg => ({
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

    const unreadCount = messages.filter(m => m.type === 'received' && !m.is_read).length;

    const handleMessageRead = async (messageId) => {
        if (messageId === 'refresh') {
            // Refresh signal from WebSocket - fetch new messages
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/farmer/messages', {
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
            // Update the messages list to mark the message as read
            setMessages(prevMessages => 
                prevMessages.map(msg => 
                    msg.id === messageId ? { ...msg, is_read: true } : msg
                )
            );
        }
    };

    const handleLogout = () => {
        navigate('/login');
    };

    const getPageTitle = (pathname) => {
        if (pathname === '/farmer' || pathname === '/farmer/') return 'Home';
        if (pathname.includes('crop')) return 'Crop Plans';
        if (pathname.includes('activity')) return 'Activities';
        if (pathname.includes('pest')) return 'Pest Management';
        if (pathname.includes('harvest')) return 'Harvest';
        if (pathname.includes('meeting')) return 'Calendar & Meetings';
        if (pathname.includes('alerts')) return 'Weather';
        if (pathname.includes('settings')) return 'Settings';
        return 'Dashboard';
    };

    return (
        <div className="app-container theme-farmer">
            <FarmerSidebar isActive={isSidebarActive} onLogout={handleLogout} />

            <div className={`main-content ${isSidebarActive ? 'sidebar-active' : ''}`} id="mainContent">
                <div className="header">
                    <div className="header-left">
                        <button className="mobile-toggle" onClick={() => setIsSidebarActive(!isSidebarActive)}>
                            <i className="fas fa-bars"></i>
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

                <div className="page-content">
                    <Outlet context={{ showToast }} />
                </div>

                {/* Farmer Message Center Modal */}
                <FarmerMessageCenter
                    isOpen={isMessageCenterOpen}
                    onClose={() => setIsMessageCenterOpen(false)}
                    messages={messages}
                    onMessageRead={handleMessageRead}
                />
            </div>
        </div>
    );
};

export default FarmerLayout;
