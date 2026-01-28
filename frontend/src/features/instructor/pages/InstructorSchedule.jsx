import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import InstructorCalendar from '../components/InstructorCalendar';

const InstructorSchedule = () => {
    const { showToast } = useOutletContext();
    const [meetings, setMeetings] = useState([]);
    const [rescheduleData, setRescheduleData] = useState({ id: null, date: '', time: '' });
    const [zoomLink, setZoomLink] = useState('');
    const [activeMeetingId, setActiveMeetingId] = useState(null);

    // Load meetings from localStorage
    useEffect(() => {
        const savedMeetings = JSON.parse(localStorage.getItem('agri_meetings') || '[]');
        setMeetings(savedMeetings);

        // Polling for updates every 5 seconds (simulating real-time)
        const interval = setInterval(() => {
            const currentMeetings = JSON.parse(localStorage.getItem('agri_meetings') || '[]');
            setMeetings(currentMeetings);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleAccept = (meetingId) => {
        if (!zoomLink) {
            showToast('Please provide a Zoom link', 'error');
            return;
        }

        const updatedMeetings = meetings.map(m => {
            if (m.id === meetingId) {
                return { ...m, status: 'accepted', zoomLink: zoomLink, farmerAcceptedSuggestion: false };
            }
            return m;
        });

        saveMeetings(updatedMeetings);
        showToast('Meeting accepted and Zoom link sent!');
        setZoomLink('');
        setActiveMeetingId(null);
    };

    const handleReschedule = (meetingId) => {
        if (!rescheduleData.date || !rescheduleData.time) {
            showToast('Please provide date and time', 'error');
            return;
        }

        const updatedMeetings = meetings.map(m => {
            if (m.id === meetingId) {
                return { 
                    ...m, 
                    status: 'reschedule', 
                    suggestedDate: rescheduleData.date, 
                    suggestedTime: rescheduleData.time,
                    farmerAcceptedSuggestion: false 
                };
            }
            return m;
        });

        saveMeetings(updatedMeetings);
        showToast('Reschedule suggestion sent to farmer!');
        setRescheduleData({ id: null, date: '', time: '' });
        setActiveMeetingId(null);
    };

    const handleDecline = (meetingId) => {
        const updatedMeetings = meetings.map(m => {
            if (m.id === meetingId) {
                return { ...m, status: 'declined' };
            }
            return m;
        });
        saveMeetings(updatedMeetings);
        showToast('Meeting declined');
    };

    const saveMeetings = (updatedMeetings) => {
        setMeetings(updatedMeetings);
        localStorage.setItem('agri_meetings', JSON.stringify(updatedMeetings));
    };

    return (
        <div className="theme-instructor">
            <div className="page-title">
                <i className="fas fa-calendar-alt"></i>
                <h2>Schedule & Availability</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
                <div className="left-column">
                    <InstructorCalendar meetings={meetings} />
                    {/* Incoming Requests */}
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <div className="card-header">
                            <div className="card-title">
                                <i className="fas fa-inbox"></i> Farmer Meeting Requests
                            </div>
                        </div>
                        <div className="card-content">
                            {meetings.filter(m => m.status === 'pending').length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                                    <i className="fas fa-envelope-open" style={{ fontSize: '3em', marginBottom: '10px', opacity: 0.2 }}></i>
                                    <p>No new requests at the moment.</p>
                                </div>
                            ) : (
                                <div className="request-list">
                                    {meetings.filter(m => m.status === 'pending').map(meeting => (
                                        <div key={meeting.id} style={{ borderBottom: '1px solid #eee', padding: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary-dark)' }}>
                                                        {meeting.meetingTitle}
                                                        {meeting.farmerAcceptedSuggestion && (
                                                            <span className="badge badge-success" style={{ marginLeft: '10px', fontSize: '0.6em' }}>Farmer Accepted New Time</span>
                                                        )}
                                                    </h4>
                                                    <p style={{ fontSize: '0.95em', color: '#444', margin: '0 0 12px 0' }}>
                                                        <i className="fas fa-calendar-day" style={{ marginRight: '8px' }}></i>
                                                        Requested for: <strong>{meeting.meetingDate}</strong> at <strong>{meeting.meetingTime}</strong>
                                                    </p>
                                                    {meeting.meetingNotes && (
                                                        <div style={{ fontSize: '0.9em', fontStyle: 'italic', background: '#f5f7f9', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #cbd5e0' }}>
                                                            <i className="fas fa-quote-left" style={{ marginRight: '8px', opacity: 0.5 }}></i>
                                                            {meeting.meetingNotes}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button 
                                                        className="btn btn-sm btn-primary" 
                                                        onClick={() => setActiveMeetingId(activeMeetingId === meeting.id ? null : meeting.id)}
                                                    >
                                                        {activeMeetingId === meeting.id ? 'Cancel' : 'Respond'}
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm" 
                                                        onClick={() => handleDecline(meeting.id)}
                                                        style={{ background: '#fee2e2', color: '#dc2626' }}
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>

                                            {activeMeetingId === meeting.id && (
                                                <div style={{ marginTop: '20px', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ marginBottom: '20px' }}>
                                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '0.95em' }}>Option 1: Accept with Zoom Link</label>
                                                        <div style={{ display: 'flex', gap: '12px' }}>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Paste Zoom link here..." 
                                                                className="form-control"
                                                                value={zoomLink}
                                                                onChange={(e) => setZoomLink(e.target.value)}
                                                                style={{ flex: 1 }}
                                                            />
                                                            <button className="btn btn-success" onClick={() => handleAccept(meeting.id)}>Accept</button>
                                                        </div>
                                                    </div>
                                                    {!meeting.farmerAcceptedSuggestion && (
                                                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '0.95em' }}>Option 2: Suggest New Time</label>
                                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                                                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                                    <div>
                                                                        <label style={{ fontSize: '0.8em', display: 'block', marginBottom: '4px' }}>Date</label>
                                                                        <input 
                                                                            type="date" 
                                                                            className="form-control"
                                                                            value={rescheduleData.date}
                                                                            onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ fontSize: '0.8em', display: 'block', marginBottom: '4px' }}>Time</label>
                                                                        <input 
                                                                            type="time" 
                                                                            className="form-control"
                                                                            value={rescheduleData.time}
                                                                            onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <button className="btn btn-primary" onClick={() => handleReschedule(meeting.id)}>Suggest</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Waiting for Response */}
                    {meetings.filter(m => m.status === 'reschedule').length > 0 && (
                        <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid var(--primary-light)' }}>
                            <div className="card-header">
                                <div className="card-title">
                                    <i className="fas fa-hourglass-half"></i> Waiting for Farmer Response
                                </div>
                            </div>
                            <div className="card-content">
                                <div className="waiting-list">
                                    {meetings.filter(m => m.status === 'reschedule').map(meeting => (
                                        <div key={meeting.id} style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <div>
                                                    <strong style={{ display: 'block', color: 'var(--primary-dark)' }}>{meeting.meetingTitle}</strong>
                                                    <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>
                                                        Rescheduled to: {meeting.suggestedDate} at {meeting.suggestedTime}
                                                    </div>
                                                </div>
                                                <span className="badge badge-info">Awaiting Reply</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Confirmed Schedule */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <i className="fas fa-calendar-check"></i> Confirmed Appointments
                            </div>
                        </div>
                        <div className="card-content">
                            {meetings.filter(m => m.status === 'accepted').length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                    <p>No confirmed appointments yet.</p>
                                </div>
                            ) : (
                                <div className="confirmed-list">
                                    {meetings.filter(m => m.status === 'accepted').map(meeting => (
                                        <div key={meeting.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                                            <div>
                                                <strong style={{ display: 'block', marginBottom: '4px' }}>{meeting.meetingTitle}</strong>
                                                <div style={{ fontSize: '0.9em', color: '#666' }}>
                                                    <i className="far fa-clock" style={{ marginRight: '6px' }}></i>
                                                    {meeting.meetingDate} at {meeting.meetingTime}
                                                </div>
                                            </div>
                                            <a href={meeting.zoomLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-info" style={{ textDecoration: 'none' }}>
                                                <i className="fas fa-video"></i> Join Zoom
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="right-column">
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">My Availability</div>
                        </div>
                        <div className="card-content">
                            <div style={{ marginBottom: '15px' }}>
                                <p style={{ fontSize: '0.85em', color: '#666', lineHeight: '1.4' }}>Set your standard working hours for farmers to see.</p>
                            </div>
                            <div className="availability-item" style={{ marginBottom: '12px', padding: '10px', background: '#f8fafc', borderRadius: '6px' }}>
                                <strong style={{ fontSize: '0.9em' }}>Monday - Friday</strong>
                                <div style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.95em' }}>08:00 AM - 04:00 PM</div>
                            </div>
                            <div className="availability-item" style={{ marginBottom: '20px', padding: '10px', background: '#f8fafc', borderRadius: '6px' }}>
                                <strong style={{ fontSize: '0.9em' }}>Saturday</strong>
                                <div style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.95em' }}>08:00 AM - 12:00 PM</div>
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%' }}>Update Hours</button>
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '20px', background: '#ecfdf5', border: '1px solid #d1fae5' }}>
                        <div className="card-content" style={{ textAlign: 'center', padding: '20px' }}>
                            <i className="fas fa-info-circle" style={{ color: '#059669', fontSize: '1.5em', marginBottom: '10px' }}></i>
                            <p style={{ fontSize: '0.85em', color: '#059669', lineHeight: '1.4' }}>
                                Farmers can only request meetings during your availability.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorSchedule;
