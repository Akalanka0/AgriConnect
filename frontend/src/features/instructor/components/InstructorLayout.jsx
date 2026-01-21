import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import InstructorSidebar from './InstructorSidebar';
import '@/features/instructor/styles/InstructorDash.css'; // Reusing existing styles

const InstructorLayout = () => {
    const [isSidebarActive, setIsSidebarActive] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Modal Management in Layout to support global triggers from pages
    const [showModals, setShowModals] = useState({
        sendMessage: false,
        addFarmer: false,
        addTimeSlot: false,
        feedback: false,
        help: false,
        ratings: false
    });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3000);
    };

    const openModal = (modalName) => {
        setShowModals({ ...showModals, [modalName]: true });
    };

    const closeModal = (modalName) => {
        setShowModals({ ...showModals, [modalName]: false });
    };

    const handleLogout = () => {
        showToast('Logging out...', 'success');
        setTimeout(() => {
            navigate('/login');
        }, 800);
    };

    const getPageTitle = (pathname) => {
        if (pathname === '/instructor' || pathname === '/instructor/') return 'Home';
        if (pathname.includes('farmers')) return 'Farmer Management';
        if (pathname.includes('crop-plans')) return 'Crop Plan Management';
        if (pathname.includes('pest-management')) return 'Pest & Disease Management';
        if (pathname.includes('reports')) return 'Reports & Analytics';
        if (pathname.includes('schedule')) return 'Schedule & Availability';
        if (pathname.includes('settings')) return 'Settings';
        return 'Dashboard';
    };

    return (
        <div className="app-container theme-instructor theme-blue">

            <InstructorSidebar isActive={isSidebarActive} onLogout={handleLogout} />

            <div className={`main-content ${isSidebarActive ? 'sidebar-active' : ''}`} id="mainContent">
                {/* Header */}
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
                            <div className="notification-badge">5</div> {/* Static for now, can be made dynamic later */}
                        </div>
                        <div className="user-avatar">RS</div>
                        <div>Rohan Silva</div>
                    </div>
                </div>

                {/* Page Content */}
                <Outlet context={{ showToast, openModal, closeModal, showModals }} />

                {/* Toast Notification */}
                {toast.show && (
                    <div className={`toast ${toast.type === 'error' ? 'error' : ''} show`} id="toast">
                        {toast.message}
                    </div>
                )}
            </div>

            {/* 
               Note: Modals that are global or triggered from multiple places should be placed here.
               For this refactor, I will pass the modal props down to pages via context 
               OR keep the modals in the individual pages if they are page-specific.
               
               Looking at the original code, many modals are specific.
               However, keeping them here allows 'openModal' from any page to work without 
               duplicating state in every page.
               
               For simplicity/time, I will keep the State here, but I might need to move the Modal 
               markup here too if I want them to overlay everything correctly.
            */}
        </div>
    );
};

export default InstructorLayout;
