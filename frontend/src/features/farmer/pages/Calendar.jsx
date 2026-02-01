import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../styles/FarmerCalendar.css';

const FarmerCalendar = ({ meetings }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [days, setDays] = useState([]);

    useEffect(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const calendarDays = [];
        // Previous month days to fill the first week
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            calendarDays.push({ day: prevMonthLastDay - i, currentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
        }
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            calendarDays.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
        }
        // Next month days to fill the last week
        const totalCells = Math.ceil(calendarDays.length / 7) * 7;
        const nextMonthDays = totalCells - calendarDays.length;
        for (let i = 1; i <= nextMonthDays; i++) {
            calendarDays.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
        }
        
        setDays(calendarDays);
    }, [currentDate]);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    const getMeetingsForDate = (date) => {
        const dateString = date.toISOString().split('T')[0];
        return meetings.filter(m => 
            m.meetingDate === dateString && 
            (m.status === 'accepted' || m.status === 'pending')
        );
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="calendar-card-optimized">
            <div className="calendar-controls">
                <div className="calendar-current-month">
                    <i className="fas fa-calendar-alt"></i>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                <div className="calendar-nav-buttons">
                    <button className="calendar-btn-icon" onClick={prevMonth} title="Previous Month">
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <button className="calendar-btn-icon" onClick={() => setCurrentDate(new Date())} title="Today">
                        <i className="fas fa-circle-dot"></i>
                    </button>
                    <button className="calendar-btn-icon" onClick={nextMonth} title="Next Month">
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            
            <div className="calendar-container">
                <div className="calendar-grid-header">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day}>{day}</div>
                    ))}
                </div>
                <div className="calendar-days-grid">
                    {days.map((dayObj, index) => {
                        const dayMeetings = getMeetingsForDate(dayObj.date);
                        return (
                            <div 
                                key={index} 
                                className={`calendar-day-cell ${!dayObj.currentMonth ? 'empty-cell' : ''} ${dayObj.currentMonth && isToday(dayObj.date) ? 'today-cell' : ''}`}
                            >
                                <div className="day-number">{dayObj.day}</div>
                                <div className="meeting-indicator-container">
                                    {dayMeetings.map(m => (
                                        <div 
                                            key={m.id} 
                                            className={`calendar-meeting-tag tag-${m.status}`} 
                                            title={`${m.status.toUpperCase()}: ${m.meetingTime} - ${m.meetingTitle} (${m.division || 'No Division'})`}
                                        >
                                            <span className="tag-status-dot"></span>
                                            {m.meetingTime} {m.meetingTitle}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Static mock data that resets on refresh
const INITIAL_MOCK_MEETINGS = [
    {
        id: 'mock-1',
        meetingTitle: 'Pest Control Advice',
        meetingDate: new Date().toISOString().split('T')[0],
        meetingTime: '10:00',
        meetingDuration: '30',
        meetingNotes: 'Need urgent help with aphids in my tomato crop.',
        status: 'pending',
        requestedBy: 'farmer',
        farmerId: 'FARM-2026-0001',
        division: 'Kebithigollewa',
        createdAt: new Date().toISOString()
    },
    {
        id: 'mock-2',
        meetingTitle: 'Soil Testing Consultation',
        meetingDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0],
        meetingTime: '14:00',
        meetingDuration: '45',
        meetingNotes: 'Discussing the recent soil report results.',
        status: 'accepted',
        requestedBy: 'farmer',
        farmerId: 'FARM-2026-0001',
        instructorName: 'Aruna Shantha',
        instructorId: 'INST-2026-0007',
        division: 'Padaviya',
        createdAt: new Date().toISOString(),
        zoomLink: 'https://zoom.us/j/123456789'
    },
    {
        id: 'mock-3',
        meetingTitle: 'Irrigation Planning',
        meetingDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
        meetingTime: '09:00',
        meetingDuration: '60',
        meetingNotes: 'Planning the new drip irrigation system.',
        status: 'reschedule',
        requestedBy: 'farmer',
        farmerId: 'FARM-2026-0001',
        instructorName: 'Aruna Shantha',
        instructorId: 'INST-2026-0007',
        division: 'Rambewa',
        suggestedDate: new Date(new Date().setDate(new Date().getDate() + 6)).toISOString().split('T')[0],
        suggestedTime: '11:00',
        createdAt: new Date().toISOString()
    }
];

const Calendar = () => {
    const { showToast } = useOutletContext();
    const todayStr = new Date().toISOString().split('T')[0];

    // Initialize meetings: load user data from localStorage but ALWAYS add fresh mock data
    const [meetings, setMeetings] = useState(() => {
        const saved = localStorage.getItem('agri_meetings');
        const userMeetings = saved ? JSON.parse(saved).filter(m => !String(m.id).startsWith('mock-')) : [];
        return [...INITIAL_MOCK_MEETINGS, ...userMeetings];
    });

    const [meetingForm, setMeetingForm] = useState({
        meetingTitle: '',
        meetingDate: todayStr,
        meetingTime: '',
        meetingDuration: '30',
        meetingNotes: '',
        division: ''
    });

    const [availableDivisions] = useState(['Kebithigollewa', 'Padaviya', 'Rambewa']); // Mock available divisions for the farmer

    const [cancellingMeetingId, setCancellingMeetingId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [viewingMeetingId, setViewingMeetingId] = useState(null);

    useEffect(() => {
        const loadMeetings = () => {
            const saved = localStorage.getItem('agri_meetings');
            if (saved) {
                const userMeetings = JSON.parse(saved).filter(m => !String(m.id).startsWith('mock-'));
                setMeetings(prev => {
                    // Keep mock meetings from current state (which might have session-level changes)
                    const currentMocks = prev.filter(m => String(m.id).startsWith('mock-'));
                    return [...currentMocks, ...userMeetings];
                });
            }
        };

        const interval = setInterval(loadMeetings, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleMeetingSubmit = () => {
        const now = new Date();
        const currentTodayStr = now.toISOString().split('T')[0];
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        if (!meetingForm.meetingTitle || !meetingForm.meetingDate || !meetingForm.meetingTime || !meetingForm.division) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        // Validate date is not in the past
        if (meetingForm.meetingDate < currentTodayStr) {
            showToast('Cannot select a past date', 'error');
            return;
        }

        // Validate time is not in the past for today
        if (meetingForm.meetingDate === currentTodayStr) {
            if (meetingForm.meetingTime < currentTime) {
                showToast('Cannot select a past time for today', 'error');
                return;
            }
        }

        const newMeeting = {
            id: Date.now(),
            ...meetingForm,
            status: 'pending',
            requestedBy: 'farmer',
            farmerId: 'FARM-2026-0001',
            createdAt: new Date().toISOString()
        };

        const updatedMeetings = [...meetings, newMeeting];
        setMeetings(updatedMeetings);
        
        // Save ONLY user meetings to localStorage
        const userMeetingsOnly = updatedMeetings.filter(m => !String(m.id).startsWith('mock-'));
        localStorage.setItem('agri_meetings', JSON.stringify(userMeetingsOnly));
        
        showToast('Meeting request sent successfully!');
        setMeetingForm({
            meetingTitle: '',
            meetingDate: todayStr,
            meetingTime: '',
            meetingDuration: '30',
            meetingNotes: '',
            division: ''
        });
    };

    const handleCancelRequest = (meetingId) => {
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
        
        // Update session state
        setMeetings(updatedMeetings);
        
        // Persist only user-created meetings. Mock meetings reset on refresh.
        const userMeetingsOnly = updatedMeetings.filter(m => !String(m.id).startsWith('mock-'));
        localStorage.setItem('agri_meetings', JSON.stringify(userMeetingsOnly));
        
        setCancellingMeetingId(null);
        setCancelReason('');
        showToast('Meeting request cancelled');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <span className="badge badge-warning">Pending</span>;
            case 'accepted': return <span className="badge badge-success">Confirmed</span>;
            case 'reschedule': return <span className="badge badge-info">Reschedule</span>;
            case 'declined': return <span className="badge badge-danger">Declined</span>;
            case 'cancelled':
                return <span className="badge badge-secondary">Cancelled</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    return (
        <div className="calendar-page-container" id="meeting">
            <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-calendar-alt"></i>
                    <h2>Farmer Calendar</h2>
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
                    ID: FARM-2026-0001
                </div>
            </div>

            <div className="calendar-layout">
                <div className="calendar-section">
                    <FarmerCalendar meetings={meetings} />
                </div>

                <div className="request-section">
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <i className="fas fa-handshake"></i> Request Meeting
                            </div>
                        </div>
                        <div className="card-content">
                            <div className="form-grid-layout">
                                <div className="form-group">
                                    <label>Purpose of Meeting</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. Pest Control Advice"
                                        value={meetingForm.meetingTitle}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, meetingTitle: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Instructor Division</label>
                                    <select 
                                        className="form-control"
                                        value={meetingForm.division}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, division: e.target.value })}
                                    >
                                        <option value="">Select Division</option>
                                        {availableDivisions.map(div => (
                                            <option key={div} value={div}>{div}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Preferred Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        min={todayStr}
                                        value={meetingForm.meetingDate}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Preferred Time & Duration</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={meetingForm.meetingTime}
                                            onChange={(e) => setMeetingForm({ ...meetingForm, meetingTime: e.target.value })}
                                        />
                                        <select 
                                            className="form-control"
                                            value={meetingForm.meetingDuration}
                                            onChange={(e) => setMeetingForm({ ...meetingForm, meetingDuration: e.target.value })}
                                        >
                                            <option value="15">15 Mins</option>
                                            <option value="30">30 Mins</option>
                                            <option value="45">45 Mins</option>
                                            <option value="60">1 Hour</option>
                                            <option value="90">1.5 Hours</option>
                                            <option value="120">2 Hours</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Additional Notes</label>
                                <textarea
                                    className="form-control"
                                    placeholder="Briefly describe your issue..."
                                    value={meetingForm.meetingNotes}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, meetingNotes: e.target.value })}
                                    style={{ height: '80px' }}
                                />
                            </div>
                            <button className="btn btn-primary submit-btn" onClick={handleMeetingSubmit}>
                                <i className="fas fa-paper-plane"></i> Send Request
                            </button>
                        </div>
                    </div>
                </div>

                <div className="tables-section">
                    {/* All Requests */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <i className="fas fa-clock"></i> My Requests
                            </div>
                        </div>
                        <div className="card-content">
                            {meetings.filter(m => m.status !== 'accepted').length === 0 ? (
                                <p className="no-requests">No active requests.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Division</th>
                                                <th>Requested Time</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {meetings.filter(m => m.status !== 'accepted').map(meeting => (
                                                <React.Fragment key={meeting.id}>
                                                    <tr>
                                                        <td>
                                                            <div className="meeting-title-row">{meeting.meetingTitle}</div>
                                                            {meeting.instructorName && (
                                                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>
                                                                    <i className="fas fa-user-tie" style={{ marginRight: '6px', fontSize: '0.8rem' }}></i>
                                                                    {meeting.instructorName}
                                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500', marginLeft: '8px' }}>
                                                                        (ID: {meeting.instructorId})
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {meeting.status === 'reschedule' && (
                                                                <div className="suggestion-badge">
                                                                    <i className="fas fa-info-circle"></i> Suggested: {meeting.suggestedDate} at {meeting.suggestedTime}
                                                                </div>
                                                            )}
                                                            {meeting.status === 'declined' && (
                                                                <div className="declined-info">
                                                                    Unavailable for this slot
                                                                </div>
                                                            )}
                                                            {meeting.status === 'cancelled' && meeting.cancelReason && (
                                                                <div className="cancelled-reason-text">
                                                                    <strong>Reason:</strong> {meeting.cancelReason}
                                                                </div>
                                                            )}
                                                            {cancellingMeetingId === meeting.id && (
                                                                <div className="cancel-reason-box">
                                                                    <textarea 
                                                                        placeholder="Why are you cancelling this request?"
                                                                        value={cancelReason}
                                                                        onChange={(e) => setCancelReason(e.target.value)}
                                                                        rows="2"
                                                                    />
                                                                    <div className="cancel-actions">
                                                                        <button 
                                                                            className="btn btn-sm btn-link text-muted"
                                                                            onClick={() => setCancellingMeetingId(null)}
                                                                        >
                                                                            Dismiss
                                                                        </button>
                                                                        <button 
                                                                            className="btn btn-sm btn-danger"
                                                                            onClick={() => confirmCancel(meeting.id)}
                                                                        >
                                                                            Confirm Cancel
                                                                        </button>
                                                                    </div>
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
                                                        <td className="time-cell">
                                                            {meeting.meetingDate} <br/> {meeting.meetingTime}
                                                        </td>
                                                        <td>{getStatusBadge(meeting.status)}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button 
                                                                    className="btn btn-sm btn-info"
                                                                    onClick={() => setViewingMeetingId(viewingMeetingId === meeting.id ? null : meeting.id)}
                                                                    title="View Details"
                                                                >
                                                                    <i className="fas fa-eye"></i> View
                                                                </button>
                                                                {meeting.status !== 'cancelled' ? (
                                                                    <button 
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => handleCancelRequest(meeting.id)}
                                                                        title="Cancel Request"
                                                                    >
                                                                        <i className="fas fa-times"></i> Cancel
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-muted small">No actions</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {viewingMeetingId === meeting.id && (
                                                        <tr className="details-row">
                                                            <td colSpan="5">
                                                                <div className="meeting-details-expanded">
                                                                    <div className="details-grid">
                                                                        <div className="details-item">
                                                                            <label>Additional Notes:</label>
                                                                            <p>{meeting.meetingNotes || 'No notes provided.'}</p>
                                                                        </div>
                                                                        <div className="details-item">
                                                                            <label>Duration:</label>
                                                                            <p>{meeting.meetingDuration} Minutes</p>
                                                                        </div>
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

                    {/* Scheduled Meetings */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <i className="fas fa-calendar-check"></i> Scheduled Meetings
                            </div>
                        </div>
                        <div className="card-content">
                            {meetings.filter(m => m.status === 'accepted' || m.status === 'cancelled').length === 0 ? (
                                <p className="no-requests">No scheduled or cancelled meetings yet.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Division</th>
                                                <th>Meeting Time</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {meetings.filter(m => m.status === 'accepted' || m.status === 'cancelled').map(meeting => (
                                                <React.Fragment key={meeting.id}>
                                                    <tr>
                                                        <td>
                                                            <div className="meeting-title-row">{meeting.meetingTitle}</div>
                                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>
                                                                <i className="fas fa-user-tie" style={{ marginRight: '6px', fontSize: '0.8rem' }}></i>
                                                                {meeting.instructorName || 'Assigned Instructor'}
                                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500', marginLeft: '8px' }}>
                                                                    (ID: {meeting.instructorId || 'N/A'})
                                                                </span>
                                                            </div>
                                                            <div className="duration-info">
                                                                <i className="fas fa-hourglass-half"></i> {meeting.meetingDuration} Mins
                                                            </div>
                                                            {meeting.status === 'cancelled' && meeting.cancelReason && (
                                                                <div className="cancelled-reason-text">
                                                                    <strong>Reason:</strong> {meeting.cancelReason}
                                                                </div>
                                                            )}
                                                            {cancellingMeetingId === meeting.id && (
                                                                <div className="cancel-reason-box">
                                                                    <textarea 
                                                                        placeholder="Why are you cancelling this meeting?"
                                                                        value={cancelReason}
                                                                        onChange={(e) => setCancelReason(e.target.value)}
                                                                        rows="2"
                                                                    />
                                                                    <div className="cancel-actions">
                                                                        <button 
                                                                            className="btn btn-sm btn-link text-muted"
                                                                            onClick={() => setCancellingMeetingId(null)}
                                                                        >
                                                                            Dismiss
                                                                        </button>
                                                                        <button 
                                                                            className="btn btn-sm btn-danger"
                                                                            onClick={() => confirmCancel(meeting.id)}
                                                                        >
                                                                            Confirm Cancel
                                                                        </button>
                                                                    </div>
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
                                                        <td className="time-cell">
                                                            {meeting.meetingDate} <br/> {meeting.meetingTime}
                                                        </td>
                                                        <td>{getStatusBadge(meeting.status)}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button 
                                                                    className="btn btn-sm btn-info"
                                                                    onClick={() => setViewingMeetingId(viewingMeetingId === meeting.id ? null : meeting.id)}
                                                                    title="View Details"
                                                                >
                                                                    <i className="fas fa-eye"></i> View
                                                                </button>
                                                                {meeting.status === 'accepted' && (
                                                                    <button 
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => handleCancelRequest(meeting.id)}
                                                                        title="Cancel Meeting"
                                                                    >
                                                                        <i className="fas fa-times"></i> Cancel
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {meeting.status === 'cancelled' && (
                                                                <span className="text-muted small">Cancelled</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {viewingMeetingId === meeting.id && (
                                                        <tr className="details-row">
                                                            <td colSpan="5">
                                                                <div className="meeting-details-expanded">
                                                                    <div className="details-grid">
                                                                        <div className="details-item">
                                                                            <label>Notes:</label>
                                                                            <p>{meeting.meetingNotes || 'No notes provided.'}</p>
                                                                        </div>
                                                                        {meeting.zoomLink && (
                                                                            <div className="details-item">
                                                                                <label>Zoom Link:</label>
                                                                                <div className="zoom-join-box">
                                                                                    <a href={meeting.zoomLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-success">
                                                                                        <i className="fas fa-video"></i> Join Zoom Meeting
                                                                                    </a>
                                                                                    <code className="zoom-url">{meeting.zoomLink}</code>
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

export default Calendar;
