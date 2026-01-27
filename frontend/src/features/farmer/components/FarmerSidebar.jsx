import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import '@/features/farmer/styles/FarmerCore.css';

const FarmerSidebar = ({ isActive, onLogout }) => {
    const menuItems = [
        { path: '/farmer', exact: true, icon: 'fas fa-home', label: 'Home' },
        { path: '/farmer/crop', icon: 'fas fa-clipboard-list', label: 'Crop Plans' },
        { path: '/farmer/activity', icon: 'fas fa-tasks', label: 'Activities' },
        { path: '/farmer/pest', icon: 'fas fa-bug', label: 'Pest Management' },
        { path: '/farmer/harvest', icon: 'fas fa-boxes', label: 'Harvest' },
        { path: '/farmer/meeting', icon: 'fas fa-calendar-alt', label: 'Calendar & Meetings' },
        { path: '/farmer/alerts', icon: 'fas fa-cloud-sun', label: 'Weather' },
        { path: '/farmer/settings', icon: 'fas fa-cog', label: 'Settings' }
    ];

    return (
        <div className={`sidebar ${isActive ? 'active' : ''}`} id="sidebar">
            <div className="sidebar-header">
                <div className="logo"><i className="fas fa-seedling"></i></div>
                <h1>AgriConnect</h1>
            </div>

            <div className="sidebar-menu">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.exact}
                        className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                    >
                        <i className={item.icon}></i>
                        <span className="menu-text">{item.label}</span>
                    </NavLink>
                ))}
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

FarmerSidebar.propTypes = {
    isActive: PropTypes.bool.isRequired,
    onLogout: PropTypes.func.isRequired
};

export default FarmerSidebar;
