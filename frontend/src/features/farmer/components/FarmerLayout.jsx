import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import FarmerSidebar from './FarmerSidebar';
import '@/features/farmer/styles/FarmerDash.css';

const FarmerLayout = () => {
    const [isSidebarActive, setIsSidebarActive] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
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
        <div className="app-container theme-farmer theme-green">
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
                        <div className="notification-icon">
                            <i className="fas fa-bell"></i>
                            <div className="notification-badge">3</div>
                        </div>
                        <div className="user-avatar">SP</div>
                        <div>Sunil Perera</div>
                    </div>
                </div>

                <div className="page-content">
                    <Outlet context={{ showToast }} />
                </div>

                {/* Toast Notification */}
                {toast.show && (
                    <div className={`toast ${toast.type === 'error' ? 'error' : ''} show`} id="toast">
                        {toast.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FarmerLayout;
