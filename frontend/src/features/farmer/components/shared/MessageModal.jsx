import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import '../../../admin/styles/AdminDash.css'; // Import admin modal styles

// Farmer-specific modal overrides
const farmerModalStyles = `
  /* Override farmer theme modal styles and force admin modal styles */
  .theme-farmer .admin-modal,
  .theme-farmer .modal-overlay {
    background: rgba(0, 0, 0, 0.5) !important;
    backdrop-filter: blur(15px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(15px) saturate(180%) !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    z-index: 999999 !important;
    opacity: 1 !important;
    visibility: visible !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  .theme-farmer .admin-modal.active,
  .theme-farmer .modal-overlay.active {
    display: flex !important;
    opacity: 1 !important;
    align-items: center !important;
    justify-content: center !important;
    visibility: visible !important;
  }
  
  .theme-farmer .admin-modal-content,
  .theme-farmer .modal {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(20px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
    border: 1px solid rgba(255, 255, 255, 0.4) !important;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15) !important;
    transform: none !important;
    animation: none !important;
  }
  
  .theme-farmer .admin-modal-header,
  .theme-farmer .modal-header {
    background: rgba(248, 249, 250, 0.5) !important;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
  }
  
  .theme-farmer .admin-modal-footer,
  .theme-farmer .modal-footer {
    background: rgba(248, 249, 250, 0.5) !important;
    border-top: 1px solid rgba(0, 0, 0, 0.05) !important;
  }
  
  .theme-farmer .admin-form-control {
    background: rgba(255, 255, 255, 0.5) !important;
    border: 1px solid rgba(0, 0, 0, 0.08) !important;
    color: var(--neutral-800) !important;
  }
  
  .theme-farmer .admin-form-control:focus {
    border-color: var(--primary) !important;
    box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1) !important;
  }
  
  .theme-farmer .btn-send {
    background: linear-gradient(135deg, var(--primary), #2d7a2d) !important;
    box-shadow: 0 4px 15px rgba(46, 125, 50, 0.3) !important;
  }
  
  .theme-farmer .btn-send:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(46, 125, 50, 0.4) !important;
    filter: brightness(1.1) !important;
  }
`;

