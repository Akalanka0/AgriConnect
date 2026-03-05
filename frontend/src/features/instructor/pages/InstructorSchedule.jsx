import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import InstructorCalendar from '../components/InstructorCalendar';
import styles from '../styles/InstructorSchedule.module.css';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import { getAccessToken } from '@/utils/authStorage';
import { sanitizeExternalUrl } from '@/utils/urlSafety';

const InstructorSchedule = () => {
    const { showToast } = useOutletContext();
    const { t } = useTranslation('instructor');
    const [meetings, setMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(null); // track which meeting is being updated
    const [rescheduleData, setRescheduleData] = useState({ id: null, date: '', time: '' });
    const [zoomLink, setZoomLink] = useState('');
    const [instructorNote, setInstructorNote] = useState('');
    const [activeMeetingId, setActiveMeetingId] = useState(null);
    const [cancellingMeetingId, setCancellingMeetingId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [decliningMeetingId, setDecliningMeetingId] = useState(null);
    const [declineReason, setDeclineReason] = useState('');

    // Load meetings from API
    const fetchMeetings = useCallback(async () => {
        try {
            const token = getAccessToken();
            const response = await fetch('/api/instructor/meetings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setMeetings(result.data);
            } else {
                showToast(result.error?.message || 'Failed to fetch meetings', 'error');
            }
        } catch (error) {
            console.error('Error fetching meetings:', error);
            showToast(t('schedule.fetchError'), 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchMeetings();
        // Polling for updates every 10 seconds
        const interval = setInterval(fetchMeetings, 10000);
        return () => clearInterval(interval);
    }, []); // Remove fetchMeetings dependency to prevent memory leak

    const updateMeeting = async (meetingId, updateData) => {
        setIsActionLoading(meetingId);
        try {
            const token = getAccessToken();
            const response = await fetch(`/api/instructor/meetings/${meetingId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();
            if (result.success) {
                showToast(result.message || 'Meeting updated successfully!');
                fetchMeetings(); // Refresh the list
                return true;
            } else {
                showToast(result.error?.message || 'Failed to update meeting', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error updating meeting:', error);
            showToast(t('schedule.updateError'), 'error');
            return false;
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleAccept = async (meetingId) => {
        if (!zoomLink) {
            showToast(t('schedule.zoomRequired'), 'error');
            return;
        }

        const success = await updateMeeting(meetingId, {
            status: 'accepted',
            zoomLink,
            instructorNote
        });

        if (success) {
            setZoomLink('');
            setInstructorNote('');
            setActiveMeetingId(null);
        }
    };

    const handleReschedule = async (meetingId) => {
        const now = new Date();
        const currentTodayStr = now.toISOString().split('T')[0];
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        if (!rescheduleData.date || !rescheduleData.time) {
            showToast(t('schedule.dateTimeRequired'), 'error');
            return;
        }

        if (rescheduleData.date < currentTodayStr) {
            showToast(t('schedule.pastDateError'), 'error');
            return;
        }

        if (rescheduleData.date === currentTodayStr && rescheduleData.time < currentTime) {
            showToast(t('schedule.pastTimeError'), 'error');
            return;
        }

        const success = await updateMeeting(meetingId, {
            status: 'reschedule',
            suggestedDate: rescheduleData.date,
            suggestedTime: rescheduleData.time,
            instructorNote
        });

        if (success) {
            setRescheduleData({ id: null, date: '', time: '' });
            setInstructorNote('');
            setActiveMeetingId(null);
        }
    };

    const handleDeclineClick = (meetingId) => {
        setDecliningMeetingId(meetingId);
        setDeclineReason('');
    };

    const handleDecline = async (meetingId) => {
        if (!declineReason.trim()) {
            showToast(t('schedule.declineReasonMissing'), 'error');
            return;
        }

        const success = await updateMeeting(meetingId, {
            status: 'declined',
            cancelReason: declineReason,
            instructorNote: declineReason
        });

        if (success) {
            setDeclineReason('');
            setDecliningMeetingId(null);
            setActiveMeetingId(null);
        }
    };

    const handleCancelClick = (meetingId) => {
        setCancellingMeetingId(meetingId);
        setCancelReason('');
    };

    const confirmCancel = async (meetingId) => {
        if (!cancelReason.trim()) {
            showToast(t('schedule.cancelReasonMissing'), 'error');
            return;
        }

        const success = await updateMeeting(meetingId, {
            status: 'cancelled',
            cancelReason
        });

        if (success) {
            setCancellingMeetingId(null);
            setCancelReason('');
        }
    };

    // Farmer Meeting Requests: oldest pending first (FIFO)
    // Pending first (FIFO - oldest request first), then cancelled (most recently cancelled first)
    const pendingMeetings = [
        ...[...meetings.filter(m => m.status === 'pending')]
            .sort((a, b) => new Date(b.createdAt || b.meetingDate) - new Date(a.createdAt || a.meetingDate)),
        ...[...meetings.filter(m => m.status === 'cancelled')]
            .sort((a, b) => new Date(b.updatedAt || b.meetingDate) - new Date(a.updatedAt || a.meetingDate))
    ];

    // Awaiting Farmer Response: most recently rescheduled first
    const rescheduleMeetings = [...meetings.filter(m => m.status === 'reschedule')]
        .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    // Confirmed Appointments: accepted only, soonest first
    const confirmedMeetings = [...meetings.filter(m => m.status === 'accepted')]
        .sort((a, b) => new Date(a.meetingDate + 'T' + (a.meetingTime || '00:00')) - new Date(b.meetingDate + 'T' + (b.meetingTime || '00:00')));

    return (
        <>
            <div className={styles.mainContainer}>
                <div className={styles.leftColumn}>
                    <InstructorCalendar meetings={meetings} />

                    {/* Farmer Meeting Requests Section */}
                    <div className={`${commonCardStyles.card} ${styles.meetingRequestsCard}`}>
                        <div className={`${commonCardStyles.cardHeader} ${styles.cardHeaderPadding}`}>
                            <div className={`${commonCardStyles.cardTitle} ${styles.cardTitleWithIcon}`}>
                                <i className={`fas fa-inbox ${styles.inboxIcon}`}></i>
                                {t('schedule.farmerRequests')}
                            </div>
                        </div>
                        <div className={`${commonCardStyles.cardContent} ${styles.cardContentNoPadding}`}>
                            {pendingMeetings.length === 0 ? (
                                <div className={styles.emptyStateContainer}>
                                    <i className={`fas fa-envelope-open ${styles.envelopeIcon}`}></i>
                                    <p className={styles.emptyStateTitle}>{t('schedule.noPendingRequests')}</p>
                                    <p className={styles.emptyStateSubtitle}>{t('schedule.allCaughtUp')}</p>
                                </div>
                            ) : (
                                <div className={styles.tableResponsive}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th className={styles.tableHeaderPadding}>{t('schedule.colTitle')}</th>
                                                <th className={styles.tableHeaderPadding}>{t('schedule.colDivision')}</th>
                                                <th className={styles.tableHeaderPadding}>{t('schedule.colMeetingTime')}</th>
                                                <th className={styles.tableHeaderPadding}>{t('schedule.colStatus')}</th>
                                                <th className={`${styles.tableHeaderPadding} ${styles.thCenter}`}>{t('schedule.colAction')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingMeetings.map(meeting => (
                                                <React.Fragment key={meeting.id}>
                                                    <tr className={styles.requestItemHover}>
                                                        <td className={styles.tableCellPadding}>
                                                            <div className={styles.meetingTitle}>{meeting.meetingTitle}</div>
                                                            <div className={styles.meetingMeta}>
                                                                <span className={styles.meetingMetaItem}>
                                                                    <i className={`fas fa-user ${styles.userIcon}`}></i>
                                                                    {meeting.farmerName || 'Farmer'}
                                                                </span>
                                                                <span className={styles.farmerId}>
                                                                    ID: {meeting.farmerId || 'N/A'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className={styles.tableCellPadding}>
                                                            <span className={styles.divisionBadge}>
                                                                {meeting.division || '-'}
                                                            </span>
                                                        </td>
                                                        <td className={styles.tableCellPadding}>
                                                            <div className={styles.meetingDateTime}>{meeting.meetingDate}</div>
                                                            <div className={styles.meetingTime}>
                                                                {meeting.meetingTime}
                                                                {meeting.meetingDuration && ` (${meeting.meetingDuration} Mins)`}
                                                            </div>
                                                        </td>
                                                        <td className={styles.tableCellPadding}>
                                                            <span className={`${meeting.status === 'pending' ? styles.badgePrimary : meeting.status === 'cancelled' ? styles.badgeDanger : styles.badgeWarning} ${styles.statusBadge}`}>
                                                                {meeting.status}
                                                            </span>
                                                        </td>
                                                        <td className={`${styles.tableCellPadding} ${styles.tdCenter}`}>
                                                            {meeting.status === 'pending' ? (
                                                                <div className={styles.actionButtons}>
                                                                    <button
                                                                        className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${activeMeetingId === meeting.id ? commonBtnStyles.btnSecondary : commonBtnStyles.btnPrimary}`}
                                                                        onClick={() => setActiveMeetingId(activeMeetingId === meeting.id ? null : meeting.id)}
                                                                    >
                                                                        {activeMeetingId === meeting.id ? t('schedule.close') : t('schedule.respond')}
                                                                    </button>
                                                                    <button
                                                                        className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${styles.declineButton}`}
                                                                        onClick={() => handleDeclineClick(meeting.id)}
                                                                    >
                                                                        {t('schedule.decline')}
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className={styles.cancelledByFarmer}>
                                                                    {meeting.cancelReason ? `${t('schedule.cancelReason')} ${meeting.cancelReason}` : t('schedule.cancelledByFarmer')}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {decliningMeetingId === meeting.id && (
                                                        <tr>
                                                            <td colSpan="5" className={styles.cancelModalRow}>
                                                                <div className={styles.cancelModalContent}>
                                                                    <label className={styles.cancelReasonLabel}>
                                                                        {t('schedule.declineReason')}
                                                                    </label>
                                                                    <div className={styles.zoomInputContainer}>
                                                                        <textarea
                                                                            className={`form-control ${styles.cancelTextarea}`}
                                                                            placeholder={t('schedule.declineReasonPlaceholder')}
                                                                            value={declineReason}
                                                                            onChange={(e) => setDeclineReason(e.target.value)}
                                                                        />
                                                                        <div className={styles.cancelButtons}>
                                                                            <button
                                                                                className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnDanger} ${styles.cancelConfirmButton}`}
                                                                                onClick={() => handleDecline(meeting.id)}
                                                                                disabled={isActionLoading === meeting.id}
                                                                            >
                                                                                {isActionLoading === meeting.id ? t('schedule.declining') : t('schedule.confirmDecline')}
                                                                            </button>
                                                                            <button
                                                                                className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnLink} ${styles.dismissButton}`}
                                                                                onClick={() => setDecliningMeetingId(null)}
                                                                            >
                                                                                {t('schedule.dismiss')}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {activeMeetingId === meeting.id && (
                                                        <tr>
                                                            <td colSpan="5" className={styles.expandedRow}>
                                                                <div className={styles.expandedContent}>
                                                                    {meeting.meetingNotes && (
                                                                        <div className={styles.farmerNotes}>
                                                                            <strong>{t('schedule.farmersNotes')}</strong> {meeting.meetingNotes}
                                                                        </div>
                                                                    )}

                                                                    <div className={styles.noteSection}>
                                                                        <label className={styles.noteLabel}>
                                                                            {t('schedule.additionalNote')}
                                                                        </label>
                                                                        <textarea
                                                                            className={`form-control ${styles.noteTextarea}`}
                                                                            placeholder={t('schedule.additionalNotePlaceholder')}
                                                                            value={instructorNote}
                                                                            onChange={(e) => setInstructorNote(e.target.value)}
                                                                        />
                                                                    </div>

                                                                    <div className={styles.optionSection}>
                                                                        <label className={styles.optionLabel}>
                                                                            {t('schedule.option1')}
                                                                        </label>
                                                                        <div className={styles.zoomInputContainer}>
                                                                            <div className={styles.inputWrapper}>
                                                                                <i className={`fas fa-link ${styles.linkIcon}`}></i>
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder={t('schedule.zoomLinkPlaceholder')}
                                                                                    className={`form-control ${styles.zoomInput}`}
                                                                                    value={zoomLink}
                                                                                    onChange={(e) => setZoomLink(e.target.value)}
                                                                                />
                                                                            </div>
                                                                            <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSuccess} ${styles.confirmButton}`} onClick={() => handleAccept(meeting.id)}>
                                                                                {t('schedule.confirm')}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {!meeting.farmerAcceptedSuggestion && (
                                                                        <div className={styles.rescheduleSection}>
                                                                            <label className={styles.optionLabel}>
                                                                                {t('schedule.option2')}
                                                                            </label>
                                                                            <div className={styles.rescheduleGrid}>
                                                                                <div>
                                                                                    <label className={styles.dateLabel}>{t('schedule.rescheduleDate')}</label>
                                                                                    <input
                                                                                        type="date"
                                                                                        className={`form-control ${styles.roundedInput}`}
                                                                                        min={new Date().toISOString().split('T')[0]}
                                                                                        value={rescheduleData.date}
                                                                                        onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <label className={styles.dateLabel}>{t('schedule.rescheduleTime')}</label>
                                                                                    <input
                                                                                        type="time"
                                                                                        className={`form-control ${styles.roundedInput}`}
                                                                                        value={rescheduleData.time}
                                                                                        onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                                                                                    />
                                                                                </div>
                                                                                <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnInfo} ${styles.proposeButton}`} onClick={() => handleReschedule(meeting.id)}>
                                                                                    {t('schedule.propose')}
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
                    {rescheduleMeetings.length > 0 && (
                        <div className={`${commonCardStyles.card} ${styles.waitingCard}`}>
                            <div className={commonCardStyles.cardHeader}>
                                <div className={`${commonCardStyles.cardTitle} ${styles.waitingTitle}`}>
                                    <i className={`fas fa-hourglass-half ${styles.hourglassIcon}`}></i> {t('schedule.awaitingResponse')}
                                </div>
                            </div>
                            <div className={`${commonCardStyles.cardContent} ${styles.cardContentNoPadding}`}>
                                <div className={styles.waitingList}>
                                    {rescheduleMeetings.map(meeting => (
                                        <div key={meeting.id} className={styles.waitingItem}>
                                            <div>
                                                <strong className={styles.waitingTitleText}>{meeting.meetingTitle}</strong>
                                                <div className={styles.waitingMeta}>
                                                    <i className={`fas fa-user ${styles.userIcon}`}></i>
                                                    {meeting.farmerName} <span className={styles.waitingId}>(ID: {meeting.farmerId})</span>
                                                </div>
                                                <div className={styles.meetingTime}>
                                                    <i className={`far fa-clock ${styles.clockIcon}`}></i>
                                                    Proposed: {meeting.suggestedDate} at {meeting.suggestedTime}
                                                </div>
                                            </div>
                                            <span className={`badge ${styles.pendingReplyBadge}`}>{t('schedule.pendingReplyBadge')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Confirmed Appointments Section */}
                    <div className={`${commonCardStyles.card} ${styles.confirmedCard}`}>
                        <div className={`${commonCardStyles.cardHeader} ${styles.cardHeaderPadding}`}>
                            <div className={`${commonCardStyles.cardTitle} ${styles.cardTitleWithIcon}`}>
                                <i className={`fas fa-calendar-check ${styles.calendarIcon}`}></i>
                                {t('schedule.confirmedAppointments')}
                            </div>
                        </div>
                        <div className={`${commonCardStyles.cardContent} ${styles.cardContentNoPadding}`}>
                            {confirmedMeetings.length === 0 ? (
                                <div className={styles.confirmedEmptyState}>
                                    <p className={styles.confirmedEmptyText}>{t('schedule.noConfirmedAppointments')}</p>
                                </div>
                            ) : (
                                <div className={styles.tableResponsive}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th className={styles.tableHeaderPadding}>{t('schedule.colTitle')}</th>
                                                <th className={styles.tableHeaderPadding}>{t('schedule.colDivision')}</th>
                                                <th className={styles.tableHeaderPadding}>{t('schedule.colMeetingTime')}</th>
                                                <th className={styles.tableHeaderPadding}>{t('schedule.colStatus')}</th>
                                                <th className={`${styles.tableHeaderPadding} ${styles.thCenter}`}>{t('schedule.colAction')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {confirmedMeetings.map(meeting => (
                                                <React.Fragment key={meeting.id}>
                                                    <tr className={styles.requestItemHover}>
                                                        <td className={styles.tableCellPadding}>
                                                            <div className={styles.meetingTitle}>{meeting.meetingTitle}</div>
                                                            <div className={styles.meetingMeta}>
                                                                <span className={styles.meetingMetaItem}>
                                                                    <i className={`fas fa-user ${styles.userIcon}`}></i>
                                                                    {meeting.farmerName || 'Farmer'}
                                                                </span>
                                                                <span className={styles.farmerId}>
                                                                    ID: {meeting.farmerId || 'N/A'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className={styles.tableCellPadding}>
                                                            <span className={styles.divisionBadge}>
                                                                {meeting.division || '-'}
                                                            </span>
                                                        </td>
                                                        <td className={styles.tableCellPadding}>
                                                            <div className={styles.meetingDateTime}>{meeting.meetingDate}</div>
                                                            <div className={styles.meetingTime}>
                                                                {meeting.meetingTime}
                                                                {meeting.meetingDuration && ` (${meeting.meetingDuration} Mins)`}
                                                            </div>
                                                        </td>
                                                        <td className={styles.tableCellPadding}>
                                                            <span className={`${styles.badgeSuccess} ${styles.statusBadge}`}>
                                                                {t('schedule.confirmed')}
                                                            </span>
                                                        </td>
                                                        <td className={`${styles.tableCellPadding} ${styles.tdCenter}`}>
                                                            <div className={styles.actionButtons}>
                                                                <button
                                                                    className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnInfo}`}
                                                                    onClick={() => setActiveMeetingId(activeMeetingId === meeting.id ? null : meeting.id)}
                                                                >
                                                                    <i className={`fas fa-eye ${styles.viewButtonIcon}`}></i> {t('farmers.actionView')}
                                                                </button>
                                                                {meeting.status === 'accepted' && (
                                                                    <button
                                                                        className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnOutlineDanger}`}
                                                                        onClick={() => handleCancelClick(meeting.id)}
                                                                    >
                                                                        <i className={`fas fa-xmark ${styles.viewButtonIcon}`}></i> {t('schedule.cancelBtn')}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {cancellingMeetingId === meeting.id && (
                                                        <tr>
                                                            <td colSpan="5" className={styles.cancelModalRow}>
                                                                <div className={styles.cancelModalContent}>
                                                                    <label className={styles.cancelReasonLabel}>
                                                                        {t('schedule.cancelReasonRequired')}
                                                                    </label>
                                                                    <div className={styles.zoomInputContainer}>
                                                                        <textarea
                                                                            className={`form-control ${styles.cancelTextarea}`}
                                                                            placeholder={t('schedule.cancelMeetingPlaceholder')}
                                                                            value={cancelReason}
                                                                            onChange={(e) => setCancelReason(e.target.value)}
                                                                        />
                                                                        <div className={styles.cancelButtons}>
                                                                            <button
                                                                                className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnDanger} ${styles.cancelConfirmButton}`}
                                                                                onClick={() => confirmCancel(meeting.id)}
                                                                            >
                                                                                {t('schedule.confirm')}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}

                                                    {activeMeetingId === meeting.id && (
                                                        <tr>
                                                            <td colSpan="5" className={styles.expandedRow}>
                                                                <div className={styles.viewExpandedContent}>
                                                                    <div className={styles.viewDetailsGrid}>
                                                                        <div>
                                                                            <label className={styles.viewDetailsLabel}>{t('schedule.notesLabel')}</label>
                                                                            <p className={styles.viewNotesText}>{meeting.meetingNotes || 'No notes provided.'}</p>
                                                                        </div>
                                                                        {meeting.zoomLink && meeting.status === 'accepted' && (
                                                                            <div>
                                                                                <label className={styles.viewDetailsLabel}>{t('schedule.meetingLinkLabel')}</label>
                                                                                <div className={styles.meetingLinkContainer}>
                                                                                    <a href={sanitizeExternalUrl(meeting.zoomLink)} target="_blank" rel="noopener noreferrer" className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSm} ${commonBtnStyles.btnSuccess} ${styles.joinButton}`}>
                                                                                        <i className="fas fa-video"></i> {t('schedule.joinMeeting')}
                                                                                    </a>
                                                                                    <code className={styles.meetingLinkCode}>{meeting.zoomLink}</code>
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
        </>
    );
};

export default InstructorSchedule;
