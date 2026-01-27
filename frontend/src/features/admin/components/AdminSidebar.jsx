import React from 'react';
import PropTypes from 'prop-types';

const AdminSidebar = ({ activePage, sidebarActive, handleNavigation, logout, location }) => {
    const menuItems = [
        { id: 'home', icon: 'fas fa-home', label: 'Home', path: '/admin' },
        { id: 'users', icon: 'fas fa-users', label: 'User Management', path: '/admin/users' },
        { id: 'engagement', icon: 'fas fa-handshake', label: 'Instructor-Farmer', path: '/admin/engagement' },
        { id: 'reports', icon: 'fas fa-file-alt', label: 'Reports', path: '/admin/reports' },
        { id: 'ids', icon: 'fas fa-id-card', label: 'User ID Management', path: '/admin/ids' },
        { id: 'settings', icon: 'fas fa-cog', label: 'Settings', path: '/admin/settings' }
    ];

    return (
        <div className={`admin-sidebar ${sidebarActive ? 'active' : ''}`}>
            <div className="admin-sidebar-header">
                <div className="logo"><i className="fas fa-seedling"></i></div>
                <h1>AgriConnect</h1>
            </div>

            <div className="admin-sidebar-menu">
                {menuItems.map((item) => (
                    <div
                        key={item.id}
                        className={`menu-item ${activePage === (item.id === 'home' ? undefined : item.id) || (item.id === 'home' && location.pathname === '/admin') ? 'active' : ''}`}
                        onClick={() => handleNavigation(item.path)}
                    >
                        <i className={item.icon}></i>
                        <span className="menu-text">{item.label}</span>
                    </div>
                ))}
            </div>

            <div className="admin-sidebar-footer">
                <button className="logout-btn" onClick={logout}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span className="menu-text">Log Out</span>
                </button>
            </div>
        </div>
    );
};

AdminSidebar.propTypes = {
    activePage: PropTypes.string,
    sidebarActive: PropTypes.bool.isRequired,
    handleNavigation: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired,
    location: PropTypes.object.isRequired
};

export default AdminSidebar;