const MessageModal = ({ isOpen, onClose, recipientName = "Agriculture Instructor", recipientId = null, onSubmit }) => {
    const [formData, setFormData] = useState({
        recipient_type: recipientId ? 'select' : 'admin',
        recipient_id: recipientId,
        subject: '',
        content: '',
        attachment: null
    });

    const fileInputRef = useRef(null);
    const [isSending, setIsSending] = useState(false);

    // Inject farmer-specific modal styles
    useEffect(() => {
        if (isOpen) {
            // Remove any existing styles first
            const existingStyle = document.getElementById('farmer-modal-styles');
            if (existingStyle) {
                document.head.removeChild(existingStyle);
            }
            
            // Create style element with higher specificity
            const styleElement = document.createElement('style');
            styleElement.id = 'farmer-modal-styles';
            styleElement.textContent = farmerModalStyles;
            styleElement.type = 'text/css';
            
            // Append to head to ensure it loads
            document.head.appendChild(styleElement);
            
            // Force a reflow to ensure styles are applied
            setTimeout(() => {
                document.body.style.display = 'none';
                document.body.offsetHeight; // Trigger reflow
                document.body.style.display = '';
            }, 10);

            // Cleanup function
            return () => {
                const styleToRemove = document.getElementById('farmer-modal-styles');
                if (styleToRemove) {
                    document.head.removeChild(styleToRemove);
                }
            };
        }
    }, [isOpen]);

    useEffect(() => {
        console.log('🔄 [MessageModal] Component Mounted - isOpen:', isOpen);
        return () => console.log('👋 [MessageModal] Component Unmounting');
    }, [isOpen]);

    console.log('📬 [MessageModal] Render - isOpen:', isOpen);

    if (!isOpen) return null;

    const handleRecipientChange = (val) => {
        if (val === 'instructor') {
            setFormData({ ...formData, recipient_type: 'select', recipient_id: recipientId });
        } else {
            setFormData({ ...formData, recipient_type: 'admin', recipient_id: null });
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size exceeds 10MB limit');
                return;
            }
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

        // Validate recipient selection
        if (formData.recipient_type === 'select' && !formData.recipient_id) {
            alert('Please select a valid recipient');
            return;
        }

        setIsSending(true);

        // Use FormData for file upload support
        const data = new FormData();
        data.append('subject', formData.subject);
        data.append('content', formData.content);
        data.append('recipient_type', formData.recipient_type);
        
        // Handle recipient_ids for select type
        if (formData.recipient_type === 'select' && formData.recipient_id) {
            data.append('recipient_ids', JSON.stringify([formData.recipient_id]));
        }
        
        if (formData.attachment) {
            data.append('attachment', formData.attachment);
        }

        try {
            await onSubmit(data);
            setFormData({
                recipient_type: recipientId ? 'select' : 'admin',
                recipient_id: recipientId,
                subject: '',
                content: '',
                attachment: null
            });
            onClose();
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    return createPortal(
        <div
            className="admin-modal active theme-farmer"
            id="farmerMessageModal"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(15px) saturate(180%)',
                WebkitBackdropFilter: 'blur(15px) saturate(180%)',
                zIndex: 999999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div className="admin-modal-content">
                <div className="admin-modal-header">
                    <div className="admin-modal-title">New Message</div>
                    <button className="admin-modal-close-round" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="admin-modal-body custom-scrollbar">
                    <div className="admin-form-group">
                        <label htmlFor="recipientType">Send to:</label>
                        <select
                            id="recipientType"
                            className="admin-form-control"
                            value={formData.recipient_type === 'select' ? 'instructor' : formData.recipient_type}
                            onChange={(e) => handleRecipientChange(e.target.value)}
                        >
                            {recipientId && (
                                <option value="instructor">{recipientName} (Instructor)</option>
                            )}
                            <option value="admin">System Administration</option>
                        </select>
                    </div>

                    <div className="admin-form-group">
                        <label htmlFor="messageSubject">Subject:</label>
                        <input
                            type="text"
                            id="messageSubject"
                            className="admin-form-control"
                            placeholder="What is this regarding?"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        />
                    </div>

                    <div className="admin-form-group">
                        <label htmlFor="messageContent">Message Content:</label>
                        <textarea
                            id="messageContent"
                            className="admin-form-control"
                            rows="6"
                            placeholder="Type your message here..."
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="admin-form-group">
                        <label>Attachment:</label>
                        <div
                            className="file-upload-zone"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <div className="upload-icon-wrapper">
                                <i className="fas fa-cloud-upload-alt"></i>
                            </div>
                            <div className="upload-text-primary">Add attachment</div>
                            <div className="upload-text-secondary">Images, PDF or Documents (Max 10MB)</div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />
                        </div>
                        {formData.attachment && (
                            <div className="file-info-card">
                                <div className="file-icon">
                                    <i className="fas fa-file-alt"></i>
                                </div>
                                <div className="file-details">
                                    <span className="file-name">{formData.attachment.name}</span>
                                    <span className="file-size">{(formData.attachment.size / 1024).toFixed(1)} KB</span>
                                </div>
                                {formData.attachment.type.startsWith('image/') && (
                                    <div className="file-preview">
                                        <img
                                            src={URL.createObjectURL(formData.attachment)}
                                            alt="Preview"
                                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                                        />
                                    </div>
                                )}
                                <button type="button" className="btn-remove-file" onClick={removeAttachment}>
                                    <i className="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="admin-modal-footer">
                    <button className="btn btn-secondary" onClick={onClose} disabled={isSending}>Cancel</button>
                    <button className="btn btn-send" onClick={handleSubmit} disabled={isSending}>
                        {isSending ? (
                            <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                        ) : (
                            <><i className="fas fa-paper-plane"></i> Send Message</>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

MessageModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    recipientName: PropTypes.string,
    recipientId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onSubmit: PropTypes.func.isRequired
};

export default MessageModal;
