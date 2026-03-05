import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../styles/AdminHome.module.css';
import StatCard from '../components/StatCard';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import { adminAPI } from '@/services/adminService';

// Relative time helper
const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) { const m = Math.floor(diff / 60); return `${m} min${m > 1 ? 's' : ''} ago`; }
    if (diff < 86400) { const h = Math.floor(diff / 3600); return `${h} hour${h > 1 ? 's' : ''} ago`; }
    if (diff < 604800) { const d = Math.floor(diff / 86400); return `${d} day${d > 1 ? 's' : ''} ago`; }
    return new Date(dateStr).toLocaleDateString();
};

const roleConfig = {
    farmer: { icon: 'fas fa-tractor', color: '#2ecc71' },
    instructor: { icon: 'fas fa-chalkboard-teacher', color: '#3498db' },
    admin: { icon: 'fas fa-user-shield', color: '#9b59b6' },
    'Super Admin': { icon: 'fas fa-user-shield', color: '#9b59b6' },
};

// Portal Component for Modals
const ModalPortal = ({ children }) => {
    return ReactDOM.createPortal(children, document.body);
};

const AdminHome = () => {
    const { openNotificationsModal, showToast, refreshMessages } = useOutletContext();
    const { t } = useTranslation('admin');
    // State for Modals
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('Send Message');
    const [recipientType, setRecipientType] = useState('all');
    const [showUserSelection, setShowUserSelection] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);

    // State for Message Form
    const [messageSubject, setMessageSubject] = useState('');
    const [messageText, setMessageText] = useState('');
    const [attachment, setAttachment] = useState(null);
    const fileInputRef = useRef(null);

    // Context and State
    const [isSending, setIsSending] = useState(false);
    const [stats, setStats] = useState([
        { label: t('home.totalUsers'), value: 0, icon: 'fas fa-users', color: 'blue' },
        { label: t('home.farmers'), value: 0, icon: 'fas fa-tractor', color: 'success' },
        { label: t('home.instructors'), value: 0, icon: 'fas fa-chalkboard-teacher', color: 'orange' },
        { label: t('home.admins'), value: 0, icon: 'fas fa-user-shield', color: 'purple' }
    ]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Users for Selection
    useEffect(() => {
        if (recipientType === 'select') {
            const fetchUsersForSelect = async () => {
                try {
                    const result = await adminAPI.getUsers('?limit=50&status=active');
                    // Ensure the 'success' wrapper isn't breaking 'data'
                    if (result) {
                        setUsersList(result.data || result);
                    }
                } catch (error) {
                    console.error('Error fetching users for selection:', error);
                    showToast('Failed to load users list', 'error');
                }
            };
            fetchUsersForSelect();
        }
    }, [recipientType, showToast]);

    // Fetch Dashboard Stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await adminAPI.getDashboardStats();

                if (response && response.success) {
                    const { counts, recentActivity } = response.data;

                    setStats([
                        {
                            label: t('home.totalUsers'),
                            value: counts.totalUsers,
                            icon: 'fas fa-users',
                            color: 'blue'
                        },
                        {
                            label: t('home.farmers'),
                            value: counts.farmers,
                            icon: 'fas fa-tractor',
                            color: 'success'
                        },
                        {
                            label: t('home.instructors'),
                            value: counts.instructors,
                            icon: 'fas fa-chalkboard-teacher',
                            color: 'orange'
                        },
                        {
                            label: t('home.admins'),
                            value: counts.admins,
                            icon: 'fas fa-user-shield',
                            color: 'purple'
                        }
                    ]);

                    // Transform recent activity using real data
                    if (recentActivity) {
                        const transformedActivity = recentActivity.map((activity) => {
                            const role = activity.role || 'user';
                            const cfg = roleConfig[role] || { icon: 'fas fa-user', color: '#95a5a6' };
                            const roleName = role.charAt(0).toUpperCase() + role.slice(1);
                            return {
                                action: `New ${roleName} "${activity.full_name}" registered`,
                                time: timeAgo(activity.created_at),
                                icon: cfg.icon,
                                color: cfg.color
                            };
                        });
                        setRecentActivities(transformedActivity);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
                showToast('Failed to load dashboard data', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [showToast]);

    // Helper Functions
    const openNotifications = () => openNotificationsModal();

    const openMessageModal = (type) => {
        setRecipientType(type);
        if (type === 'farmers') {
            setModalTitle(t('home.msgToFarmers'));
            setShowUserSelection(false);
        } else if (type === 'instructors') {
            setModalTitle(t('home.msgToInstructors'));
            setShowUserSelection(false);
        } else if (type === 'custom') {
            setRecipientType('select');
            setModalTitle(t('home.msgCustom'));
            setShowUserSelection(true);
        } else {
            setRecipientType('all');
            setModalTitle(t('home.msgTitle'));
            setShowUserSelection(false);
        }
        setIsMessageModalOpen(true);
    };

    const closeMessageModal = () => {
        setIsMessageModalOpen(false);
        setMessageSubject('');
        setMessageText('');
        setAttachment(null);
        setSelectedUserIds([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUserSelect = (userId) => {
        setSelectedUserIds(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleRecipientChange = (e) => {
        const type = e.target.value;
        setRecipientType(type);
        setShowUserSelection(type === 'select');
    };

    const ALLOWED_ATTACHMENT_TYPES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];
    const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB (matches UI label)

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > MAX_ATTACHMENT_SIZE) {
                showToast('File size exceeds the 10 MB limit', 'warning');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
                showToast('File type not allowed. Use JPG, PNG, GIF, WEBP, PDF, DOC, DOCX, or TXT', 'warning');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            setAttachment(file);
        }
    };

    const removeAttachment = () => {
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const sendMessage = async () => {
        if (!messageSubject.trim()) {
            showToast('Please enter a subject for the message', 'error');
            return;
        }
        if (!messageText.trim()) {
            showToast('Please enter a message', 'error');
            return;
        }
        if (recipientType === 'select' && selectedUserIds.length === 0) {
            showToast('Please select at least one recipient', 'error');
            return;
        }

        setIsSending(true);

        try {
            const formData = new FormData();
            formData.append('subject', messageSubject);
            formData.append('content', messageText);
            formData.append('recipient_type', recipientType); // Updated to match backend

            if (recipientType === 'select') {
                formData.append('recipient_ids', JSON.stringify(selectedUserIds)); // Updated to match backend
            }

            if (attachment) {
                formData.append('attachment', attachment);
            }

            const result = await adminAPI.sendMessage(formData);

            if (result && (result.success || result.message)) {
                showToast(t('home.msgSentSuccess'), 'success');
                closeMessageModal();
                // Refresh messages so the sent message appears in the Sent tab
                if (refreshMessages) refreshMessages();
            } else {
                showToast(result.error?.message || 'Failed to send message', 'error');
            }
        } catch (error) {
            console.error('Send message error:', error);
            showToast(error.message || 'Failed to send message', 'error');
        } finally {
            setIsSending(false);
        }
    };

    if (loading) {
        return (
            <div className={`${styles.page} ${styles.active}`}>
                <div className={styles.pageTitle}>
                    <i className="fas fa-home"></i>
                    <h2>{t('home.title')}</h2>
                </div>
                <div className={styles.noResultsContainer}>
                    <i className={`fas fa-spinner fa-spin ${styles.noResultsIcon}`}></i>
                    <p>{t('home.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.page} ${styles.active}`}>
            <div className={styles.pageTitle}>
                <i className="fas fa-home"></i>
                <h2>{t('home.title')}</h2>
            </div>

            {/* Stats Grid */}
            <div className={styles.dashboardStats}>
                {stats.map((stat, index) => (
                    <StatCard
                        key={index}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        trend={stat.trend}
                        trendValue={stat.trendValue}
                        color={stat.color}
                    />
                ))}
            </div>

            <div className={styles.cardsGrid}>
                {/* Recent Activities */}
                <div className={commonCardStyles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>{t('home.recentActivities')}</div>
                        <div className={styles.cardIcon}><i className="fas fa-clock-rotate-left"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <ul className={`${styles.cardList} ${styles.activitiesList}`}>
                            {recentActivities.map((activity, index) => (
                                <li key={index}>
                                    <div className={styles.activityContent}>
                                        <div className={styles.activityText}>{activity.action}</div>
                                        <div className={styles.activityTime}>{activity.time}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className={commonCardStyles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>{t('home.quickActions')}</div>
                        <div className={styles.cardIcon}><i className="fas fa-bolt"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={styles.quickActionsGrid}>
                            <div className={styles.quickActionItem} onClick={openNotifications}>
                                <i className="fas fa-bell"></i>
                                <span>{t('home.viewNotifications')}</span>
                            </div>
                            <div className={styles.quickActionItem} onClick={() => openMessageModal('all')}>
                                <i className="fas fa-envelope"></i>
                                <span>{t('home.sendToAll')}</span>
                            </div>
                            <div className={styles.quickActionItem} onClick={() => openMessageModal('farmers')}>
                                <i className="fas fa-user-friends"></i>
                                <span>{t('home.sendToFarmers')}</span>
                            </div>
                            <div className={styles.quickActionItem} onClick={() => openMessageModal('instructors')}>
                                <i className="fas fa-chalkboard-teacher"></i>
                                <span>{t('home.sendToInstructors')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Send Message Card */}
                <div className={`${commonCardStyles.card} ${styles.cardSendMessage}`} onClick={() => openMessageModal('all')}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>{t('home.sendMessage')}</div>
                        <div className={styles.cardIcon}><i className="fas fa-message"></i></div>
                    </div>
                    <div className={`${commonCardStyles.cardContent} ${styles.sendMessageWrapper}`}>
                        <div className={styles.sendMessageContent}>
                            <div className={styles.sendMessageIcon}>
                                <i className="fas fa-paper-plane"></i>
                            </div>
                            <div className={styles.sendMessageTitle}>
                                {t('home.sendMessage')}
                            </div>
                            <div className={styles.sendMessageDesc}>
                                {t('home.sendMessageDesc')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message Modal */}
            {isMessageModalOpen && (
                <ModalPortal>
                    <div className={`${styles.modalOverlay} ${styles.active}`}>
                        <div className={styles.modal}>
                            <div className={styles.modalHeader}>
                                <div className={styles.modalTitle}>{modalTitle}</div>
                                <button className={styles.modalCloseRound} onClick={closeMessageModal}>
                                    <i className="fas fa-xmark"></i>
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="recipientType">{t('home.msgSendTo')}</label>
                                    <select
                                        id="recipientType"
                                        className={styles.formControl}
                                        value={recipientType}
                                        onChange={handleRecipientChange}
                                    >
                                        <option value="all">{t('home.msgAllUsers')} ({stats.find(s => s.label === t('home.totalUsers'))?.value || 0})</option>
                                        <option value="farmers">{t('home.msgAllFarmers')} ({stats.find(s => s.label === t('home.farmers'))?.value || 0})</option>
                                        <option value="instructors">{t('home.msgAllInstructors')} ({stats.find(s => s.label === t('home.instructors'))?.value || 0})</option>
                                        <option value="select">{t('home.msgSelectUsers')}</option>
                                    </select>
                                </div>

                                {showUserSelection && (
                                    <div className={styles.formGroup}>
                                        <label>{t('home.msgSelectUsersLabel')}</label>
                                        <div className={styles.userSelectionContainer}>
                                            {usersList.length > 0 ? (
                                                usersList.map(user => (
                                                    <label key={user.id} className={styles.userCheckboxItem}>
                                                        <input
                                                            type="checkbox"
                                                            value={user.id}
                                                            checked={selectedUserIds.includes(user.id)}
                                                            onChange={() => handleUserSelect(user.id)}
                                                        />
                                                        <span>{user.full_name || user.name} ({user.role})</span>
                                                    </label>
                                                ))
                                            ) : (
                                                <p>{t('home.msgLoadingUsers')}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className={styles.formGroup}>
                                    <label htmlFor="messageSubject">{t('home.msgSubject')}</label>
                                    <input
                                        type="text"
                                        id="messageSubject"
                                        className={styles.formControl}
                                        placeholder={t('home.msgSubjectPlaceholder')}
                                        value={messageSubject}
                                        onChange={(e) => setMessageSubject(e.target.value)}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="messageText">{t('home.msgMessage')}</label>
                                    <textarea
                                        id="messageText"
                                        className={styles.formControl}
                                        rows="6"
                                        placeholder={t('home.msgMessagePlaceholder')}
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                    ></textarea>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>{t('home.msgAttachment')}</label>
                                    <div
                                        className={styles.fileUploadZone}
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <div className={styles.uploadIconWrapper}>
                                            <i className="fas fa-cloud-arrow-up"></i>
                                        </div>
                                        <div className={styles.uploadTextPrimary}>{t('home.uploadText')}</div>
                                        <div className={styles.uploadTextSecondary}>{t('home.uploadSizeInfo')}</div>
                                        <input
                                            type="file"
                                            id="fileAttachment"
                                            className={styles.hiddenFileInput}
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                        />
                                    </div>
                                    {attachment && (
                                        <div className={styles.fileInfoCard}>
                                            <div className={styles.fileIcon}>
                                                <i className="fas fa-file"></i>
                                            </div>
                                            <span className={styles.fileName}>{attachment.name}</span>
                                            <button type="button" className={styles.btnRemoveFile} onClick={removeAttachment}>
                                                <i className="fas fa-xmark"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.modalFooter}>
                                    <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`} onClick={closeMessageModal} disabled={isSending}>{t('home.msgCancel')}</button>
                                    <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} onClick={sendMessage} disabled={isSending}>
                                        {isSending ? (
                                            <><i className="fas fa-spinner fa-spin"></i> {t('home.msgSending')}</>
                                        ) : (
                                            <><i className="fas fa-paper-plane"></i> {t('home.msgSend')}</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default AdminHome;
