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
        return meetings.filter(m => m.meetingDate === dateString && m.status === 'accepted');
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
                                        <div key={m.id} className="calendar-meeting-tag" title={`${m.meetingTime} - ${m.meetingTitle}`}>
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

const Calendar = () => {
    const { showToast } = useOutletContext();
    const [meetings, setMeetings] = useState([]);
    const [meetingForm, setMeetingForm] = useState({
        meetingTitle: '',
        meetingDate: '',
        meetingTime: '',
        meetingNotes: ''
    });

    // Load meetings from localStorage
    useEffect(() => {
        const loadMeetings = () => {
            const savedMeetings = JSON.parse(localStorage.getItem('agri_meetings') || '[]');
            setMeetings(savedMeetings);
        };

        loadMeetings();
        
        // Polling for updates every 5 seconds (simulating real-time updates from instructor)
        const interval = setInterval(loadMeetings, 5000);

        setMeetingForm(prev => ({
            ...prev,
            meetingDate: new Date().toISOString().split('T')[0]
        }));

        return () => clearInterval(interval);
    }, []);

    const handleMeetingSubmit = () => {
        if (!meetingForm.meetingTitle || !meetingForm.meetingDate || !meetingForm.meetingTime) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        const newMeeting = {
            id: Date.now(),
            ...meetingForm,
            status: 'pending',
            requestedBy: 'farmer',
            createdAt: new Date().toISOString()
        };

        const updatedMeetings = [...meetings, newMeeting];
        setMeetings(updatedMeetings);
        localStorage.setItem('agri_meetings', JSON.stringify(updatedMeetings));

        showToast('Meeting request submitted successfully!');
        setMeetingForm({
            meetingTitle: '',
            meetingDate: new Date().toISOString().split('T')[0],
            meetingTime: '',
            meetingNotes: ''
        });
    };

    const handleResend = (meetingId, suggestedDate, suggestedTime) => {
        const updatedMeetings = meetings.map(m => {
            if (m.id === meetingId) {
                return { 
                    ...m, 
                    status: 'pending', 
                    meetingDate: suggestedDate || m.meetingDate,
                    meetingTime: suggestedTime || m.meetingTime,
                    farmerAcceptedSuggestion: true
                };
            }
            return m;
        });
        setMeetings(updatedMeetings);
        localStorage.setItem('agri_meetings', JSON.stringify(updatedMeetings));
        showToast('Meeting invitation resent with updated time!');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <span className="badge badge-warning">Pending</span>;
            case 'accepted': return <span className="badge badge-success">Accepted</span>;
            case 'reschedule': return <span className="badge badge-info">Reschedule</span>;
            case 'declined': return <span className="badge badge-danger">Declined</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    return (
        <div className="calendar-page-container" id="meeting">
            <div className="page-title">
                <i className="fas fa-calendar-alt"></i>
                <h2>Farmer Calendar</h2>
            </div>

            <div className="calendar-layout">
                <div className="left-column">
                    {/* Visual Calendar */}
                    <FarmerCalendar meetings={meetings} />

                    {/* Scheduled Meetings */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <i className="fas fa-calendar-check"></i> Scheduled Meetings
                            </div>
                        </div>
                        <div className="card-content">
                            {meetings.filter(m => m.status === 'accepted').length === 0 ? (
                                <div className="empty-state">
                                    <i className="fas fa-calendar-day"></i>
                                    <p>No confirmed meetings yet.</p>
                                </div>
                            ) : (
                                <div className="meeting-list">
                                    {meetings.filter(m => m.status === 'accepted').map(meeting => (
                                        <div key={meeting.id} className="meeting-item">
                                            <div className="meeting-item-header">
                                                <h4>{meeting.meetingTitle}</h4>
                                                <span className="badge badge-success">Confirmed</span>
                                            </div>
                                            <div className="meeting-item-details">
                                                <span><i className="fas fa-calendar"></i> {meeting.meetingDate}</span>
                                                <span><i className="fas fa-clock"></i> {meeting.meetingTime}</span>
                                            </div>
                                            {meeting.zoomLink && (
                                                <div className="zoom-link-container">
                                                    <i className="fas fa-video"></i>
                                                    <a href={meeting.zoomLink} target="_blank" rel="noreferrer">Join Zoom Meeting</a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

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
                                                <th>Requested Time</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {meetings.filter(m => m.status !== 'accepted').map(meeting => (
                                                <tr key={meeting.id}>
                                                    <td>
                                                        <div className="meeting-title-row">{meeting.meetingTitle}</div>
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
                                                    </td>
                                                    <td className="time-cell">
                                                        {meeting.meetingDate} <br/> {meeting.meetingTime}
                                                    </td>
                                                    <td>{getStatusBadge(meeting.status)}</td>
                                                    <td>
                                                        {meeting.status === 'reschedule' && (
                                                            <button 
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() => handleResend(meeting.id, meeting.suggestedDate, meeting.suggestedTime)}
                                                            >
                                                                Accept Suggestion
                                                            </button>
                                                        )}
                                                        {meeting.status === 'declined' && (
                                                            <button className="btn btn-sm" onClick={() => {
                                                                const filtered = meetings.filter(m => m.id !== meeting.id);
                                                                setMeetings(filtered);
                                                                localStorage.setItem('agri_meetings', JSON.stringify(filtered));
                                                            }}>Clear</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="right-column">
                    {/* Meeting Form Card */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <i className="fas fa-handshake"></i> Request Meeting
                            </div>
                        </div>
                        <div className="card-content">
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
                                <label>Preferred Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={meetingForm.meetingDate}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Preferred Time</label>
                                <input
                                    type="time"
                                    className="form-control"
                                    value={meetingForm.meetingTime}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, meetingTime: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Additional Notes</label>
                                <textarea
                                    className="form-control"
                                    placeholder="Briefly describe your issue..."
                                    value={meetingForm.meetingNotes}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, meetingNotes: e.target.value })}
                                />
                            </div>
                            <button className="btn btn-primary submit-btn" onClick={handleMeetingSubmit}>
                                <i className="fas fa-paper-plane"></i> Send Request
                            </button>
                        </div>
                    </div>

                    <div className="card instructor-tip-card">
                        <div className="card-content" style={{ padding: '15px' }}>
                            <h5 style={{ margin: '0 0 10px 0', color: '#f57f17' }}><i className="fas fa-lightbulb"></i> Tip</h5>
                            <p style={{ fontSize: '0.85em', color: '#7f5f01', lineHeight: '1.4' }}>
                                Providing detailed notes helps the instructor prepare better for your meeting.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
