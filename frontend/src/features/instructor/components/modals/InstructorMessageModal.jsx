import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

const InstructorMessageModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        recipientType: 'farmer',
        recipientIds: [], // Changed from recipientId to recipientIds
        subject: '',
        content: '',
        attachment: null
    });

    const [searchTerm, setSearchTerm] = useState('');
    
    // Mock Farmer List (In real app, this would be fetched or passed as prop)
    const mockFarmers = [
        { id: 'FARM-001', name: 'Sunil Perera' },
        { id: 'FARM-002', name: 'Kamal Gunaratne' },
        { id: 'FARM-003', name: 'Nimal Siripala' },
        { id: 'FARM-004', name: 'Wimal Weerawansa' },
        { id: 'FARM-005', name: 'Bandula Gunawardena' }
    ];

    const fileInputRef = useRef(null);
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const filteredFarmers = mockFarmers.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        f.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleFarmerSelection = (farmerId) => {
        setFormData(prev => {
            const isSelected = prev.recipientIds.includes(farmerId);
            const newIds = isSelected 
                ? prev.recipientIds.filter(id => id !== farmerId)
                : [...prev.recipientIds, farmerId];
            return { ...prev, recipientIds: newIds };
        });
    };

    const toggleSelectAll = () => {
        setFormData(prev => {
            const allFilteredIds = filteredFarmers.map(f => f.id);
            const areAllSelected = allFilteredIds.every(id => prev.recipientIds.includes(id));
            
            let newIds;
            if (areAllSelected) {
                // Remove all filtered IDs
                newIds = prev.recipientIds.filter(id => !allFilteredIds.includes(id));
            } else {
                // Add all filtered IDs that aren't already there
                newIds = [...new Set([...prev.recipientIds, ...allFilteredIds])];
            }
            return { ...prev, recipientIds: newIds };
        });
    };

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

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        if (!formData.subject || !formData.content || (formData.recipientType === 'farmer' && formData.recipientIds.length === 0)) {
            alert('Please fill in all required fields and select at least one recipient');
            return;
        }

        setIsSending(true);
        // Simulate network delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));

        onSubmit(formData);
        setFormData({ 
            recipientType: 'farmer',
            recipientIds: [],
            subject: '', 
            content: '', 
            attachment: null 
        });
        setIsSending(false);
        onClose();
    };

    return (
        <div className="theme-instructor">
            <div className="instructor-modal show" onClick={(e) => e.target.className.includes('instructor-modal') && onClose()}>
                <div className="instructor-modal-content" style={{ maxWidth: '600px' }}>
                    <div className="instructor-modal-header">
                        <div className="instructor-modal-title" style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: 'var(--primary-light)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', color: 'white',
                                marginRight: '15px'
                            }}>
                                <i className="fas fa-paper-plane"></i>
                            </div>
                            Send Message
                        </div>
                        <button className="instructor-close" onClick={onClose} style={{ background: 'none', border: 'none' }}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <div className="instructor-modal-body">
                        <div className="form-group">
                            <label style={{ fontWeight: '600', color: 'var(--primary-dark)', display: 'block', marginBottom: '8px' }}>Send to:</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <select
                                    className="form-control"
                                    value={formData.recipientType}
                                    onChange={(e) => setFormData({ ...formData, recipientType: e.target.value })}
                                    style={{
                                        padding: '12px 15px',
                                        paddingLeft: '45px',
                                        paddingRight: '40px',
                                        borderRadius: '10px',
                                        border: '2px solid #bbdefb',
                                        backgroundColor: '#f5f9ff',
                                        color: 'var(--primary-dark)',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        appearance: 'none',
                                        width: '100%',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 4px rgba(21, 101, 192, 0.05)'
                                    }}
                                >
                                    <option value="farmer">Registered Farmers</option>
                                    <option value="admin">System Administrators</option>
                                </select>
                                <div style={{
                                    position: 'absolute',
                                    left: '15px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '24px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    color: 'var(--primary)',
                                    pointerEvents: 'none',
                                    fontSize: '1.1em'
                                }}>
                                    <i className={formData.recipientType === 'farmer' ? 'fas fa-users' : 'fas fa-user-shield'}></i>
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    right: '15px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--primary)',
                                    pointerEvents: 'none',
                                    fontSize: '0.8em',
                                    opacity: 0.7
                                }}>
                                    <i className="fas fa-chevron-down"></i>
                                </div>
                            </div>
                        </div>

                        {formData.recipientType === 'farmer' && (
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ fontWeight: '600', color: 'var(--gray)', display: 'block', marginBottom: '8px' }}>
                                    Recipients ({formData.recipientIds.length} selected):
                                </label>
                                
                                <div style={{ 
                                    border: '1px solid #ddd', 
                                    borderRadius: '8px', 
                                    padding: '10px',
                                    backgroundColor: '#fff'
                                }}>
                                    {/* Search Input */}
                                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search farmers..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{ padding: '8px 12px 8px 35px', fontSize: '0.9em', borderRadius: '6px' }}
                                        />
                                        <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999', fontSize: '0.9em' }}></i>
                                    </div>

                                    {/* Select All */}
                                    <div style={{ 
                                        padding: '5px 10px', 
                                        borderBottom: '1px solid #eee', 
                                        marginBottom: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        <input 
                                            type="checkbox" 
                                            id="select-all" 
                                            checked={filteredFarmers.length > 0 && filteredFarmers.every(f => formData.recipientIds.includes(f.id))}
                                            onChange={toggleSelectAll}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <label htmlFor="select-all" style={{ fontWeight: '600', cursor: 'pointer', fontSize: '0.9em', margin: 0 }}>
                                            Select All Filtered
                                        </label>
                                    </div>

                                    {/* Farmer List */}
                                    <div style={{ maxHeight: '150px', overflowY: 'auto', padding: '5px' }}>
                                        {filteredFarmers.length > 0 ? filteredFarmers.map(farmer => (
                                            <div key={farmer.id} style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '10px', 
                                                padding: '6px 10px',
                                                borderRadius: '4px',
                                                transition: 'background 0.2s',
                                                backgroundColor: formData.recipientIds.includes(farmer.id) ? '#f0f7ff' : 'transparent'
                                            }}>
                                                <input 
                                                    type="checkbox" 
                                                    id={`farmer-${farmer.id}`}
                                                    checked={formData.recipientIds.includes(farmer.id)}
                                                    onChange={() => toggleFarmerSelection(farmer.id)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <label htmlFor={`farmer-${farmer.id}`} style={{ cursor: 'pointer', fontSize: '0.9em', margin: 0, flex: 1 }}>
                                                    <span style={{ fontWeight: '500' }}>{farmer.name}</span>
                                                    <span style={{ color: '#666', fontSize: '0.85em', marginLeft: '8px' }}>({farmer.id})</span>
                                                </label>
                                            </div>
                                        )) : (
                                            <div style={{ textAlign: 'center', padding: '15px', color: '#999', fontSize: '0.9em' }}>
                                                No farmers found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label htmlFor="messageSubject" style={{ fontWeight: '600', color: 'var(--gray)', display: 'block', marginBottom: '8px' }}>Subject:</label>
                            <input
                                type="text"
                                className="form-control"
                                id="messageSubject"
                                placeholder="Enter message subject"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                style={{ padding: '12px', width: '100%', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label htmlFor="messageContent" style={{ fontWeight: '600', color: 'var(--gray)', display: 'block', marginBottom: '8px' }}>Message:</label>
                            <textarea
                                className="form-control"
                                id="messageContent"
                                rows="5"
                                placeholder="Type your message here..."
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                style={{ padding: '12px', resize: 'vertical', minHeight: '100px', width: '100%', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '5px' }}>
                            <label style={{ fontWeight: '600', color: 'var(--gray)', display: 'block', marginBottom: '8px' }}>Attachment:</label>

                            {!formData.attachment ? (
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    style={{
                                        border: '2px dashed #bbdefb',
                                        borderRadius: '8px',
                                        padding: '20px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        backgroundColor: '#f8fbfe'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.backgroundColor = '#e3f2fd'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#bbdefb'; e.currentTarget.style.backgroundColor = '#f8fbfe'; }}
                                >
                                    <div style={{ fontSize: '1.5em', color: 'var(--primary)', marginBottom: '8px' }}>
                                        <i className="fas fa-cloud-upload-alt"></i>
                                    </div>
                                    <div style={{ fontWeight: '500', color: 'var(--dark)', fontSize: '0.9em' }}>Click to upload file or drag and drop</div>
                                    <div style={{ fontSize: '0.75em', color: 'var(--gray)', marginTop: '4px' }}>Maximum file size: 10MB</div>
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
                                    padding: '12px',
                                    background: '#f0f7ff',
                                    borderRadius: '8px',
                                    border: '1px solid #bbdefb'
                                }}>
                                    <div style={{
                                        width: '35px', height: '35px', background: 'white', borderRadius: '6px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--primary)', fontSize: '1.1em', marginRight: '12px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}>
                                        <i className="fas fa-file-alt"></i>
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9em' }}>
                                            {formData.attachment.name}
                                        </div>
                                        <div style={{ fontSize: '0.75em', color: 'var(--gray)' }}>
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
                                            fontSize: '1em'
                                        }}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="instructor-modal-footer">
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={onClose}
                            style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: '600' }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-primary" 
                            onClick={handleSubmit}
                            disabled={isSending}
                            style={{ 
                                padding: '10px 25px', 
                                borderRadius: '8px', 
                                fontWeight: '600',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: isSending ? 'not-allowed' : 'pointer',
                                opacity: isSending ? 0.7 : 1
                            }}
                        >
                            {isSending ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane"></i>
                                    Send Message
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

InstructorMessageModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};

export default InstructorMessageModal;
