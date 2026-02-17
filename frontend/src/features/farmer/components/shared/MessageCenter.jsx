import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import io from 'socket.io-client';

const MessageCenter = ({ isOpen, onClose, messages = [], role = 'farmer', onMessageRead }) => {
    const [activeTab, setActiveTab] = useState('received');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);

    // WebSocket connection for real-time updates
    useEffect(() => {
        if (isOpen) {
            const token = localStorage.getItem('token');
            if (token && !socketRef.current) {
                const newSocket = io('http://localhost:5002', {
                    auth: { token },
                    transports: ['websocket']
                });
                
                newSocket.on('connect', () => {
                    console.log(`${role} WebSocket connected`);
                });
                
                newSocket.on('newMessage', (message) => {
                    console.log('New message received:', message);
                    // Since we don't have direct access to setMessages, we'll rely on the parent component
                    // to update the messages prop. The real-time update will be handled by the parent.
                    if (onMessageRead && typeof onMessageRead === 'function') {
                        // Signal parent to refresh messages
                        onMessageRead('refresh');
                    }
                });
                
                newSocket.on('messageRead', (messageId) => {
                    console.log('Message marked as read:', messageId);
                    // Since we don't have direct access to setMessages, we'll rely on the parent component
                    // to update the messages prop. The real-time update will be handled by the parent.
                    if (onMessageRead && typeof onMessageRead === 'function') {
                        // Signal parent to refresh messages
                        onMessageRead(messageId);
                    }
                });
                
                newSocket.on('disconnect', () => {
                    console.log(`${role} WebSocket disconnected`);
                });
                
                socketRef.current = newSocket;
                setSocket(newSocket);
            }
        };
        
        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
        };
    }, [isOpen, role, onMessageRead]);

    // Reset selected message when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedMessage(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const themeClass = role === 'instructor' ? 'theme-instructor' : 'theme-farmer';

    // Filter messages based on tab (Received/Sent)
    const filteredMessages = messages.filter(msg => {
        if (activeTab === 'received') {
            return msg.type === 'received' || msg.recipient_type === 'all' || 
                   (role === 'farmer' ? msg.recipient_type === 'farmers' : 
                    role === 'instructor' ? msg.recipient_type === 'instructors' : 
                    msg.recipient_type === 'admin');
        }
        return msg.type === 'sent';
    });

    const handleMessageClick = async (msg) => {
        setSelectedMessage(msg);
        
        // Mark message as read if it's unread and received
        if (msg.type === 'received' && !msg.is_read) {
            try {
                // Determine API endpoint based on role
                const apiBase = role === 'admin' ? '/api/admin' : role === 'instructor' ? '/api/instructor' : '/api/farmer';
                
                const response = await fetch(`${apiBase}/messages/${msg.id}/read`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok && onMessageRead) {
                    // Call parent callback to update messages list
                    onMessageRead(msg.id);
                }
            } catch (error) {
                console.error('Failed to mark message as read:', error);
            }
        }
    };

    const backToList = () => {
        setSelectedMessage(null);
    };

    return createPortal(
        <div className={themeClass}>
            <div
                className="modal-overlay active"
                onClick={(e) => e.target === e.currentTarget && onClose()}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 1,
                    visibility: 'visible',
                    zIndex: 999999,
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(10px)',
                    pointerEvents: 'auto'
                }}
            >
                <div className="modal glass-panel" style={{
                maxWidth: '750px',
                width: '95%',
                height: '85vh',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000000,
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '24px',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div className="modal-header" style={{
                    background: 'rgba(248, 249, 250, 0.5)',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '1.2em',
                            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)'
                        }}>
                            <i className="fas fa-envelope-open-text"></i>
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '1.15em', color: 'var(--primary-dark)' }}>Message Center</span>
                    </div>
                    <button className="modal-close" onClick={onClose} style={{
                        background: 'rgba(0,0,0,0.05)',
                        width: '32px', height: '32px',
                        borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                        border: 'none',
                        cursor: 'pointer'
                    }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {!selectedMessage ? (
                    <>
                        <div className="message-tabs" style={{
                            display: 'flex',
                            padding: '10px 24px',
                            background: 'rgba(255, 255, 255, 0.3)',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                            gap: '12px'
                        }}>
                            <button
                                onClick={() => setActiveTab('received')}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    background: activeTab === 'received' ? 'var(--primary)' : 'transparent',
                                    color: activeTab === 'received' ? 'white' : 'var(--neutral-600)',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: activeTab === 'received' ? '0 4px 12px rgba(46, 125, 50, 0.2)' : 'none'
                                }}
                            >
                                <i className="fas fa-inbox" style={{ marginRight: '8px' }}></i>
                                Received
                            </button>
                            <button
                                onClick={() => setActiveTab('sent')}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    background: activeTab === 'sent' ? 'var(--primary)' : 'transparent',
                                    color: activeTab === 'sent' ? 'white' : 'var(--neutral-600)',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: activeTab === 'sent' ? '0 4px 12px rgba(46, 125, 50, 0.2)' : 'none'
                                }}
                            >
                                <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i>
                                Sent
                            </button>
                        </div>

                        <div className="message-list custom-scrollbar" style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '20px',
                            background: 'rgba(255, 255, 255, 0.2)'
                        }}>
                            {filteredMessages.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '60px 20px',
                                    color: 'var(--neutral-400)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}>
                                    <div style={{
                                        width: '80px', height: '80px', borderRadius: '50%',
                                        background: 'rgba(0, 0, 0, 0.03)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '2.5em', marginBottom: '20px'
                                    }}>
                                        <i className="fas fa-folder-open"></i>
                                    </div>
                                    <div style={{ fontWeight: '600', fontSize: '1.1em', color: 'var(--neutral-600)' }}>No messages found</div>
                                    <p style={{ fontSize: '0.9em', marginTop: '8px' }}>Your {activeTab} messages will appear here</p>
                                </div>
                            ) : (
                                filteredMessages.map(msg => (
                                    <div
                                        key={msg.id}
                                        onClick={() => handleMessageClick(msg)}
                                        style={{
                                            padding: '18px 20px',
                                            background: msg.is_read ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.8)',
                                            border: '1px solid rgba(0, 0, 0, 0.05)',
                                            borderRadius: '16px',
                                            marginBottom: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative',
                                            boxShadow: msg.is_read ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.03)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.06)';
                                            e.currentTarget.style.borderColor = 'rgba(46, 125, 50, 0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = msg.is_read ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.03)';
                                            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
                                        }}
                                    >
                                        {!msg.is_read && activeTab === 'received' && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '18px',
                                                left: '-5px',
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--primary)',
                                                boxShadow: '0 0 10px var(--primary-light)'
                                            }}></div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontWeight: '700', color: 'var(--primary-dark)', fontSize: '1.05em' }}>
                                                    {activeTab === 'received' ? msg.sender : msg.recipient}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.75em',
                                                    background: 'rgba(0, 0, 0, 0.05)',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    color: 'var(--neutral-500)',
                                                    fontWeight: '600',
                                                    fontFamily: 'monospace'
                                                }}>
                                                    {activeTab === 'received' ? (msg.senderId ? `ID: ${msg.senderId}` : 'SYSTEM') : (msg.recipientId ? `ID: ${msg.recipientId}` : 'SYSTEM')}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {msg.attachment && (
                                                    <i className="fas fa-paperclip" style={{ color: 'var(--primary)', fontSize: '0.9em' }}></i>
                                                )}
                                                <span style={{ fontSize: '0.85em', color: 'var(--neutral-500)', fontWeight: '500' }}>{msg.date}</span>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: '600', color: 'var(--neutral-800)', marginBottom: '4px', fontSize: '0.95em' }}>{msg.subject}</div>
                                        <div style={{
                                            fontSize: '0.9em',
                                            color: 'var(--neutral-500)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            lineHeight: '1.4'
                                        }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <div className="message-detail custom-scrollbar" style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '24px',
                        overflowY: 'auto',
                        background: 'rgba(255, 255, 255, 0.3)'
                    }}>
                        <button
                            onClick={backToList}
                            style={{
                                alignSelf: 'flex-start',
                                border: 'none',
                                background: 'rgba(0, 0, 0, 0.05)',
                                padding: '8px 16px',
                                borderRadius: '12px',
                                marginBottom: '24px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: '600',
                                color: 'var(--neutral-700)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
                        >
                            <i className="fas fa-arrow-left"></i> Back to messages
                        </button>

                        <div style={{
                            marginBottom: '24px',
                            background: 'rgba(255, 255, 255, 0.6)',
                            padding: '24px',
                            borderRadius: '20px',
                            border: '1px solid rgba(0, 0, 0, 0.05)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
                        }}>
                            <h3 style={{
                                marginBottom: '12px',
                                color: 'var(--primary-dark)',
                                fontSize: '1.4em',
                                fontWeight: '700',
                                lineHeight: '1.3'
                            }}>{selectedMessage.subject}</h3>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '12px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: 'var(--primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontWeight: '700'
                                    }}>
                                        {(activeTab === 'received' ? selectedMessage.sender : selectedMessage.recipient)?.[0]?.toUpperCase() || 'S'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', color: 'var(--neutral-800)' }}>
                                            {activeTab === 'received' ? selectedMessage.sender : selectedMessage.recipient}
                                        </div>
                                        <div style={{ fontSize: '0.85em', color: 'var(--neutral-500)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ background: 'rgba(0,0,0,0.05)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                                                {activeTab === 'received' ? (selectedMessage.senderId ? `ID: ${selectedMessage.senderId}` : 'SYSTEM') : (selectedMessage.recipientId ? `ID: ${selectedMessage.recipientId}` : 'SYSTEM')}
                                            </span>
                                            <span>•</span>
                                            <span>{selectedMessage.date}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            flex: 1,
                            background: 'rgba(255, 255, 255, 0.4)',
                            padding: '24px',
                            borderRadius: '20px',
                            fontSize: '1.05em',
                            lineHeight: '1.7',
                            color: 'var(--neutral-800)',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {selectedMessage.content}
                        </div>

                        {selectedMessage.attachment && (
                            <div style={{
                                marginTop: '24px',
                                padding: '20px',
                                background: 'rgba(46, 125, 50, 0.05)',
                                borderRadius: '20px',
                                border: '1px solid rgba(46, 125, 50, 0.1)'
                            }}>
                                <div style={{
                                    fontSize: '0.9em',
                                    color: 'var(--primary-dark)',
                                    marginBottom: '15px',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <i className="fas fa-paperclip"></i> Attachment
                                </div>

                                {selectedMessage.attachmentUrl && (selectedMessage.attachment.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) || selectedMessage.attachmentUrl.includes('image/upload')) && (
                                    <div style={{
                                        marginBottom: '20px',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: '4px solid white',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        background: 'white'
                                    }}>
                                        <img
                                            src={selectedMessage.attachmentUrl}
                                            alt={selectedMessage.attachment}
                                            style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block' }}
                                            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                                        />
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    background: 'white',
                                    padding: '12px 15px',
                                    borderRadius: '16px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: selectedMessage.attachment.toLowerCase().endsWith('.pdf') ? '#fff1f0' : '#e6f7ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: selectedMessage.attachment.toLowerCase().endsWith('.pdf') ? '#f5222d' : '#1890ff',
                                        fontSize: '1.4em'
                                    }}>
                                        <i className={`fas ${selectedMessage.attachment.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' :
                                            (selectedMessage.attachment.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? 'fa-file-image' : 'fa-file')}`}></i>
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{
                                            fontSize: '1em',
                                            fontWeight: '700',
                                            color: 'var(--neutral-800)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {selectedMessage.attachment}
                                        </div>
                                        <div style={{ fontSize: '0.85em', color: 'var(--neutral-500)', fontWeight: '500' }}>
                                            {selectedMessage.attachment.toLowerCase().endsWith('.pdf') ? 'PDF Document' : 'Media File'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => window.open(selectedMessage.attachmentUrl, '_blank')}
                                        style={{
                                            background: 'var(--primary)',
                                            border: 'none',
                                            color: 'white',
                                            padding: '10px 20px',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            fontSize: '0.95em',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontWeight: '700',
                                            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(46, 125, 50, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 125, 50, 0.2)';
                                        }}
                                    >
                                        <i className="fas fa-download"></i> Download
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(0, 0, 0, 0.08);
                        border-radius: 10px;
                        border: 2px solid transparent;
                        background-clip: content-box;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(0, 0, 0, 0.15);
                        background-clip: content-box;
                    }
                    .custom-scrollbar {
                        scrollbar-width: thin;
                        scrollbar-color: rgba(0, 0, 0, 0.08) transparent;
                    }
                `}</style>
            </div>
        </div>
    </div>,
    document.body
);
};

MessageCenter.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    messages: PropTypes.array,
    role: PropTypes.string,
    onMessageRead: PropTypes.func
};

export default MessageCenter;
