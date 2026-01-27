import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const Settings = () => {
    const { showToast } = useOutletContext();

    const [settings, setSettings] = useState({
        farmerId: 'FARM-2026-0001',
        district: 'Anuradhapura',
        // Locations Array: Each location has its own businessArea, division, and instructor
        locations: [
            {
                id: 1,
                businessArea: 'Rajanganaya',
                instructorDivision: 'Yaya 4',
                assignedInstructorId: 'INST-2026-0005',
                assignedInstructorName: 'Piyadasa Silva'
            },
            {
                id: 2,
                businessArea: 'Vilachchiya',
                instructorDivision: 'Track 4',
                assignedInstructorId: 'INST-2026-0007',
                assignedInstructorName: 'Upul Tharanga'
            }
        ],
        fullName: 'Sunil Perera',
        email: 'sunil.perera@example.com',
        phone: '+94 77 123 4567',
        messageNotifications: true,
        weatherAlerts: true,
        pestAlerts: true
    });

    // Mock Data for Hierarchy
    const businessAreaOptions = [
        { id: 'BA-001', name: 'Nochchiyagama' },
        { id: 'BA-002', name: 'Thambuttegama' },
        { id: 'BA-003', name: 'Galenbindunuwewa' },
        { id: 'BA-004', name: 'Rajanganaya' },
        { id: 'BA-005', name: 'Vilachchiya' },
        { id: 'BA-006', name: 'Huruluwewa' }
    ];

    const instructorDivisionOptions = [
        // Nochchiyagama
        { id: 'ID-001', name: 'Nochchiyagama Town', businessAreaId: 'BA-001', instructorId: 'INST-2026-0001', instructorName: 'Rohan Silva' },
        { id: 'ID-002', name: 'Pahala Halmillewa', businessAreaId: 'BA-001', instructorId: 'INST-2026-0002', instructorName: 'Nimal Perera' },
        // Thambuttegama
        { id: 'ID-003', name: 'Thambuttegama West', businessAreaId: 'BA-002', instructorId: 'INST-2026-0003', instructorName: 'Kamal Gunaratne' },
        // Galenbindunuwewa
        { id: 'ID-004', name: 'Galenbindunuwewa South', businessAreaId: 'BA-003', instructorId: 'INST-2026-0004', instructorName: 'Saman Kumara' },
        // Rajanganaya
        { id: 'ID-005', name: 'Yaya 4', businessAreaId: 'BA-004', instructorId: 'INST-2026-0005', instructorName: 'Piyadasa Silva' },
        { id: 'ID-006', name: 'Yaya 5', businessAreaId: 'BA-004', instructorId: 'INST-2026-0006', instructorName: 'Kusum Perera' },
        // Vilachchiya
        { id: 'ID-007', name: 'Track 4', businessAreaId: 'BA-005', instructorId: 'INST-2026-0007', instructorName: 'Upul Tharanga' },
        { id: 'ID-008', name: 'Track 5', businessAreaId: 'BA-005', instructorId: 'INST-2026-0008', instructorName: 'Ruwan Hettiarachchi' },
        // Huruluwewa
        { id: 'ID-009', name: 'Huruluwewa Left Bank', businessAreaId: 'BA-006', instructorId: 'INST-2026-0009', instructorName: 'Anura Bandara' },
        { id: 'ID-010', name: 'Huruluwewa Right Bank', businessAreaId: 'BA-006', instructorId: 'INST-2026-0010', instructorName: 'Champa Kumari' }
    ];

    const handleLocationChange = (index, field, value) => {
        const updatedLocations = [...settings.locations];
        const location = { ...updatedLocations[index] };

        if (field === 'businessArea') {
            const selectedArea = businessAreaOptions.find(opt => opt.name === value);
            // Reset division when business area changes
            const validDivisions = instructorDivisionOptions.filter(div => div.businessAreaId === selectedArea?.id);
            const defaultDivision = validDivisions.length > 0 ? validDivisions[0] : null;

            location.businessArea = value;
            location.instructorDivision = defaultDivision ? defaultDivision.name : '';
            location.assignedInstructorId = defaultDivision ? defaultDivision.instructorId : '';
            location.assignedInstructorName = defaultDivision ? defaultDivision.instructorName : '';
        } else if (field === 'instructorDivision') {
            const selectedDivision = instructorDivisionOptions.find(div => div.name === value);
            if (selectedDivision) {
                location.instructorDivision = value;
                location.assignedInstructorId = selectedDivision.instructorId;
                location.assignedInstructorName = selectedDivision.instructorName;
            }
        }

        updatedLocations[index] = location;
        setSettings({ ...settings, locations: updatedLocations });
    };

    const addLocation = () => {
        setSettings({
            ...settings,
            locations: [
                ...settings.locations,
                {
                    id: Date.now(),
                    businessArea: businessAreaOptions[0].name, // Default to first
                    instructorDivision: instructorDivisionOptions.find(d => d.businessAreaId === businessAreaOptions[0].id).name,
                    assignedInstructorId: instructorDivisionOptions.find(d => d.businessAreaId === businessAreaOptions[0].id).instructorId,
                    assignedInstructorName: instructorDivisionOptions.find(d => d.businessAreaId === businessAreaOptions[0].id).instructorName
                }
            ]
        });
    };

    const removeLocation = (index) => {
        if (settings.locations.length > 1) {
            const updatedLocations = settings.locations.filter((_, i) => i !== index);
            setSettings({ ...settings, locations: updatedLocations });
        } else {
            showToast('You must have at least one farming location.');
        }
    };

    const saveProfile = () => {
        showToast('Profile updated successfully!');
    };

    const changePassword = () => {
        showToast('Password changed successfully!');
    };

    return (
        <div className="page active" id="settings" style={{ display: 'block' }}>
            <div className="page-title">
                <i className="fas fa-cog"></i>
                <h2>Settings</h2>
            </div>

            <div className="settings-container">
                {/* Profile Settings */}
                <div className="settings-section">
                    <div className="settings-header">
                        <i className="fas fa-user"></i>
                        <h3>Profile Settings</h3>
                    </div>

                    <div className="profile-picture">
                        <div className="profile-image-container">
                            <div className="profile-avatar">SP</div>
                        </div>
                        <div className="profile-picture-actions">
                            <button className="btn btn-primary" onClick={() => document.getElementById('uploadImage').click()}>
                                <i className="fas fa-upload"></i> Upload New Photo
                            </button>
                            <input type="file" id="uploadImage" style={{ display: 'none' }} accept="image/*" />
                            <button className="btn btn-secondary" onClick={() => showToast('Profile image removed')}>
                                <i className="fas fa-trash"></i> Remove Photo
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="farmerId">Farmer ID</label>
                        <input
                            type="text"
                            id="farmerId"
                            className="form-control"
                            value={settings.farmerId}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="fullName">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            className="form-control"
                            value={settings.fullName}
                            onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            className="form-control"
                            value={settings.email}
                            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                            type="tel"
                            id="phone"
                            className="form-control"
                            value={settings.phone}
                            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        />
                    </div>

                    <button className="btn btn-primary" onClick={saveProfile}>
                        <i className="fas fa-save"></i> Update Profile
                    </button>
                </div>

                {/* Location & Land Details */}
                <div className="settings-section">
                    <div className="settings-header">
                        <i className="fas fa-map-marker-alt"></i>
                        <h3>Location &amp; Land Details</h3>
                    </div>

                    <div className="form-group">
                        <label htmlFor="district">District</label>
                        <input
                            type="text"
                            id="district"
                            className="form-control"
                            value={settings.district}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label>Farming Locations</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {settings.locations.map((location, index) => (
                                <div key={location.id} style={{ 
                                    padding: '15px', 
                                    border: '1px solid #ddd', 
                                    borderRadius: '8px', 
                                    backgroundColor: '#f9f9f9',
                                    position: 'relative'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', color: '#2c3e50' }}>Location {index + 1}</h4>
                                        {settings.locations.length > 1 && (
                                            <button 
                                                className="btn btn-sm btn-danger" 
                                                onClick={() => removeLocation(index)}
                                                style={{ padding: '2px 8px', fontSize: '0.8rem' }}
                                            >
                                                <i className="fas fa-trash"></i> Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '10px' }}>
                                        <label style={{ fontSize: '0.9rem' }}>Business Area</label>
                                        <select
                                            className="form-control"
                                            value={location.businessArea}
                                            onChange={(e) => handleLocationChange(index, 'businessArea', e.target.value)}
                                        >
                                            {businessAreaOptions.map(option => (
                                                <option key={option.id} value={option.name}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '10px' }}>
                                        <label style={{ fontSize: '0.9rem' }}>Instructor Division</label>
                                        <select
                                            className="form-control"
                                            value={location.instructorDivision}
                                            onChange={(e) => handleLocationChange(index, 'instructorDivision', e.target.value)}
                                        >
                                            {instructorDivisionOptions
                                                .filter(div => {
                                                    const selectedArea = businessAreaOptions.find(opt => opt.name === location.businessArea);
                                                    return div.businessAreaId === selectedArea?.id;
                                                })
                                                .map(division => (
                                                    <option key={division.id} value={division.name}>
                                                        {division.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.9rem' }}>Assigned Instructor</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={`${location.assignedInstructorName} (${location.assignedInstructorId})`}
                                            disabled
                                            style={{ backgroundColor: '#e9ecef' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button 
                            className="btn btn-secondary" 
                            onClick={addLocation}
                            style={{ marginTop: '10px', width: '100%' }}
                        >
                            <i className="fas fa-plus"></i> Add Another Location
                        </button>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="settings-section">
                    <div className="settings-header">
                        <i className="fas fa-shield-alt"></i>
                        <h3>Security Settings</h3>
                    </div>

                    <div className="form-group">
                        <label htmlFor="currentPassword">Current Password</label>
                        <input type="password" id="currentPassword" className="form-control" placeholder="Enter current password" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <input type="password" id="newPassword" className="form-control" placeholder="Enter new password" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input type="password" id="confirmPassword" className="form-control" placeholder="Confirm new password" />
                    </div>
                    <button className="btn btn-primary" onClick={changePassword}>
                        <i className="fas fa-key"></i> Change Password
                    </button>
                </div>

                {/* Notification Preferences */}
                <div className="settings-section">
                    <div className="settings-header">
                        <i className="fas fa-bell"></i>
                        <h3>Notification Preferences</h3>
                    </div>

                    {[
                        { id: 'messageNotifications', label: 'Message Notifications' },
                        { id: 'weatherAlerts', label: 'Weather Alerts' },
                        { id: 'pestAlerts', label: 'Pest & Disease Alerts' }
                    ].map(item => (
                        <div className="toggle-label" key={item.id}>
                            <span>{item.label}</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    id={item.id}
                                    checked={settings[item.id]}
                                    onChange={(e) => setSettings({ ...settings, [item.id]: e.target.checked })}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    ))}
                    <button className="btn btn-primary" onClick={() => showToast('Notification preferences saved!')}>
                        <i className="fas fa-bell"></i> Save Preferences
                    </button>
                </div>

                {/* Danger Zone */}
                <div className="settings-section">
                    <div className="settings-header">
                        <i className="fas fa-exclamation-triangle"></i>
                        <h3>Danger Zone</h3>
                    </div>

                    <p style={{ color: 'var(--gray)', marginBottom: '20px' }}>
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <div className="settings-actions">
                        <button className="btn btn-danger" onClick={() => {
                            if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                                showToast('Account deletion request submitted');
                            }
                        }}>
                            <i className="fas fa-trash"></i> Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
