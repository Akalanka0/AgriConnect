import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const Calendar = () => {
    const { showToast } = useOutletContext();
    const [meetingForm, setMeetingForm] = useState({
        meetingTitle: '',
        meetingDate: '',
        meetingTime: '',
        meetingNotes: ''
    });

    useEffect(() => {
        setMeetingForm(prev => ({
            ...prev,
            meetingDate: new Date().toISOString().split('T')[0]
        }));
    }, []);

    const handleMeetingSubmit = () => {
        if (!meetingForm.meetingTitle || !meetingForm.meetingDate || !meetingForm.meetingTime) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        showToast('Meeting request submitted successfully!');
        setMeetingForm({
            meetingTitle: '',
            meetingDate: new Date().toISOString().split('T')[0],
            meetingTime: '',
            meetingNotes: ''
        });
    };

    return (
        <div className="page active" id="meeting" style={{ display: 'block' }}>
            <div className="page-title">
                <i className="fas fa-calendar-alt"></i>
                <h2>Calendar & Meetings</h2>
            </div>

            <div className="calendar-layout">
                {/* Calendar Card */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <i className="fas fa-calendar-alt"></i> My Calendar
                        </div>
                    </div>
                    <div className="card-content" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9', borderRadius: '4px' }}>
                        <div style={{ fontSize: '3em', color: '#ccc', marginBottom: '10px' }}><i className="fas fa-calendar-alt"></i></div>
                        <p style={{ color: '#888' }}>Calendar Component Unavailable</p>
                        <p style={{ fontSize: '0.8em', color: '#aaa' }}>Dependencies are missing for FullCalendar integration</p>
                    </div>
                </div>

                {/* Meeting Form Card */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <i className="fas fa-handshake"></i> Request Meeting with Agriculture Officer
                        </div>
                    </div>
                    <div className="card-content">
                        <div className="form-group">
                            <label>Meeting Title / Purpose</label>
                            <input
                                type="text"
                                className="form-control"
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
                            <label>Notes / Comments</label>
                            <textarea
                                className="form-control"
                                value={meetingForm.meetingNotes}
                                onChange={(e) => setMeetingForm({ ...meetingForm, meetingNotes: e.target.value })}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={handleMeetingSubmit}>
                            <i className="fas fa-paper-plane"></i> Request Meeting
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
