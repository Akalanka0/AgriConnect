import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';
import { adminAPI } from '@/services/adminService';
import ConfirmModal from '@/components/common/feedback/ConfirmModal';
import { getAccessToken } from '@/utils/authStorage';
import { getStoredUser } from '@/utils/userStorage';
import { SOCKET_URL } from '@/config/realtime';
import styles from '../styles/AdminMessageCenter.module.css';
import { getDownloadUrl, getFriendlyFileName } from '@/utils/fileUtils';

const AdminMessageCenterUnique = ({ isOpen, onClose, messages = [], onMessageRead }) => {
    const { t } = useTranslation('admin');
    const [activeTab, setActiveTab] = useState('received');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [imageError, setImageError] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [isDeletingMessage, setIsDeletingMessage] = useState(false);
    const socketRef = useRef(null);

    // Get current user ID from localStorage
    const getCurrentUserId = () => {
        const user = getStoredUser() || {};
        return user.id;
    };

    // Handle message deletion
    const handleDeleteMessage = (messageId) => {
        setConfirmDeleteId(messageId);
    };

    // Force-download an attachment.
    // Uses getDownloadUrl (same pattern as crop plans / pest reports):
    // - Cloudinary raw PDFs are publicly accessible, so a plain anchor click works fine.
    // - Images get fl_attachment injected via getDownloadUrl to force a download.
    const handleDownload = (url, filename) => {
        if (!url) return;
        const name = filename || 'attachment';
        const downloadUrl = getDownloadUrl(url);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = name;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const confirmDeleteMessage = async () => {
        if (!confirmDeleteId) {
            return;
        }

        setIsDeletingMessage(true);

        try {
            await adminAPI.deleteMessage(confirmDeleteId);

            // Remove message from local state
            if (onMessageRead && typeof onMessageRead === 'function') {
                onMessageRead('refresh');
            }
            setSelectedMessage(null);
            setConfirmDeleteId(null);
        } catch (error) {
            console.error('Error deleting message:', error);
        } finally {
            setIsDeletingMessage(false);
        }
    };

    // WebSocket connection for real-time updates
    useEffect(() => {
        if (isOpen) {
            const token = getAccessToken();
            if (token && !socketRef.current) {
                const newSocket = io(SOCKET_URL, {
                    auth: { token },
                    transports: ['polling', 'websocket']
                });

                newSocket.on('newMessage', (message) => {
                    if (onMessageRead && typeof onMessageRead === 'function') {
                        onMessageRead('refresh');
                    }
                });

                newSocket.on('messageRead', (messageId) => {
                    if (onMessageRead && typeof onMessageRead === 'function') {
                        onMessageRead(messageId);
                    }
                });

                socketRef.current = newSocket;
            }
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isOpen, onMessageRead]);

    // Filter messages based on tab (Received/Sent)
    const filteredMessages = messages.filter(msg => {
        if (activeTab === 'received') {
            return msg.type === 'received';
        } else {
            return msg.type === 'sent';
        }
    });

    const handleMessageClick = async (msg) => {
        setSelectedMessage(msg);
        setImageError(false); // Reset imageError so image attachments render correctly

        // Mark message as read if it's unread and received
        if (msg.type === 'received' && !msg.is_read) {
            try {
                await adminAPI.markMessageAsRead(msg.id);

                if (onMessageRead) {
                    onMessageRead(msg.id);
                }
            } catch (error) {
                console.error('Failed to mark message as read:', error);
            }
        }
    };

    const backToList = () => {
        setSelectedMessage(null);
        setImageError(false);
    };

    return createPortal(
        <div className={styles.container}>
            <div
                className={`${styles.overlay} ${isOpen ? styles.active : ''}`}
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <div className={styles.glassPanel}>
                    <div className={styles.header}>
                        <div className={styles.title}>
                            <div className={styles.titleIcon}>
                                <i className="fas fa-envelope-open-text"></i>
                            </div>
                            <span className={styles.titleText}>{t('msgCenter.title')}</span>
                        </div>
                        <button className={styles.closeBtn} onClick={onClose}>
                            <i className="fas fa-xmark"></i>
                        </button>
                    </div>

                    {!selectedMessage ? (
                        <>
                            <div className={styles.tabs}>
                                <button
                                    onClick={() => setActiveTab('received')}
                                    className={`${styles.tabBtn} ${activeTab === 'received' ? styles.active : ''}`}
                                >
                                    <i className="fas fa-inbox"></i>
                                    {t('msgCenter.received')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('sent')}
                                    className={`${styles.tabBtn} ${activeTab === 'sent' ? styles.active : ''}`}
                                >
                                    <i className="fas fa-paper-plane"></i>
                                    {t('msgCenter.sent')}
                                </button>
                            </div>

                            <div className={`${styles.messageList} ${styles.customScrollbar}`}>
                                {filteredMessages.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <div className={styles.emptyIcon}>
                                            <i className="fas fa-folder-open"></i>
                                        </div>
                                        <div className={styles.emptyText}>{t('msgCenter.noMessages')}</div>
                                        <p className={styles.emptySubtext}>{t('msgCenter.emptySubtext', { tab: activeTab })}</p>
                                    </div>
                                ) : (
                                    filteredMessages.map(msg => (
                                        <div
                                            key={msg.id}
                                            onClick={() => handleMessageClick(msg)}
                                            className={`${styles.messageItem} ${msg.is_read ? styles.read : ''}`}
                                        >
                                            {!msg.is_read && activeTab === 'received' && (
                                                <div className={styles.unreadIndicator}></div>
                                            )}
                                            <div className={styles.itemHeader}>
                                                <div className={styles.senderInfo}>
                                                    <span className={styles.senderName}>
                                                        {activeTab === 'received' ? msg.sender : msg.recipient}
                                                    </span>
                                                    <span className={styles.senderId}>
                                                        {activeTab === 'received' ? (msg.senderDisplayId || '') : (msg.recipientDisplayId || '')}
                                                    </span>
                                                </div>
                                                <div className={styles.meta}>
                                                    {msg.attachment && (
                                                        <i className={`fas fa-paperclip ${styles.paperclipIcon}`}></i>
                                                    )}
                                                    <span className={styles.date}>{msg.date}</span>
                                                </div>
                                            </div>
                                            <div className={styles.subject}>{msg.subject}</div>
                                            <div className={styles.preview}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className={`${styles.detail} ${styles.customScrollbar}`}>
                            <button className={styles.backBtn} onClick={backToList}>
                                <i className="fas fa-arrow-left"></i>
                                {t('msgCenter.backToMessages')}
                            </button>

                            <div className={styles.contentContainer}>
                                <div className={styles.detailSubject}>{selectedMessage.subject}</div>
                                <div className={styles.detailMeta}>
                                    <div className={styles.detailSender}>
                                        <span>
                                            <strong>{t('msgCenter.from')}</strong> {selectedMessage.sender}
                                            {selectedMessage.senderDisplayId ? ` (${selectedMessage.senderDisplayId})` : ''}
                                        </span>
                                        <span>
                                            <strong>{t('msgCenter.to')}</strong> {selectedMessage.recipient}
                                            {selectedMessage.recipientDisplayId ? ` (${selectedMessage.recipientDisplayId})` : ''}
                                        </span>
                                    </div>
                                    <div className={styles.detailDate}>{selectedMessage.date}{selectedMessage.time ? ` • ${selectedMessage.time}` : ''}</div>
                                </div>

                                <div className={styles.detailContent}>
                                    {selectedMessage.content}
                                </div>

                                {selectedMessage.attachment && (
                                    <div className={styles.attachmentContainer}>
                                        <div className={styles.attachmentHeader}>
                                            <i className="fas fa-paperclip"></i>
                                            {t('msgCenter.attachment')}
                                        </div>
                                        <div className={styles.fileInfo}>
                                            <div className={`${styles.fileIcon} ${selectedMessage.attachment.toLowerCase().endsWith('.pdf') ? styles.pdf : styles.image}`}>
                                                <i className={`fas ${selectedMessage.attachment.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' :
                                                    (selectedMessage.attachment.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? 'fa-file-image' : 'fa-file')}`}></i>
                                            </div>
                                            <div className={styles.fileDetails}>
                                                <div className={styles.filename}>
                                                    {getFriendlyFileName(selectedMessage.attachmentName || selectedMessage.attachment)}
                                                </div>
                                                <div className={styles.fileType}>
                                                    {selectedMessage.attachment.split('.').pop().toUpperCase()}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDownload(selectedMessage.attachmentUrl || selectedMessage.attachment, selectedMessage.attachmentName || selectedMessage.attachment)}
                                                className={styles.downloadBtn}
                                            >
                                                <i className="fas fa-download"></i>
                                                {t('msgCenter.download')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Delete Button at Very Bottom */}
                                <div className={styles.actionsBottom}>
                                    <button
                                        onClick={() => handleDeleteMessage(selectedMessage.id)}
                                        className={styles.deleteBtn}
                                        title={t('msgCenter.deleteTitle')}
                                    >
                                        <i className="fas fa-trash"></i>
                                        {t('msgCenter.delete')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <ConfirmModal
                    isOpen={Boolean(confirmDeleteId)}
                    onClose={() => setConfirmDeleteId(null)}
                    onConfirm={confirmDeleteMessage}
                    title={t('msgCenter.deleteConfirmTitle')}
                    message={t('msgCenter.deleteConfirmMsg')}
                    confirmText={t('msgCenter.deleteConfirmText')}
                    cancelText={t('msgCenter.cancelText')}
                    type="danger"
                    loading={isDeletingMessage}
                />
            </div>
        </div>,
        document.body
    );
};

AdminMessageCenterUnique.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    messages: PropTypes.array,
    onMessageRead: PropTypes.func
};

export default AdminMessageCenterUnique;
