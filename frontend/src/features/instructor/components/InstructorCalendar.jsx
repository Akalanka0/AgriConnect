import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/InstructorCalendar.module.css';

const InstructorCalendar = ({ meetings }) => {
    const { t, i18n } = useTranslation('instructor');
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

    const getStatusClass = (status) => {
        switch (status) {
            case 'accepted': return styles.tagAccepted;
            case 'pending': return styles.tagPending;
            case 'reschedule': return styles.tagReschedule;
            default: return styles.tagDefault;
        }
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getMonthName = () => {
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
            .toLocaleString(i18n.language === 'si' ? 'si-LK' : 'en-US', { month: 'long' });
    };

    const getDayNames = () => {
        const base = new Date(2024, 0, 7); // Sunday
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            return d.toLocaleString(i18n.language === 'si' ? 'si-LK' : 'en-US', { weekday: 'short' });
        });
    };

    return (
        <div className={styles.calendarCard}>
            <div className={styles.calendarHeader}>
                <div className={styles.calendarTitle}>
                    <i className="fas fa-calendar-days"></i>
                    {getMonthName()} {currentDate.getFullYear()}
                </div>
                <div className={styles.calendarNav}>
                    <button className={styles.navBtn} onClick={prevMonth} title={t('calendar.prevMonth')}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <button className={styles.navBtn} onClick={resetToToday} title={t('calendar.today')}>
                        <i className="fas fa-circle-dot"></i>
                    </button>
                    <button className={styles.navBtn} onClick={nextMonth} title={t('calendar.nextMonth')}>
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>

            <div className={styles.calendarBody}>
                <div className={styles.gridHeader}>
                    {getDayNames().map(day => (
                        <div key={day}>{day}</div>
                    ))}
                </div>
                <div className={styles.calendarDays}>
                    {days.map((dayObj, index) => {
                        const dayMeetings = getMeetingsForDate(dayObj.date);
                        const today = isToday(dayObj.date);

                        return (
                            <div
                                key={index}
                                className={`${styles.calendarDay} ${!dayObj.currentMonth ? styles.notCurrent : ''} ${dayObj.currentMonth && today ? styles.isToday : ''}`}
                            >
                                <div className={styles.dayNum}>{dayObj.day}</div>
                                <div className={styles.meetingTags}>
                                    {dayMeetings.map(m => (
                                        <div
                                            key={m.id}
                                            className={`${styles.meetingTag} ${getStatusClass(m.status)}`}
                                            title={`${m.meetingTime} - ${m.meetingTitle} (${m.division || 'No Division'}) [${m.status}]`}
                                        >
                                            <span className={styles.meetingTime}>{m.meetingTime}</span> {m.meetingTitle}
                                            <span className={styles.meetingDivision}>{m.division}</span>
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
