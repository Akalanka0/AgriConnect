import React, { useState } from 'react';
import PropTypes from 'prop-types';

const MessageModal = ({ isOpen, onClose, recipientName = "Rohan Silva - Agriculture Instructor", onSubmit }) => {
    const [formData, setFormData] = useState({
        subject: '',
        content: '',
        attachment: null
    });

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!formData.subject || !formData.content) {
            // Simple validation, parent can also validate
            alert('Please fill in both subject and message fields');
            return;
        }
        onSubmit(formData);
        setFormData({ subject: '', content: '', attachment: null });
    };

    return (
        <div className="modal-overlay active" onClick={(e) => e.target.className.includes('modal-overlay') && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <div className="modal-title">
                        <i className="fas fa-envelope"></i>
                        Send Message to Instructor
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="modal-content">
                    <div className="form-group">
                        <label>Send to:</label>
                        <div style={{ background: 'var(--light-gray)', padding: '12px', borderRadius: 'var(--border-radius)', marginTop: '5px' }}>
                            <strong>{recipientName}</strong>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="messageSubject">Subject:</label>
                        <input
                            type="text"
                            className="form-control"
                            id="messageSubject"
                            placeholder="Enter message subject"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="messageContent">Message:</label>
                        <textarea
                            className="form-control"
                            id="messageContent"
                            rows="6"
                            placeholder="Type your message here..."
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Attachment:</label>
                        <div className="file-upload">
                            <input
                                type="file"
                                className="form-control"
                                id="messageAttachment"
                                onChange={(e) => setFormData({ ...formData, attachment: e.target.files[0] })}
                            />
                            <small className="file-hint">Click to upload file or drag and drop. Max 10MB.</small>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
                            <i className="fas fa-times"></i> Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 1 }}>
                            <i className="fas fa-paper-plane"></i> Send Message
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
