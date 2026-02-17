import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import '../../../admin/styles/AdminDash.css'; // Import admin modal styles

// Instructor-specific modal overrides
const instructorModalStyles = `
  .theme-instructor .admin-modal {
    background: rgba(0, 0, 0, 0.45) !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
  }
  
  .theme-instructor .admin-modal-content {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(20px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
    border: 1px solid rgba(255, 255, 255, 0.4) !important;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15) !important;
  }
  
  .theme-instructor .admin-modal-header {
    background: rgba(248, 249, 250, 0.5) !important;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
  }
  
  .theme-instructor .admin-modal-footer {
    background: rgba(248, 249, 250, 0.5) !important;
    border-top: 1px solid rgba(0, 0, 0, 0.05) !important;
  }
  
  .theme-instructor .admin-form-control {
    background: rgba(255, 255, 255, 0.5) !important;
    border: 1px solid rgba(0, 0, 0, 0.08) !important;
    color: var(--neutral-800) !important;
  }
  
  .theme-instructor .admin-form-control:focus {
    border-color: var(--primary) !important;
    box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.1) !important;
  }
  
  .theme-instructor .btn-send {
    background: linear-gradient(135deg, var(--primary), #1565c0) !important;
    box-shadow: 0 4px 15px rgba(21, 101, 192, 0.3) !important;
  }
  
  .theme-instructor .btn-send:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(21, 101, 192, 0.4) !important;
    filter: brightness(1.1) !important;
  }
  
  .theme-instructor .user-selection-container {
    background: rgba(255, 255, 255, 0.3) !important;
    border: 1px solid rgba(0, 0, 0, 0.08) !important;
    border-radius: 16px !important;
    padding: 16px !important;
    backdrop-filter: blur(5px) !important;
  }
  
  .theme-instructor .farmer-search-container {
    position: relative !important;
    margin-bottom: 12px !important;
  }
  
  .theme-instructor .search-icon {
    position: absolute !important;
    left: 15px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    color: var(--primary) !important;
    opacity: 0.6 !important;
  }
  
  .theme-instructor .farmer-search-container .admin-form-control {
    padding-left: 45px !important;
  }
  
  .theme-instructor .select-all-container {
    padding: 8px 12px !important;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
    margin-bottom: 8px !important;
  }
  
  .theme-instructor .farmer-list {
    max-height: 180px !important;
    overflow-y: auto !important;
    padding: 4px !important;
  }
  
  .theme-instructor .user-checkbox-item {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    padding: 8px 12px !important;
    border-radius: 10px !important;
    transition: all 0.2s !important;
    cursor: pointer !important;
    margin-bottom: 4px !important;
  }
  
  .theme-instructor .user-checkbox-item:hover {
    background: rgba(21, 101, 192, 0.08) !important;
  }
  
  .theme-instructor .user-checkbox-item input[type="checkbox"] {
    width: 16px !important;
    height: 16px !important;
    cursor: pointer !important;
  }
  
  .theme-instructor .user-checkbox-item span {
    flex: 1 !important;
    font-size: 0.92em !important;
    color: var(--neutral-800) !important;
  }
`;

const InstructorMessageModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        recipient_type: 'farmers', // Backend ENUM: 'all', 'farmers', 'instructors', 'select'
        recipient_ids: [], // We'll handle multiple recipients by mapping to individual rows in the backend
        subject: '',
        content: '',
        attachment: null
    });

    const [farmers, setFarmers] = useState([]);
    const [isLoadingFarmers, setIsLoadingFarmers] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fileInputRef = useRef(null);
    const [isSending, setIsSending] = useState(false);

    // Inject instructor-specific modal styles
    useEffect(() => {
        if (isOpen) {
            // Create style element
            const styleElement = document.createElement('style');
            styleElement.id = 'instructor-modal-styles';
            styleElement.textContent = instructorModalStyles;
            document.head.appendChild(styleElement);

            // Cleanup function
            return () => {
                const existingStyle = document.getElementById('instructor-modal-styles');
                if (existingStyle) {
                    document.head.removeChild(existingStyle);
                }
            };
        }
    }, [isOpen]);

    const filteredFarmers = farmers.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.displayId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleFarmerSelection = (id) => {
        setFormData(prev => {
            const recipient_ids = prev.recipient_ids.includes(id)
                ? prev.recipient_ids.filter(rid => rid !== id)
                : [...prev.recipient_ids, id];
            return { ...prev, recipient_ids };
        });
    };

    const toggleSelectAll = () => {
        const allFilteredIds = filteredFarmers.map(f => f.id);
        const areAllSelected = allFilteredIds.every(id => formData.recipient_ids.includes(id));

        if (areAllSelected) {
            setFormData(prev => ({
                ...prev,
                recipient_ids: prev.recipient_ids.filter(id => !allFilteredIds.includes(id))
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                recipient_ids: Array.from(new Set([...prev.recipient_ids, ...allFilteredIds]))
            }));
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

    const removeAttachment = () => {
        setFormData({ ...formData, attachment: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!formData.subject.trim() || !formData.content.trim()) {
            alert('Please fill in both subject and message fields');
            return;
        }

        if (formData.recipient_type === 'farmers' && formData.recipient_ids.length === 0) {
            alert('Please select at least one farmer recipient');
            return;
        }

        setIsSending(true);

        const data = new FormData();
        data.append('subject', formData.subject);
        data.append('content', formData.content);
        
        if (formData.recipient_type === 'farmers') {
            data.append('recipient_type', 'select');
            data.append('recipient_ids', JSON.stringify(formData.recipient_ids));
        } else {
            data.append('recipient_type', formData.recipient_type);
        }

        if (formData.attachment) {
            data.append('attachment', formData.attachment);
        }

        try {
            await onSubmit(data);
            setFormData({
                recipient_type: 'farmers',
                recipient_ids: [],
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

    useEffect(() => {
        let isMounted = true;
        
        const fetchFarmers = async () => {
            if (!isMounted) return;
            try {
                const res = await fetch('/api/instructor/farmers', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();
                if (data.success && isMounted) {
                    setFarmers(data.data.map(f => ({
                        id: f.id,
                        name: f.name,
                        displayId: f.displayId || `FARM-${f.id.toString().padStart(4, '0')}`
                    })));
                }
            } catch (error) {
                if (isMounted) console.error('Error fetching farmers:', error);
            } finally {
                if (isMounted) setIsLoadingFarmers(false);
            }
        };
        
        if (isOpen) fetchFarmers();
        
        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    return createPortal(
        <div className="theme-instructor">
            <div
                className="admin-modal active"
                id="instructorMessageModal"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <div className="admin-modal-content">
                    <div className="admin-modal-header">
                        <div className="admin-modal-title">Send New Message</div>
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
                                value={formData.recipient_type}
                                onChange={(e) => setFormData({ ...formData, recipient_type: e.target.value })}
                            >
                                <option value="farmers">Registered Farmers</option>
                                <option value="admin">System Administrators</option>
                            </select>
                        </div>

                        {formData.recipient_type === 'farmers' && (
                            <div className="admin-form-group" id="farmerSelectionModal">
                                <label>Recipients ({formData.recipient_ids.length} selected):</label>
                                <div className="user-selection-container custom-scrollbar">
                                    {/* Search Input */}
                                    <div className="farmer-search-container">
                                        <input
                                            type="text"
                                            className="admin-form-control"
                                            placeholder="Search farmers..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <i className="fas fa-search search-icon"></i>
                                    </div>

                                    {/* Select All */}
                                    <div className="select-all-container">
                                        <label className="user-checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={filteredFarmers.length > 0 && filteredFarmers.every(f => formData.recipient_ids.includes(f.id))}
                                                onChange={toggleSelectAll}
                                            />
                                            <span>Select All Filtered ({filteredFarmers.length})</span>
                                        </label>
                                    </div>

                                    {/* Farmer List */}
                                    <div className="farmer-list">
                                        {filteredFarmers.length > 0 ? filteredFarmers.map(farmer => (
                                            <label key={farmer.id} className="user-checkbox-item">
                                                <input
                                                    type="checkbox"
                                                    value={farmer.id}
                                                    checked={formData.recipient_ids.includes(farmer.id)}
                                                    onChange={() => toggleFarmerSelection(farmer.id)}
                                                />
                                                <span>{farmer.name} ({farmer.displayId})</span>
                                            </label>
                                        )) : (
                                            <p style={{ padding: '10px', color: '#666' }}>No farmers found</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

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
                                <><i className="fas fa-spinner fa-spin"></i> Sending Message...</>
                            ) : (
                                <><i className="fas fa-paper-plane"></i> Send Message</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

InstructorMessageModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};

export default InstructorMessageModal;
