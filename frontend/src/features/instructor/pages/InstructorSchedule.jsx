import React from 'react';
import { useOutletContext } from 'react-router-dom';

const InstructorSchedule = () => {
    const { openModal } = useOutletContext();
    return (
        <>
            <div className="page-title">
                <i className="fas fa-calendar-alt"></i>
                <h2>Schedule & Availability</h2>
            </div>

            <div className="card">
                <div className="table-header">
                    <div>Upcoming Schedule</div>
                    <button className="btn btn-primary" onClick={() => openModal('addTimeSlot')}>
                        <i className="fas fa-plus"></i> Add Time Slot
                    </button>
                </div>
                <div className="table-content">
                    {/* Placeholder content for schedule - could be a calendar or list */}
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--gray)' }}>
                        <i className="fas fa-calendar" style={{ fontSize: '3em', marginBottom: '15px', opacity: 0.5 }}></i>
                        <p>No upcoming appointments scheduled for today.</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InstructorSchedule;
