import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import InstructorCalendar from '../components/InstructorCalendar';

const INITIAL_INSTRUCTOR_MOCK_MEETINGS = [
    {
        id: 'mock-1',
        meetingTitle: 'Crop Disease Consultation',
        meetingDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
        meetingTime: '10:00',
        meetingNotes: 'I am seeing some yellow spots on my paddy leaves. Need urgent advice.',
        status: 'pending',
        farmerName: 'Kamal Perera',
        farmerId: 'FARM-2026-0001',
        division: 'Kebithigollewa',
        isMock: true
    },
    {
        id: 'mock-2',
        meetingTitle: 'Organic Fertilizer Advice',
        meetingDate: new Date().toISOString().split('T')[0],
        meetingTime: '14:30',
        meetingNotes: 'Want to switch to organic fertilizers for my vegetable garden.',
        status: 'accepted',
        zoomLink: 'https://zoom.us/j/123456789',
        farmerName: 'Sunil Silva',
        farmerId: 'FARM-2026-0002',
        division: 'Padaviya',
        isMock: true
    },
    {
        id: 'mock-3',
        meetingTitle: 'Soil Testing Results',
        meetingDate: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
        meetingTime: '09:00',
        meetingNotes: 'Discussing the soil test results from last week.',
        status: 'accepted',
        zoomLink: 'https://zoom.us/j/987654321',
        farmerName: 'Nimal Bandara',
        farmerId: 'FARM-2026-0003',
        division: 'Rambewa',
        isMock: true
    }
];

