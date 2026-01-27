import React, { useState } from 'react';
import PropTypes from 'prop-types';

const InstructorMessageModal = ({ isOpen, onClose, onSubmit }) => {
    const [message, setMessage] = useState('');
    const [recipient, setRecipient] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ recipient, message });
        setMessage('');
        setRecipient('');
        onClose();
    };

    return (
        <div className="modal" style={{ display: 'flex' }}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Send Message to Farmer</h3>
                    <span className="close" onClick={onClose}>&times;</span>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Recipient (Farmer ID or Name)</label>
                            <input
                                type="text"
                                className="form-control"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                placeholder="Enter Farmer ID"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Message</label>
                            <textarea
                                className="form-control"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows="5"
                                required
                            ></textarea>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Send Message</button>
                        </div>
                    </form>
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
