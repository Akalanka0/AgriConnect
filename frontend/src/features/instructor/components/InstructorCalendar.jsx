import React, { useState, useEffect } from 'react';
import '../styles/InstructorCalendar.css';

const InstructorCalendar = ({ meetings }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [days, setDays] = useState([]);

    useEffect(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // First day of the month (0-6)
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        // Number of days in current month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const calendarDays = [];
        
        // Previous month days to fill the first week
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            calendarDays.push({
                day: prevMonthLastDay - i,
                currentMonth: false,
                date: new Date(year, month - 1, prevMonthLastDay - i)
            });
        }
        
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            calendarDays.push({
                day: i,
                currentMonth: true,
                date: new Date(year, month, i)
            });
        }
        
        // Next month days to fill the last week
        const remainingCells = 42 - calendarDays.length; // Use standard 6-row grid (42 cells)
        for (let i = 1; i <= remainingCells; i++) {
            calendarDays.push({
                day: i,
                currentMonth: false,
                date: new Date(year, month + 1, i)
            });
        }
        
        setDays(calendarDays);
    }, [currentDate]);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const resetToToday = () => {
        setCurrentDate(new Date());
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    const getMeetingsForDate = (date) => {
        const dateString = date.toISOString().split('T')[0];
        // Show accepted, pending and reschedule meetings on the instructor calendar
        return meetings.filter(m => 
            m.meetingDate === dateString && 
            (m.status === 'accepted' || m.status === 'pending' || m.status === 'reschedule')
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'accepted': return '#2e7d32'; // Green
            case 'pending': return '#3b82f6';  // Blue
            case 'reschedule': return '#f59e0b'; // Amber
            default: return '#94a3b8';
        }
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="instructor-calendar-card">
            <div className="instructor-calendar-header">
                <div className="instructor-calendar-title">
                    <i className="fas fa-calendar-alt"></i>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                <div className="instructor-calendar-nav">
                    <button className="instructor-nav-btn" onClick={prevMonth} title="Previous Month">
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <button className="instructor-nav-btn" onClick={resetToToday} title="Today">
                        <i className="fas fa-circle-dot"></i>
                    </button>
                    <button className="instructor-nav-btn" onClick={nextMonth} title="Next Month">
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            
            <div className="instructor-calendar-body">
                <div className="instructor-calendar-grid-header">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day}>{day}</div>
                    ))}
                </div>
                <div className="instructor-calendar-days">
                    {days.map((dayObj, index) => {
                        const dayMeetings = getMeetingsForDate(dayObj.date);
                        const today = isToday(dayObj.date);
                        
                        return (
                            <div 
                                key={index} 
                                className={`instructor-calendar-day ${!dayObj.currentMonth ? 'not-current' : ''} ${dayObj.currentMonth && today ? 'is-today' : ''}`}
                            >
                                <div className="instructor-day-num">{dayObj.day}</div>
                                <div className="instructor-meeting-tags">
                                    {dayMeetings.map(m => (
                                        <div 
                                            key={m.id} 
                                            className="instructor-meeting-tag" 
                                            title={`${m.meetingTime} - ${m.meetingTitle} (${m.division || 'No Division'}) [${m.status}]`}
                                            style={{ borderLeftColor: getStatusColor(m.status), color: getStatusColor(m.status) }}
                                        >
                                            <span style={{ fontWeight: '800' }}>{m.meetingTime}</span> {m.meetingTitle} 
                                            <span style={{ fontSize: '0.65rem', opacity: 0.8, display: 'block' }}>{m.division}</span>
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

export default InstructorCalendar;
