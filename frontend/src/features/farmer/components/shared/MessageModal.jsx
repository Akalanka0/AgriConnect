import React, { useState } from 'react';
import PropTypes from 'prop-types';

const MessageModal = ({ isOpen, onClose, recipientName = "Rohan Silva - Agriculture Instructor", onSubmit }) => {
    const [formData, setFormData] = useState({
        recipient: 'instructor',
        subject: '',
        content: '',
        attachment: null
    });

    const fileInputRef = React.useRef(null);
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, attachment: file });
        }
    };

    const removeAttachment = (e) => {
        e.stopPropagation();
        setFormData({ ...formData, attachment: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!formData.subject || !formData.content) {
            alert('Please fill in both subject and message fields');
            return;
        }

        setIsSending(true);
        // Simulate network delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));

        onSubmit(formData);
        setFormData({ subject: '', content: '', attachment: null });
        setIsSending(false);
    };

    return (
        <div className="modal-overlay active" onClick={(e) => e.target.className.includes('modal-overlay') && onClose()}>
            <div className="modal" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <div className="modal-title">
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'var(--primary-light)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: 'white',
                            marginRight: '15px'
                        }}>
                            <i className="fas fa-envelope"></i>
                        </div>
                        Send Message
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="modal-content">
                    <div className="form-group">
                        <label style={{ fontWeight: '600', color: 'var(--primary-dark)' }}>Send to:</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                className="form-control"
                                value={formData.recipient}
                                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                                style={{
                                    padding: '12px 15px',
                                    paddingLeft: '40px',
                                    borderRadius: '8px',
                                    border: '1px solid #c8e6c9',
                                    backgroundColor: '#e8f5e9',
                                    color: 'var(--primary-dark)',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    appearance: 'none',
                                    width: '100%'
                                }}
                            >
                                <option value="instructor">{recipientName} (Assigned Instructor)</option>
                                <option value="admin">System Administrators</option>
                            </select>
                            <i className="fas fa-user-tie" style={{
                                position: 'absolute',
                                left: '15px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--primary)',
                                pointerEvents: 'none'
                            }}></i>
                            <i className="fas fa-chevron-down" style={{
                                position: 'absolute',
                                right: '15px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--primary)',
                                pointerEvents: 'none',
                                fontSize: '0.8em'
                            }}></i>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="messageSubject" style={{ fontWeight: '600', color: 'var(--neutral-700)' }}>Subject:</label>
                        <input
                            type="text"
                            className="form-control"
                            id="messageSubject"
                            placeholder="Enter message subject"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            style={{ padding: '12px' }}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="messageContent" style={{ fontWeight: '600', color: 'var(--neutral-700)' }}>Message:</label>
                        <textarea
                            className="form-control"
                            id="messageContent"
                            rows="6"
                            placeholder="Type your message here..."
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            style={{ padding: '12px', resize: 'vertical', minHeight: '120px' }}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ fontWeight: '600', color: 'var(--neutral-700)' }}>Attachment:</label>

                        {!formData.attachment ? (
                            <div
                                onClick={() => fileInputRef.current.click()}
                                style={{
                                    border: '2px dashed #ccc',
                                    borderRadius: '8px',
                                    padding: '30px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    backgroundColor: '#fafafa'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.backgroundColor = '#f0fdf4'; }}
                                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.backgroundColor = '#fafafa'; }}
                            >
                                <div style={{ fontSize: '2em', color: 'var(--primary)', marginBottom: '10px' }}>
                                    <i className="fas fa-cloud-upload-alt"></i>
                                </div>
                                <div style={{ fontWeight: '500', color: 'var(--dark)' }}>Click to upload file or drag and drop</div>
                                <div style={{ fontSize: '0.85em', color: 'var(--gray)', marginTop: '5px' }}>Maximum file size: 10MB</div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileSelect}
                                />
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '15px',
                                background: '#f0f4f8',
                                borderRadius: '8px',
                                border: '1px solid #dceefb'
                            }}>
                                <div style={{
                                    width: '40px', height: '40px', background: 'white', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--primary)', fontSize: '1.2em', marginRight: '15px',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                }}>
                                    <i className="fas fa-file-alt"></i>
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {formData.attachment.name}
                                    </div>
                                    <div style={{ fontSize: '0.8em', color: 'var(--gray)' }}>
                                        {(formData.attachment.size / 1024).toFixed(1)} KB
                                    </div>
                                </div>
                                <button
                                    onClick={removeAttachment}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        padding: '5px',
                                        fontSize: '1.1em'
                                    }}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                        <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1, padding: '12px' }} disabled={isSending}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 1, padding: '12px' }} disabled={isSending}>
                            {isSending ? (
                                <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                            ) : (
                                <><i className="fas fa-paper-plane"></i> Send Message</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

MessageModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    recipientName: PropTypes.string,
    onSubmit: PropTypes.func.isRequired
};

export default MessageModal;
