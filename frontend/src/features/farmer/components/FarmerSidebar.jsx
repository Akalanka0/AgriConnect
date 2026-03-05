import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../styles/FarmerSidebar.module.css';

const FarmerSidebar = ({ isActive, onLogout }) => {
    const { t } = useTranslation('farmer');
    const menuItems = [
        { path: '/farmer', exact: true, icon: 'fas fa-home', label: t('sidebar.home') },
        { path: '/farmer/crop', icon: 'fas fa-clipboard-list', label: t('sidebar.cropPlans') },
        { path: '/farmer/activity', icon: 'fas fa-tasks', label: t('sidebar.activities') },
        { path: '/farmer/pest', icon: 'fas fa-bug', label: t('sidebar.pest') },
        { path: '/farmer/harvest', icon: 'fas fa-boxes', label: t('sidebar.harvest') },
        { path: '/farmer/meeting', icon: 'fas fa-calendar-alt', label: t('sidebar.calendar') },
        { path: '/farmer/alerts', icon: 'fas fa-cloud-sun', label: t('sidebar.weather') },
        { path: '/farmer/settings', icon: 'fas fa-cog', label: t('sidebar.settings') }
    ];

    return (
        <div className={`${styles.sidebar} ${isActive ? styles.sidebarActive : ''}`} id="sidebar">
            <div className={styles.sidebarHeader}>
                <div className={styles.logo}><i className="fas fa-seedling"></i></div>
                <h1>AgriConnect</h1>
            </div>

            <div className={styles.sidebarMenu}>
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.exact}
                        className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.active : ''}`}
                    >
                        <i className={item.icon}></i>
                        <span className="menu-text">{item.label}</span>
                    </NavLink>
                ))}
            </div>

            <div className={styles.sidebarFooter}>
                <button className={styles.logoutBtn} onClick={onLogout}>
                    <i className="fas fa-right-from-bracket"></i>
                    <span className="menu-text">{t('sidebar.logout')}</span>
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
