import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';

const InstructorSidebar = ({ isActive, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const menuItems = [
        { path: '/instructor', icon: 'fas fa-home', text: 'Home', exact: true },
        { path: '/instructor/farmers', icon: 'fas fa-users', text: 'Farmers' },
        { path: '/instructor/crop-plans', icon: 'fas fa-clipboard-list', text: 'Crop Plans' },
        { path: '/instructor/pest-management', icon: 'fas fa-bug', text: 'Pest Management' },
        { path: '/instructor/reports', icon: 'fas fa-file-alt', text: 'Reports' },
        { path: '/instructor/schedule', icon: 'fas fa-calendar-alt', text: 'Schedule' },
        { path: '/instructor/settings', icon: 'fas fa-cog', text: 'Settings' }
    ];

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div className={`sidebar ${isActive ? 'active' : ''}`} id="sidebar">
            <div className="sidebar-header">
                <div className="logo"><i className="fas fa-seedling"></i></div>
                <h1>AgriConnect</h1>
            </div>

            <div className="sidebar-menu">
                {menuItems.map((item) => {
                    const isActivePath = item.exact
                        ? currentPath === item.path
                        : currentPath.startsWith(item.path);

                    return (
                        <div
                            key={item.path}
                            className={`menu-item ${isActivePath ? 'active' : ''}`}
                            onClick={() => handleNavigation(item.path)}
                        >
                            <i className={item.icon}></i>
                            <span className="menu-text">{item.text}</span>
                        </div>
                    );
                })}
            </div>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={onLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span className="menu-text">Log Out</span>
                </button>
            </div>
        </div>
    );
};

InstructorSidebar.propTypes = {
    isActive: PropTypes.bool.isRequired,
    onLogout: PropTypes.func.isRequired
};

export default InstructorSidebar;
