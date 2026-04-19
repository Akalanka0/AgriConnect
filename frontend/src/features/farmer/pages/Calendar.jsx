import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../styles/Calendar.module.css';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import { getAccessToken } from '@/utils/authStorage';
import { sanitizeExternalUrl } from '@/utils/urlSafety';

const FarmerCalendar = ({ meetings }) => {
    const { t } = useTranslation('farmer');
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
            (m.status === 'accepted' || m.status === 'pending' || m.status === 'reschedule')
        );
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className={styles.calendarCardOptimized}>
            <div className={styles.calendarControls}>
                <div className={styles.calendarCurrentMonth}>
                    <i className="fas fa-calendar-days"></i>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                <div className={styles.calendarNavButtons}>
                    <button className={styles.calendarBtnIcon} onClick={prevMonth} title={t('calendar.prevMonth')}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <button className={styles.calendarBtnIcon} onClick={() => setCurrentDate(new Date())} title={t('calendar.todayBtn')}>
                        <i className="fas fa-circle-dot"></i>
                    </button>
                    <button className={styles.calendarBtnIcon} onClick={nextMonth} title={t('calendar.nextMonth')}>
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            <div className={styles.calendarContainer}>
                <div className={styles.calendarGridHeader}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day}>{day}</div>
                    ))}
                </div>
                <div className={styles.calendarDaysGrid}>
                    {days.map((dayObj, index) => {
                        const dayMeetings = getMeetingsForDate(dayObj.date);
                        return (
                            <div
                                key={index}
                                className={`${styles.calendarDayCell} ${!dayObj.currentMonth ? styles.emptyCell : ''} ${dayObj.currentMonth && isToday(dayObj.date) ? styles.todayCell : ''}`}
                            >
                                <div className={styles.dayNumber}>{dayObj.day}</div>
                                <div className={styles.meetingIndicatorContainer}>
                                    {dayMeetings.map(m => (
                                        <div
                                            key={m.id}
                                            className={`${styles.calendarMeetingTag} ${styles['tag' + (m.status === 'reschedule' ? 'Pending' : m.status.charAt(0).toUpperCase() + m.status.slice(1))]}`}
                                            title={`${m.status.toUpperCase()}: ${m.meetingTime} - ${m.meetingTitle} (${m.division || 'No Division'})`}
                                        >
                                            <span className={styles.tagStatusDot}></span>
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
    const { t } = useTranslation('farmer');
    const todayStr = new Date().toISOString().split('T')[0];

    const [meetings, setMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);

    const [meetingForm, setMeetingForm] = useState({
        meetingTitle: '',
        meetingDate: todayStr,
        meetingTime: '',
        meetingDuration: '30',
        meetingNotes: '',
        division: ''
    });

    const [availableDivisions, setAvailableDivisions] = useState([]);
    const [locations, setLocations] = useState([]);
    const [selectedInstructorName, setSelectedInstructorName] = useState('');
    const [selectedInstructorId, setSelectedInstructorId] = useState('');
    const [cancellingMeetingId, setCancellingMeetingId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [viewingMeetingId, setViewingMeetingId] = useState(null);

    const fetchMeetings = async () => {
        try {
            const token = getAccessToken();
            const response = await fetch('/api/farmer/meetings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setMeetings(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching meetings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const token = getAccessToken();
            const response = await fetch('/api/farmer/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setProfileData(result.data);

                // Get divisions from locations
                if (result.data.locations && result.data.locations.length > 0) {
                    setLocations(result.data.locations);
                    const divisions = result.data.locations
                        .map(loc => loc.division || loc.instructorDivision)
                        .filter(Boolean);

                    // Remove duplicates
                    const uniqueDivisions = [...new Set(divisions)];
                    setAvailableDivisions(uniqueDivisions);

                    // Set default division to the first location's division
                    if (uniqueDivisions.length > 0) {
                        setMeetingForm(prev => ({
                            ...prev,
                            division: uniqueDivisions[0]
                        }));
                        const firstLoc = result.data.locations[0];
                        setSelectedInstructorName(firstLoc.assignedInstructorName || '');
                        setSelectedInstructorId(firstLoc.assignedInstructorRefId || '');
                    }
                } else if (result.data.instructor_division) {
                    // Fallback to profile-level division if no locations
                    setAvailableDivisions([result.data.instructor_division]);
                    setMeetingForm(prev => ({
                        ...prev,
                        division: result.data.instructor_division
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    useEffect(() => {
        fetchMeetings();
        fetchProfile();

        const interval = setInterval(fetchMeetings, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleMeetingSubmit = async () => {
        const now = new Date();
        const currentTodayStr = now.toISOString().split('T')[0];
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        if (!meetingForm.meetingTitle || !meetingForm.meetingDate || !meetingForm.meetingTime || !meetingForm.division) {
            showToast(t('common.fillRequired'), 'error');
            return;
        }

        // Validate date is not in the past
        if (meetingForm.meetingDate < currentTodayStr) {
            showToast(t('calendar.pastDateError'), 'error');
            return;
        }

        // Validate time is not in the past for today
        if (meetingForm.meetingDate === currentTodayStr) {
            if (meetingForm.meetingTime < currentTime) {
                showToast(t('calendar.pastTimeError'), 'error');
                return;
            }
        }

        try {
            const token = getAccessToken();
            const response = await fetch('/api/farmer/meetings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(meetingForm)
            });

            const result = await response.json();
            if (result.success) {
                showToast(t('calendar.meetingSent'));
                fetchMeetings();
                // Add window event to trigger dashboard refresh
                window.dispatchEvent(new Event('farmerActivityLogged'));
                setMeetingForm({
                    meetingTitle: '',
                    meetingDate: todayStr,
                    meetingTime: '',
                    meetingDuration: '30',
                    meetingNotes: '',
                    division: meetingForm.division
                });
            } else {
                showToast(result.error?.message || 'Failed to request meeting', 'error');
            }
        } catch (error) {
            console.error('Error requesting meeting:', error);
            showToast(t('calendar.meetingError'), 'error');
        }
    };

    const handleCancelRequest = (meetingId) => {
        setCancellingMeetingId(meetingId);
        setCancelReason('');
    };

    const confirmCancel = async (meetingId) => {
        if (!cancelReason.trim()) {
            showToast(t('calendar.cancelReasonRequired'), 'error');
            return;
        }

        try {
            const token = getAccessToken();
            const response = await fetch(`/api/farmer/meetings/${meetingId}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason: cancelReason })
            });

            const result = await response.json();
            if (result.success) {
                showToast(t('calendar.meetingCancelled'));
                fetchMeetings();
                setCancellingMeetingId(null);
                setCancelReason('');
            } else {
                showToast(result.error?.message || 'Failed to cancel meeting', 'error');
            }
        } catch (error) {
            console.error('Error cancelling meeting:', error);
            showToast(t('calendar.cancelError'), 'error');
        }
    };

    const handleAcceptReschedule = async (meeting) => {
        try {
            const token = getAccessToken();
            const response = await fetch(`/api/farmer/meetings/${meeting.id}/accept-reschedule`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    meetingDate: meeting.suggestedDate,
                    meetingTime: meeting.suggestedTime
                })
            });

            const result = await response.json();
            if (result.success) {
                showToast(t('calendar.rescheduleAccepted'));
                fetchMeetings();
            } else {
                showToast(result.error?.message || 'Failed to accept reschedule', 'error');
            }
        } catch (error) {
            console.error('Error accepting reschedule:', error);
            showToast(t('calendar.rescheduleError'), 'error');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <span className={styles.badgeWarning}>{t('calendar.badgePending')}</span>;
            case 'accepted': return <span className={styles.badgeSuccess}>{t('calendar.badgeConfirmed')}</span>;
            case 'reschedule': return <span className={styles.badgeInfo}>{t('calendar.badgeReschedule')}</span>;
            case 'declined': return <span className={styles.badgeDanger}>{t('calendar.badgeDeclined')}</span>;
            case 'cancelled': return <span className={styles.badgeSecondary}>{t('calendar.badgeCancelled')}</span>;
            default: return <span className={styles.badge}>{status}</span>;
        }
    };

    // My Requests: newest submitted first
    const requestMeetings = [...meetings.filter(m => m.status !== 'accepted')]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Scheduled Meetings: accepted only (confirmed), soonest first
    const scheduledMeetings = [...meetings.filter(m => m.status === 'accepted')]
        .sort((a, b) => new Date(a.meetingDate + 'T' + (a.meetingTime || '00:00')) - new Date(b.meetingDate + 'T' + (b.meetingTime || '00:00')));

    return (
        <div className={styles.calendarPageContainer} id="meeting">
            <div className={styles.pageTitle}>
                <i className="fas fa-calendar-days"></i>
                <h2>{t('calendar.title')}</h2>
            </div>

            <div className={styles.calendarLayout}>
                <div className={styles.requestSection}>
                    <div className={commonCardStyles.card}>
                        <div className={commonCardStyles.cardHeader}>
                            <div className={commonCardStyles.cardTitle}>
                                <i className="fas fa-handshake"></i> {t('calendar.requestMeeting')}
                            </div>
                        </div>
                        <div className={commonCardStyles.cardContent}>
                            <div className={styles.formGridLayout}>
                                <div className={styles.formGroup}>
                                    <label>{t('calendar.meetingTitle')}</label>
                                    <input
                                        type="text"
                                        className={styles.formControl}
                                        placeholder={t('calendar.meetingTitlePlaceholder')}
                                        value={meetingForm.meetingTitle}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, meetingTitle: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>{t('calendar.division')}</label>
                                    <select
                                        className={styles.formControl}
                                        value={meetingForm.division}
                                        onChange={(e) => {
                                            const selectedDiv = e.target.value;
                                            setMeetingForm({ ...meetingForm, division: selectedDiv });
                                            const loc = locations.find(l => (l.division || l.instructorDivision) === selectedDiv);
                                            setSelectedInstructorName(loc?.assignedInstructorName || '');
                                            setSelectedInstructorId(loc?.assignedInstructorRefId || '');
                                        }}
                                    >
                                        <option value="">{t('calendar.selectLocation')}</option>
                                        {locations.length > 0 ? (
                                            locations.map((loc, idx) => (
                                                <option key={idx} value={loc.division || loc.instructorDivision}>
                                                    {loc.zone ? `${loc.zone} - ` : ''}{loc.division || loc.instructorDivision}
                                                </option>
                                            ))
                                        ) : (
                                            availableDivisions.map(div => (
                                                <option key={div} value={div}>{div}</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>{t('calendar.assignedInstructor')}</label>
                                    <input
                                        type="text"
                                        className={`${styles.formControl} ${styles.disabledInput} ${selectedInstructorName ? styles.disabledInputActive : ''}`}
                                        value={selectedInstructorName}
                                        disabled
                                        placeholder={t('calendar.autoAssignInstructor')}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>{t('calendar.instructorId')}</label>
                                    <input
                                        type="text"
                                        className={`${styles.formControl} ${styles.disabledInput} ${selectedInstructorId ? styles.disabledInputActive : ''}`}
                                        value={selectedInstructorId}
                                        disabled
                                        placeholder={t('calendar.autoAssignId')}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>{t('calendar.preferredDate')}</label>
                                    <input
                                        type="date"
                                        className={styles.formControl}
                                        min={todayStr}
                                        value={meetingForm.meetingDate}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>{t('calendar.preferredTime')}</label>
                                    <div className={styles.timeDurationGrid}>
                                        <input
                                            type="time"
                                            className={styles.formControl}
                                            value={meetingForm.meetingTime}
                                            onChange={(e) => setMeetingForm({ ...meetingForm, meetingTime: e.target.value })}
                                        />
                                        <select
                                            className={styles.formControl}
                                            value={meetingForm.meetingDuration}
                                            onChange={(e) => setMeetingForm({ ...meetingForm, meetingDuration: e.target.value })}
                                        >
                                            <option value="15">{t('calendar.mins15')}</option>
                                            <option value="30">{t('calendar.mins30')}</option>
                                            <option value="45">{t('calendar.mins45')}</option>
                                            <option value="60">{t('calendar.hour1')}</option>
                                            <option value="90">{t('calendar.hour15')}</option>
                                            <option value="120">{t('calendar.hour2')}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>{t('calendar.notes')}</label>
                                <textarea
                                    className={`${styles.formControl} ${styles.notesTextarea}`}
                                    placeholder={t('calendar.notesPlaceholder')}
                                    value={meetingForm.meetingNotes}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, meetingNotes: e.target.value })}
                                />
                            </div>
                            <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary} ${styles.submitBtn}`} onClick={handleMeetingSubmit}>
                                <i className="fas fa-paper-plane"></i> {t('calendar.sendRequest')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.calendarSection}>
                    <FarmerCalendar meetings={meetings} />
                </div>

                <div className={styles.tablesSection}>
                    {/* All Requests */}
                    <div className={commonCardStyles.card}>
                        <div className={commonCardStyles.cardHeader}>
                            <div className={commonCardStyles.cardTitle}>
                                <i className="fas fa-clock"></i> {t('calendar.myRequests')}
                            </div>
                        </div>
                        <div className={commonCardStyles.cardContent}>
                            {requestMeetings.length === 0 ? (
                                <p className={styles.noRequests}>{t('calendar.noRequests')}</p>
                            ) : (
                                <div className={styles.tableResponsive}>
                                    <table className={styles.meetingsTable}>
                                        <thead>
                                            <tr>
                                                <th>{t('calendar.titleCol')}</th>
                                                <th>{t('calendar.divisionCol')}</th>
                                                <th>{t('calendar.timeCol')}</th>
                                                <th>{t('calendar.statusCol')}</th>
                                                <th>{t('calendar.actionCol')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {requestMeetings.map(meeting => (
                                                <React.Fragment key={meeting.id}>
                                                    <tr>
                                                        <td>
                                                            <div className={styles.meetingTitleRow}>{meeting.meetingTitle}</div>
                                                            {meeting.instructorName && (
                                                                <div className={styles.instructorInfoRow}>
                                                                    <i className={`fas fa-user-tie ${styles.instructorIcon}`}></i>
                                                                    {meeting.instructorName}
                                                                    <span className={styles.instructorIdSpan}>
                                                                        (ID: {meeting.instructorDisplayId || meeting.instructorId || 'N/A'})
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {meeting.status === 'reschedule' && (
                                                                <div className={styles.suggestionBadge}>
                                                                    <i className="fas fa-circle-info"></i> Suggested: {meeting.suggestedDate} at {meeting.suggestedTime}
                                                                </div>
                                                            )}
                                                            {meeting.status === 'declined' && (
                                                                <div className={styles.declinedInfo}>
                                                                    {meeting.instructorNote || 'Unavailable for this slot'}
                                                                </div>
                                                            )}
                                                            {meeting.status === 'cancelled' && meeting.cancelReason && (
                                                                <div className={styles.cancelledReasonText}>
                                                                    <strong>{t('calendar.reasonLabel')}</strong> {meeting.cancelReason}
                                                                </div>
                                                            )}
                                                            {cancellingMeetingId === meeting.id && (
                                                                <div className={styles.cancelReasonBox}>
                                                                    <textarea
                                                                        placeholder={t('calendar.cancelReasonPlaceholder')}
                                                                        value={cancelReason}
                                                                        onChange={(e) => setCancelReason(e.target.value)}
                                                                        rows="2"
                                                                    />
                                                                    <div className={styles.cancelActions}>
                                                                        <button
                                                                            className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnLink} text-muted`}
                                                                            onClick={() => setCancellingMeetingId(null)}
                                                                        >
                                                                            {t('calendar.dismiss')}
                                                                        </button>
                                                                        <button
                                                                            className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnDanger}`}
                                                                            onClick={() => confirmCancel(meeting.id)}
                                                                        >
                                                                            {t('calendar.confirmCancel')}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={styles.divisionBadge}>
                                                                {meeting.division || '-'}
                                                            </span>
                                                        </td>
                                                        <td className={styles.timeCell}>
                                                            {meeting.meetingDate} <br /> {meeting.meetingTime}
                                                        </td>
                                                        <td>{getStatusBadge(meeting.status)}</td>
                                                        <td>
                                                            <div className={styles.actionButtonsFlex}>
                                                                <button
                                                                    className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnInfo}`}
                                                                    onClick={() => setViewingMeetingId(viewingMeetingId === meeting.id ? null : meeting.id)}
                                                                    title={t('calendar.viewDetailsBtn')}
                                                                >
                                                                    <i className="fas fa-eye"></i> {t('calendar.view')}
                                                                </button>
                                                                {meeting.status === 'reschedule' && (
                                                                    <button
                                                                        className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnSuccess}`}
                                                                        onClick={() => handleAcceptReschedule(meeting)}
                                                                        title={t('calendar.acceptReschedule')}
                                                                    >
                                                                        <i className="fas fa-check"></i> {t('calendar.accept')}
                                                                    </button>
                                                                )}
                                                                {meeting.status !== 'cancelled' && meeting.status !== 'declined' ? (
                                                                    <button
                                                                        className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnOutlineDanger}`}
                                                                        onClick={() => handleCancelRequest(meeting.id)}
                                                                        title={t('calendar.cancelRequestBtn')}
                                                                    >
                                                                        <i className="fas fa-xmark"></i> {t('calendar.cancel')}
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-muted small">{t('calendar.noActions')}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {viewingMeetingId === meeting.id && (
                                                        <tr className={styles.detailsRow}>
                                                            <td colSpan="5">
                                                                <div className={styles.detailsExpanded}>
                                                                    <div className={styles.detailsGrid}>
                                                                        <div className={styles.detailsItem}>
                                                                            <label>{t('calendar.additionalNotes')}</label>
                                                                            <p>{meeting.meetingNotes || t('calendar.noNotes')}</p>
                                                                        </div>
                                                                        <div className={styles.detailsItem}>
                                                                            <label>{t('calendar.durationLabel')}</label>
                                                                            <p>{meeting.meetingDuration} {t('calendar.mins')}</p>
                                                                        </div>
                                                                        {meeting.instructorNote && (
                                                                            <div className={styles.detailsItem}>
                                                                                <label>{t('calendar.instructorNote')}</label>
                                                                                <p>{meeting.instructorNote}</p>
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

                    {/* Scheduled Meetings */}
                    <div className={commonCardStyles.card}>
                        <div className={commonCardStyles.cardHeader}>
                            <div className={commonCardStyles.cardTitle}>
                                <i className="fas fa-calendar-check"></i> {t('calendar.scheduledMeetings')}
                            </div>
                        </div>
                        <div className={commonCardStyles.cardContent}>
                            {scheduledMeetings.length === 0 ? (
                                <p className={styles.noRequests}>{t('calendar.noMeetings')}</p>
                            ) : (
                                <div className={styles.tableResponsive}>
                                    <table className={styles.meetingsTable}>
                                        <thead>
                                            <tr>
                                                <th>{t('calendar.titleCol')}</th>
                                                <th>{t('calendar.divisionCol')}</th>
                                                <th>{t('calendar.meetingTimeCol')}</th>
                                                <th>{t('calendar.statusCol')}</th>
                                                <th>{t('calendar.actionCol')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {scheduledMeetings.map(meeting => (
                                                <React.Fragment key={meeting.id}>
                                                    <tr>
                                                        <td>
                                                            <div className={styles.meetingTitleRow}>{meeting.meetingTitle}</div>
                                                            <div className={styles.instructorInfoRow}>
                                                                <i className={`fas fa-user-tie ${styles.instructorIcon}`}></i>
                                                                {meeting.instructorName || 'Assigned Instructor'}
                                                                <span className={styles.instructorIdSpan}>
                                                                    (ID: {meeting.instructorDisplayId || meeting.instructorId || 'N/A'})
                                                                </span>
                                                            </div>
                                                            <div className={styles.durationInfo}>
                                                                <i className="fas fa-hourglass-half"></i> {meeting.meetingDuration} Mins
                                                            </div>
                                                            {cancellingMeetingId === meeting.id && (
                                                                <div className={styles.cancelReasonBox}>
                                                                    <textarea
                                                                        placeholder={t('calendar.cancelScheduledPlaceholder')}
                                                                        value={cancelReason}
                                                                        onChange={(e) => setCancelReason(e.target.value)}
                                                                        rows="2"
                                                                    />
                                                                    <div className={styles.cancelActions}>
                                                                        <button
                                                                            className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnLink} text-muted`}
                                                                            onClick={() => setCancellingMeetingId(null)}
                                                                        >
                                                                            {t('calendar.dismiss')}
                                                                        </button>
                                                                        <button
                                                                            className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnDanger}`}
                                                                            onClick={() => confirmCancel(meeting.id)}
                                                                        >
                                                                            {t('calendar.confirmCancel')}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={styles.divisionBadge}>
                                                                {meeting.division || '-'}
                                                            </span>
                                                        </td>
                                                        <td className={styles.timeCell}>
                                                            {meeting.meetingDate} <br /> {meeting.meetingTime}
                                                        </td>
                                                        <td>{getStatusBadge(meeting.status)}</td>
                                                        <td>
                                                            <div className={styles.actionButtonsFlex}>
                                                                <button
                                                                    className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnInfo}`}
                                                                    onClick={() => setViewingMeetingId(viewingMeetingId === meeting.id ? null : meeting.id)}
                                                                    title={t('calendar.viewDetailsBtn')}
                                                                >
                                                                    <i className="fas fa-eye"></i> {t('calendar.view')}
                                                                </button>
                                                                <button
                                                                    className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnOutlineDanger}`}
                                                                    onClick={() => handleCancelRequest(meeting.id)}
                                                                    title={t('calendar.cancelMeetingBtn')}
                                                                >
                                                                    <i className="fas fa-xmark"></i> {t('calendar.cancel')}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {viewingMeetingId === meeting.id && (
                                                        <tr className={styles.detailsRow}>
                                                            <td colSpan="5">
                                                                <div className={styles.detailsExpanded}>
                                                                    <div className={styles.detailsGrid}>
                                                                        <div className={styles.detailsItem}>
                                                                            <label>{t('calendar.notesLabel')}</label>
                                                                            <p>{meeting.meetingNotes || t('calendar.noNotes')}</p>
                                                                        </div>
                                                                        {meeting.zoomLink && (
                                                                            <div className={styles.detailsItem}>
                                                                                <label>{t('calendar.zoomLink')}</label>
                                                                                <p>{meeting.zoomLink}</p>
                                                                            </div>
                                                                        )}
                                                                        {meeting.instructorNote && (
                                                                            <div className={styles.detailsItem}>
                                                                                <label>{t('calendar.instructorNote')}</label>
                                                                                <p>{meeting.instructorNote}</p>
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
