import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import '@/features/admin/styles/AdminDash.css';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarActive, setSidebarActive] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

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
        <div className="app-container theme-admin theme-brown">
            <AdminSidebar
                activePage={activePage}
                sidebarActive={sidebarActive}
                handleNavigation={handleNavigation}
                logout={logout}
                location={location}
            />

            <div className={`main-content ${sidebarActive ? 'active' : ''}`}>
                <div className="header">
                    <div className="header-left">
                        <button className="mobile-menu-btn" onClick={() => setSidebarActive(!sidebarActive)}>
                            <i className="fas fa-bars"></i>
                        </button>
                        <h2>Admin Dashboard</h2>
                    </div>
                    <div className="user-info">
                        <div className="notification-container">
                            <button className="notification-btn" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                                <i className="fas fa-bell"></i>
                                <div className="notification-badge">3</div>
                            </button>
                            {notificationsOpen && (
                                <div className="notification-dropdown">
                                    <div className="notification-header"><h3>Notifications</h3></div>
                                    <div className="notification-item unread">
                                        <div className="notification-title">New Instructor Registration</div>
                                        <div className="notification-time">Just now</div>
                                    </div>
                                    <div className="notification-item">
                                        <div className="notification-title">Daily Report Generated</div>
                                        <div className="notification-time">2 hours ago</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="user-avatar">AD</div>
                        <div>Admin User</div>
                    </div>
                </div>

                <div className="page-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
