import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../styles/InstructorLayout.module.css';

const InstructorSidebar = ({ isActive, onLogout }) => {
    const { t } = useTranslation('instructor');
    const menuItems = [
        { path: '/instructor', icon: 'fas fa-home', text: t('sidebar.home'), exact: true },
        { path: '/instructor/farmers', icon: 'fas fa-users', text: t('sidebar.farmers') },
        { path: '/instructor/crop-plans', icon: 'fas fa-clipboard-list', text: t('sidebar.cropPlans') },
        { path: '/instructor/pest-management', icon: 'fas fa-bug', text: t('sidebar.pest') },
        { path: '/instructor/reports', icon: 'fas fa-file-lines', text: t('sidebar.reports') },
        { path: '/instructor/schedule', icon: 'fas fa-calendar-days', text: t('sidebar.schedule') },
        { path: '/instructor/settings', icon: 'fas fa-cog', text: t('sidebar.settings') }
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
                        className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.activePath : ''}`}
                    >
                        <i className={item.icon}></i>
                        <span className={styles.menuText}>{item.text}</span>
                    </NavLink>
                ))}
            </div>

            <div className={styles.sidebarFooter}>
                <button className={styles.logoutBtn} onClick={onLogout}>
                    <i className="fas fa-right-from-bracket"></i>
                    <span className={styles.menuText}>{t('sidebar.logout')}</span>
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
