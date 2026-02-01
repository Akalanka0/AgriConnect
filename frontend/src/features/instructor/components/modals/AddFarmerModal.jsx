import React, { useState } from 'react';
import PropTypes from 'prop-types';

const AddFarmerModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        contact: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    return (
        <div className="theme-instructor">
            <div className="instructor-modal" style={{ display: 'flex' }}>
                <div className="instructor-modal-content">
                    <div className="instructor-modal-header">
                        <h3 className="instructor-modal-title">Add New Farmer</h3>
                        <span className="instructor-close" onClick={onClose}>&times;</span>
                    </div>
                    <div className="instructor-modal-body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-control"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    className="form-control"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Contact Number</label>
                                <input
                                    type="text"
                                    name="contact"
                                    className="form-control"
                                    value={formData.contact}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="instructor-modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                                <button type="submit" className="btn btn-success">Add Farmer</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

AddFarmerModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};

export default AddFarmerModal;
