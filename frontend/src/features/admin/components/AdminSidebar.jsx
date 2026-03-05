import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import styles from '../styles/AdminSidebar.module.css';

const AdminSidebar = ({ sidebarActive, onNavigate, logout }) => {
    const { t } = useTranslation('admin');
    const menuItems = [
        { id: 'home', icon: 'fas fa-home', label: t('sidebar.home'), path: '/admin' },
        { id: 'users', icon: 'fas fa-users', label: t('sidebar.users'), path: '/admin/users' },
        { id: 'engagement', icon: 'fas fa-handshake', label: t('sidebar.engagement'), path: '/admin/engagement' },
        { id: 'reports', icon: 'fas fa-file-lines', label: t('sidebar.reports'), path: '/admin/reports' },
        { id: 'ids', icon: 'fas fa-id-card', label: t('sidebar.ids'), path: '/admin/ids' },
        { id: 'settings', icon: 'fas fa-cog', label: t('sidebar.settings'), path: '/admin/settings' }
    ];

    return (
        <div className={`${styles.sidebar} ${sidebarActive ? styles.active : ''}`}>
            <div className={styles.header}>
                <div className={styles.logo}><i className="fas fa-seedling"></i></div>
                <h1>AgriConnect</h1>
            </div>

            <div className={styles.menu}>
                {menuItems.map((item) => (
                    <NavLink
                        key={item.id}
                        to={item.path}
                        end={item.id === 'home'}
                        className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.active : ''}`}
                        onClick={onNavigate}
                    >
                        <i className={item.icon}></i>
                        <span className={styles.menuText}>{item.label}</span>
                    </NavLink>
                ))}
            </div>

            <div className={styles.footer}>
                <button className={styles.logoutBtn} onClick={logout}>
                    <i className="fas fa-right-from-bracket"></i>
                    <span className={styles.menuText}>{t('sidebar.logout')}</span>
                </button>
            </div>
        </div>
    );
};

AdminSidebar.propTypes = {
    sidebarActive: PropTypes.bool.isRequired,
    onNavigate: PropTypes.func,
    logout: PropTypes.func.isRequired
};

export default AdminSidebar;