const InstructorSchedule = () => {
    const { showToast } = useOutletContext();
    const [meetings, setMeetings] = useState([]);
    const [rescheduleData, setRescheduleData] = useState({ id: null, date: '', time: '' });
    const [zoomLink, setZoomLink] = useState('');
    const [instructorNote, setInstructorNote] = useState('');
    const [activeMeetingId, setActiveMeetingId] = useState(null);
    const [cancellingMeetingId, setCancellingMeetingId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    // Load meetings from localStorage
    useEffect(() => {
        const loadMeetings = () => {
            const savedMeetings = JSON.parse(localStorage.getItem('agri_meetings') || '[]');
            setMeetings(prev => {
                // Keep the current state of mock meetings (to preserve session-level changes)
                const currentMocks = prev.length > 0 
                    ? prev.filter(m => m.isMock) 
                    : INITIAL_INSTRUCTOR_MOCK_MEETINGS;
                
                // Merge with saved non-mock meetings
                return [...currentMocks, ...savedMeetings];
            });
        };

        loadMeetings();

        // Polling for updates every 5 seconds (simulating real-time)
        const interval = setInterval(loadMeetings, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleAccept = (meetingId) => {
        if (!zoomLink) {
            showToast('Please provide a Zoom link', 'error');
            return;
        }

        const updatedMeetings = meetings.map(m => {
            if (m.id === meetingId) {
                return { 
                    ...m, 
                    status: 'accepted', 
                    zoomLink: zoomLink, 
                    instructorNote: instructorNote,
                    farmerAcceptedSuggestion: false 
                };
            }
            return m;
        });

        saveMeetings(updatedMeetings);
        showToast('Meeting accepted and Zoom link sent!');
        setZoomLink('');
        setInstructorNote('');
        setActiveMeetingId(null);
    };

    const handleReschedule = (meetingId) => {
        const now = new Date();
        const currentTodayStr = now.toISOString().split('T')[0];
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        if (!rescheduleData.date || !rescheduleData.time) {
            showToast('Please provide date and time', 'error');
            return;
        }

        if (rescheduleData.date < currentTodayStr) {
            showToast('Cannot suggest a past date', 'error');
            return;
        }

        if (rescheduleData.date === currentTodayStr && rescheduleData.time < currentTime) {
            showToast('Cannot suggest a past time for today', 'error');
            return;
        }

        const updatedMeetings = meetings.map(m => {
            if (m.id === meetingId) {
                return { 
                    ...m, 
                    status: 'reschedule', 
                    suggestedDate: rescheduleData.date, 
                    suggestedTime: rescheduleData.time,
                    instructorNote: instructorNote,
                    farmerAcceptedSuggestion: false 
                };
            }
            return m;
        });

        saveMeetings(updatedMeetings);
        showToast('Reschedule suggestion sent to farmer!');
        setRescheduleData({ id: null, date: '', time: '' });
        setInstructorNote('');
        setActiveMeetingId(null);
    };

    const handleDecline = (meetingId) => {
        const updatedMeetings = meetings.map(m => {
            if (m.id === meetingId) {
                return { ...m, status: 'declined', instructorNote: instructorNote };
            }
            return m;
        });
        saveMeetings(updatedMeetings);
        showToast('Meeting declined');
        setInstructorNote('');
        setActiveMeetingId(null);
    };

    const handleCancelClick = (meetingId) => {
        setCancellingMeetingId(meetingId);
        setCancelReason('');
    };

    const confirmCancel = (meetingId) => {
        if (!cancelReason.trim()) {
            showToast('Please provide a reason for cancellation', 'error');
            return;
        }

        const updatedMeetings = meetings.map(m => {
            if (m.id === meetingId) {
                return { ...m, status: 'cancelled', cancelReason: cancelReason };
            }
            return m;
        });
        saveMeetings(updatedMeetings);
        showToast('Meeting cancelled');
        setCancellingMeetingId(null);
        setCancelReason('');
    };

    const saveMeetings = (updatedMeetings) => {
        setMeetings(updatedMeetings);
        // Only save non-mock meetings to localStorage
        const nonMockMeetings = updatedMeetings.filter(m => !m.isMock);
        localStorage.setItem('agri_meetings', JSON.stringify(nonMockMeetings));
    };

    return (
        <div className="theme-instructor">
            <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-calendar-alt"></i>
                    <h2>Schedule & Availability</h2>
                </div>
                <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '600', 
                    color: '#64748b',
                    background: '#f8fafc',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                }}>
                    <i className="fas fa-id-badge" style={{ marginRight: '8px' }}></i>
                    ID: INST-2026-0007
                </div>
            </div>

            <div style={{ display: 'block' }}>
                <div className="left-column">
                    <InstructorCalendar meetings={meetings} />
                    
                    {/* Farmer Meeting Requests Section */}
                    <div className="card" style={{ marginBottom: '24px', borderTop: '4px solid #3b82f6' }}>
                        <div className="card-header" style={{ padding: '20px 24px' }}>
                            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem' }}>
                                <i className="fas fa-inbox" style={{ color: '#3b82f6' }}></i> 
                                Farmer Meeting Requests
                            </div>
                        </div>
                        <div className="card-content" style={{ padding: '0' }}>
                            {meetings.filter(m => m.status === 'pending' || m.status === 'reschedule').length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                                    <i className="fas fa-envelope-open" style={{ fontSize: '3.5em', marginBottom: '16px', opacity: 0.15 }}></i>
                                    <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No pending requests</p>
                                    <p style={{ fontSize: '0.9rem' }}>You're all caught up with your meetings!</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '16px 24px' }}>Title</th>
                                                <th>Division</th>
                                                <th>Meeting Time</th>
                                                <th>Status</th>
                                                <th style={{ padding: '16px 24px' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {meetings.filter(m => m.status === 'pending' || m.status === 'reschedule').map(meeting => (
                                                <React.Fragment key={meeting.id}>
                                                    <tr className="request-item-hover">
                                                        <td style={{ padding: '20px 24px' }}>
                                                            <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>{meeting.meetingTitle}</div>
                                                            <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                                                    <i className="fas fa-user" style={{ marginRight: '6px', fontSize: '0.8rem' }}></i>
                                                                    {meeting.farmerName || 'Farmer'}
                                                                </span>
                                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>
                                                                    ID: {meeting.farmerId || 'N/A'}
                                                                </span>
                                                            </div>
                                                            {meeting.farmerAcceptedSuggestion && (
                                                                <div style={{ marginTop: '4px' }}>
                                                                    <span className="badge badge-success" style={{ fontSize: '0.65em' }}>Farmer Accepted New Time</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span style={{ 
                                                                fontSize: '0.85rem', 
                                                                fontWeight: '600', 
                                                                color: '#475569',
                                                                background: '#f1f5f9',
                                                                padding: '4px 10px',
                                                                borderRadius: '6px'
                                                            }}>
                                                                {meeting.division || '-'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '600' }}>{meeting.meetingDate}</div>
                                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                                {meeting.meetingTime} 
                                                                {meeting.meetingDuration && ` (${meeting.meetingDuration} Mins)`}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${meeting.status === 'pending' ? 'badge-primary' : 'badge-warning'}`} style={{ textTransform: 'capitalize' }}>
                                                                {meeting.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '20px 24px' }}>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button 
                                                                    className={`btn btn-sm ${activeMeetingId === meeting.id ? 'btn-secondary' : 'btn-primary'}`}
                                                                    onClick={() => setActiveMeetingId(activeMeetingId === meeting.id ? null : meeting.id)}
                                                                >
                                                                    {activeMeetingId === meeting.id ? 'Close' : 'Respond'}
                                                                </button>
                                                                <button 
                                                                    className="btn btn-sm" 
                                                                    onClick={() => handleDecline(meeting.id)}
                                                                    style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3' }}
                                                                >
                                                                    Decline
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {activeMeetingId === meeting.id && (
                                                        <tr>
                                                            <td colSpan="5" style={{ padding: 0, borderTop: 'none' }}>
                                                                <div style={{ padding: '24px', background: '#fcfdfe', borderBottom: '1px solid #e2e8f0' }}>
                                                                    {meeting.meetingNotes && (
                                                                        <div style={{ marginBottom: '20px', fontSize: '0.9rem', color: '#475569', background: '#f8fafc', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #e2e8f0' }}>
                                                                            <strong>Farmer's Notes:</strong> {meeting.meetingNotes}
                                                                        </div>
                                                                    )}

                                                                    <div style={{ marginBottom: '20px' }}>
                                                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.8rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                            Additional Note to Farmer (Optional)
                                                                        </label>
                                                                        <textarea 
                                                                            className="form-control"
                                                                            placeholder="Add advice, instructions, or reason for rescheduling/declining..."
                                                                            value={instructorNote}
                                                                            onChange={(e) => setInstructorNote(e.target.value)}
                                                                            style={{ borderRadius: '10px', height: '80px', resize: 'none' }}
                                                                        />
                                                                    </div>

                                                                    <div style={{ marginBottom: '24px' }}>
                                                                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '700', fontSize: '0.8rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                            Option 1: Accept & Send Zoom Link
                                                                        </label>
                                                                        <div style={{ display: 'flex', gap: '12px' }}>
                                                                            <div style={{ position: 'relative', flex: 1 }}>
                                                                                <i className="fas fa-link" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                                                                                <input 
                                                                                    type="text" 
                                                                                    placeholder="Paste Zoom/Teams meeting link..." 
                                                                                    className="form-control"
                                                                                    value={zoomLink}
                                                                                    onChange={(e) => setZoomLink(e.target.value)}
                                                                                    style={{ paddingLeft: '36px', borderRadius: '10px' }}
                                                                                />
                                                                            </div>
                                                                            <button className="btn btn-success" onClick={() => handleAccept(meeting.id)} style={{ padding: '0 24px' }}>
                                                                                Confirm
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {!meeting.farmerAcceptedSuggestion && (
                                                                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                                                            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '700', fontSize: '0.8rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                                Option 2: Propose Different Time
                                                                            </label>
                                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
                                                                                <div>
                                                                                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>Date</label>
                                                                                    <input 
                                                                                        type="date" 
                                                                                        className="form-control"
                                                                                        min={new Date().toISOString().split('T')[0]}
                                                                                        value={rescheduleData.date}
                                                                                        onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                                                                                        style={{ borderRadius: '10px' }}
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>Time</label>
                                                                                    <input 
                                                                                        type="time" 
                                                                                        className="form-control"
                                                                                        value={rescheduleData.time}
                                                                                        onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                                                                                        style={{ borderRadius: '10px' }}
                                                                                    />
                                                                                </div>
                                                                                <button className="btn btn-info" onClick={() => handleReschedule(meeting.id)} style={{ padding: '0 24px' }}>
                                                                                    Propose
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Waiting for Response Section */}
                    {meetings.filter(m => m.status === 'reschedule').length > 0 && (
                        <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid #f59e0b' }}>
                            <div className="card-header">
                                <div className="card-title" style={{ fontSize: '1rem' }}>
                                    <i className="fas fa-hourglass-half" style={{ color: '#f59e0b' }}></i> Awaiting Farmer Response
                                </div>
                            </div>
                            <div className="card-content" style={{ padding: '0' }}>
                                <div className="waiting-list">
                                    {meetings.filter(m => m.status === 'reschedule').map(meeting => (
                                        <div key={meeting.id} style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <strong style={{ display: 'block', color: '#1e293b', marginBottom: '4px' }}>{meeting.meetingTitle}</strong>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>
                                                    <i className="fas fa-user" style={{ marginRight: '6px' }}></i>
                                                    {meeting.farmerName} <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>(ID: {meeting.farmerId})</span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                    <i className="far fa-clock" style={{ marginRight: '6px' }}></i>
                                                    Proposed: {meeting.suggestedDate} at {meeting.suggestedTime}
                                                </div>
                                            </div>
                                            <span className="badge" style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fef3c7' }}>Pending Reply</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Confirmed Appointments Section */}
                    <div className="card" style={{ borderTop: '4px solid #10b981' }}>
                        <div className="card-header" style={{ padding: '20px 24px' }}>
                            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem' }}>
                                <i className="fas fa-calendar-check" style={{ color: '#10b981' }}></i> 
                                Confirmed Appointments
                            </div>
                        </div>
                        <div className="card-content" style={{ padding: '0' }}>
                            {meetings.filter(m => m.status === 'accepted' || m.status === 'cancelled').length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                                    <p style={{ fontSize: '0.9rem' }}>No confirmed or cancelled appointments yet.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '16px 24px' }}>Title</th>
                                                <th>Division</th>
                                                <th>Meeting Time</th>
                                                <th>Status</th>
                                                <th style={{ padding: '16px 24px' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {meetings.filter(m => m.status === 'accepted' || m.status === 'cancelled').map(meeting => (
                                                <React.Fragment key={meeting.id}>
                                                    <tr className="request-item-hover">
                                                        <td style={{ padding: '20px 24px' }}>
                                                            <div style={{ fontWeight: '700', color: meeting.status === 'cancelled' ? '#94a3b8' : '#1e293b', marginBottom: '4px' }}>{meeting.meetingTitle}</div>
                                                            <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                                                    <i className="fas fa-user" style={{ marginRight: '6px', fontSize: '0.8rem' }}></i>
                                                                    {meeting.farmerName || 'Farmer'}
                                                                </span>
                                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>
                                                                    ID: {meeting.farmerId || 'N/A'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span style={{ 
                                                                fontSize: '0.85rem', 
                                                                fontWeight: '600', 
                                                                color: '#475569',
                                                                background: '#f1f5f9',
                                                                padding: '4px 10px',
                                                                borderRadius: '6px'
                                                            }}>
                                                                {meeting.division || '-'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontSize: '0.9rem', color: meeting.status === 'cancelled' ? '#94a3b8' : '#475569', fontWeight: '600' }}>{meeting.meetingDate}</div>
                                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                                {meeting.meetingTime} 
                                                                {meeting.meetingDuration && ` (${meeting.meetingDuration} Mins)`}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${meeting.status === 'accepted' ? 'badge-success' : 'badge-secondary'}`} style={{ textTransform: 'capitalize' }}>
                                                                {meeting.status === 'accepted' ? 'Confirmed' : 'Cancelled'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '20px 24px' }}>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button 
                                                                    className="btn btn-sm btn-info"
                                                                    onClick={() => setActiveMeetingId(activeMeetingId === meeting.id ? null : meeting.id)}
                                                                >
                                                                    <i className="fas fa-eye" style={{ marginRight: '4px' }}></i> View
                                                                </button>
                                                                {meeting.status === 'accepted' && (
                                                                    <button 
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => handleCancelClick(meeting.id)}
                                                                    >
                                                                        <i className="fas fa-times" style={{ marginRight: '4px' }}></i> Cancel
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {cancellingMeetingId === meeting.id && (
                                                            <tr>
                                                                <td colSpan="5" style={{ padding: '0', borderTop: 'none' }}>
                                                                <div style={{ padding: '20px 24px', background: '#fff1f2', borderBottom: '1px solid #fecdd3' }}>
                                                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.8rem', color: '#991b1b', textTransform: 'uppercase' }}>
                                                                        Reason for Cancellation (Required)
                                                                    </label>
                                                                    <div style={{ display: 'flex', gap: '12px' }}>
                                                                        <textarea 
                                                                            className="form-control"
                                                                            placeholder="Please explain why you need to cancel this meeting..."
                                                                            value={cancelReason}
                                                                            onChange={(e) => setCancelReason(e.target.value)}
                                                                            style={{ borderRadius: '10px', height: '60px', resize: 'none', borderColor: '#fecdd3' }}
                                                                        />
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                            <button 
                                                                                className="btn btn-sm btn-danger" 
                                                                                onClick={() => confirmCancel(meeting.id)}
                                                                                style={{ padding: '0 20px', height: '100%' }}
                                                                            >
                                                                                Confirm
                                                                            </button>
                                                                            <button 
                                                                                className="btn btn-sm btn-link" 
                                                                                onClick={() => setCancellingMeetingId(null)}
                                                                                style={{ color: '#64748b' }}
                                                                            >
                                                                                Dismiss
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    
                                                    {activeMeetingId === meeting.id && (
                                                        <tr>
                                                            <td colSpan="5" style={{ padding: 0, borderTop: 'none' }}>
                                                                <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #edf2f7' }}>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                                                        <div>
                                                                            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Notes</label>
                                                                            <p style={{ fontSize: '0.9rem', color: '#334155', margin: 0, lineHeight: '1.5' }}>{meeting.meetingNotes || 'No notes provided.'}</p>
                                                                        </div>
                                                                        {meeting.zoomLink && meeting.status === 'accepted' && (
                                                                            <div>
                                                                                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Meeting Link</label>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                                    <a href={meeting.zoomLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-success" style={{ padding: '6px 12px' }}>
                                                                                        <i className="fas fa-video"></i> Join
                                                                                    </a>
                                                                                    <code style={{ fontSize: '0.8rem', color: '#64748b', wordBreak: 'break-all' }}>{meeting.zoomLink}</code>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorSchedule;
