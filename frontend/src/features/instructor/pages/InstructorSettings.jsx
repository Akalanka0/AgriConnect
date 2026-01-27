import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const InstructorSettings = () => {
    const { openModal, showToast } = useOutletContext();

    // Hierarchy data for Anuradhapura
    const hierarchyData = {
        'Nuwaragam Palatha Zone': [
            'Nuwaragam Palatha Central',
            'Nuwaragam Palatha East',
            'Mihintale',
            'Mahavilachchiya',
            'Tantirimale',
            'Nochchiyagama'
        ],
        'Kekirawa Zone': [
            'Kekirawa',
            'Ipalogama',
            'Palagala',
            'Thirappane',
            'Maradankadawala',
            'Galnewa'
        ],
        'Huruluwewa Zone': [
            'Galenbindunuwewa',
            'Kahatagasdigiliya',
            'Horowpothana',
            'Kebithigollewa',
            'Padaviya',
            'Rambewa'
        ]
    };

    // We need local state for settings since this page manages profile/settings editing locally
    const [profileData, setProfileData] = useState({
        fullName: 'Rohan Silva',
        email: 'rohan.silva@agriconnect.lk',
        phone: '+94 77 123 4567',
        district: 'Anuradhapura',
        businessArea: 'Nuwaragam Palatha Zone',
        assignedDivisions: ['Nuwaragam Palatha Central', 'Mihintale'],
        specialization: 'Sustainable Agriculture, Crop Management',
        experience: 8,
        qualifications: 'B.Sc. in Agriculture, Certified Crop Advisor, Sustainable Farming Certification'
    });

    const [notificationSettings, setNotificationSettings] = useState({
        pestReports: true,
        meetingRequests: true,
        feedbackReceived: true,
        cropPlanReviews: true
    });

    const handleProfileChange = (field, value) => {
        if (field === 'businessArea') {
            setProfileData({ 
                ...profileData, 
                [field]: value,
                assignedDivisions: [] // Reset divisions when area changes
            });
        } else {
            setProfileData({ ...profileData, [field]: value });
        }
    };

    const toggleDivision = (division) => {
        const currentDivisions = [...profileData.assignedDivisions];
        const index = currentDivisions.indexOf(division);
        
        if (index === -1) {
            currentDivisions.push(division);
        } else {
            currentDivisions.splice(index, 1);
        }
        
        setProfileData({ ...profileData, assignedDivisions: currentDivisions });
    };

    const toggleNotificationSetting = (setting) => {
        setNotificationSettings({
            ...notificationSettings,
            [setting]: !notificationSettings[setting]
        });
    };

    const saveProfile = () => {
        showToast('Profile settings saved successfully!', 'success');
    };

    const changePassword = () => {
        showToast('Password changed successfully!', 'success');
    };

    return (
        <>
            <div className="page-title">
                <i className="fas fa-cog"></i>
                <h2>Settings</h2>
            </div>

            <div className="settings-container">
                {/* Profile Settings */}
                <div className="settings-section">
                    <div className="settings-header">
                        <i className="fas fa-user-circle"></i>
                        <h3>Profile Settings</h3>
                    </div>

                    <div className="profile-picture">
                        <img src="https://via.placeholder.com/100" alt="Profile" />
                        <div className="profile-picture-actions">
                            <button className="btn btn-primary" onClick={() => showToast('Photo upload feature coming soon')}>
                                <i className="fas fa-upload"></i> Upload Photo
                            </button>
                            <button className="btn btn-secondary" onClick={() => showToast('Photo removed')}>
                                <i className="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            className="form-control"
                            value={profileData.fullName}
                            onChange={(e) => handleProfileChange('fullName', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            value={profileData.email}
                            onChange={(e) => handleProfileChange('email', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            type="text"
                            className="form-control"
                            value={profileData.phone}
                            onChange={(e) => handleProfileChange('phone', e.target.value)}
                        />
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                            <label>District</label>
                            <input
                                type="text"
                                className="form-control"
                                value={profileData.district}
                                disabled
                                style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                            />
                            <small style={{ color: '#6c757d' }}>District is fixed to your assigned region.</small>
                        </div>
                        <div className="form-group">
                            <label>Business Area</label>
                            <select
                                className="form-control"
                                value={profileData.businessArea}
                                onChange={(e) => handleProfileChange('businessArea', e.target.value)}
                            >
                                {Object.keys(hierarchyData).map(area => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Assigned Instructor Divisions</label>
                        <div className="divisions-selector" style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '10px', 
                            marginTop: '5px',
                            padding: '15px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            backgroundColor: '#fff'
                        }}>
                            {hierarchyData[profileData.businessArea].map(division => (
                                <div 
                                    key={division}
                                    className={`division-chip ${profileData.assignedDivisions.includes(division) ? 'active' : ''}`}
                                    onClick={() => toggleDivision(division)}
                                    style={{
                                        padding: '8px 15px',
                                        borderRadius: '20px',
                                        border: '1px solid',
                                        borderColor: profileData.assignedDivisions.includes(division) ? 'var(--primary)' : '#ddd',
                                        backgroundColor: profileData.assignedDivisions.includes(division) ? '#e8f5e9' : '#f5f5f5',
                                        color: profileData.assignedDivisions.includes(division) ? 'var(--primary)' : '#666',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    <i className={`fas ${profileData.assignedDivisions.includes(division) ? 'fa-check-circle' : 'fa-circle'}`}></i>
                                    {division}
                                </div>
                            ))}
                        </div>
                        <small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
                            Select all divisions you are responsible for in the {profileData.businessArea}.
                        </small>
                    </div>

                    <button className="btn btn-primary" onClick={saveProfile}>
                        <i className="fas fa-save"></i> Save Changes
                    </button>
                </div>

                {/* Professional Details (New attractive section) */}
                <div className="settings-section">
                    <div className="settings-header">
                        <i className="fas fa-briefcase"></i>
                        <h3>Professional Details</h3>
                    </div>

                    <div className="form-group">
                        <label>Specialization</label>
                        <input
                            type="text"
                            className="form-control"
                            value={profileData.specialization}
                            onChange={(e) => handleProfileChange('specialization', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Experience (Years)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={profileData.experience}
                            onChange={(e) => handleProfileChange("experience", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Qualifications</label>
                        <textarea
                            className="form-control"
                            rows="2"
                            value={profileData.qualifications}
                            onChange={(e) => handleProfileChange("qualifications", e.target.value)}
                        ></textarea>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="settings-section">
                    <div className="settings-header">
                        <i className="fas fa-bell"></i>
                        <h3>Notifications</h3>
                    </div>

                    {Object.entries(notificationSettings).map(([key, value]) => (
                        <div className="toggle-label" key={key}>
                            <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={() => toggleNotificationSetting(key)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    ))}

                    <button className="btn btn-primary" onClick={() => showToast('Notification preferences saved!', 'success')}>
                        Save Preferences
                    </button>
                </div>

                {/* Security Settings */}
                <div className="settings-section">
                    <div className="settings-header">
                        <i className="fas fa-shield-alt"></i>
                        <h3>Security</h3>
                    </div>
                    <div className="form-group">
                        <label>New Password</label>
                        <input type="password" className="form-control" placeholder="Leave blank to keep current" />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input type="password" className="form-control" placeholder="Confirm new password" />
                    </div>
                    <button className="btn btn-secondary" onClick={changePassword}>
                        <i className="fas fa-key"></i> Change Password
                    </button>
                </div>

                {/* Danger Zone */}
                <div className="settings-section">
                    <div className="settings-header">
                        <i className="fas fa-exclamation-triangle"></i>
                        <h3>Danger Zone</h3>
                    </div>

                    <p style={{ color: 'var(--gray)', marginBottom: '20px', textAlign: 'center' }}>
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <div className="settings-actions" style={{ display: 'flex', justifyContent: 'center' }}>
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
        </>
    );
};

export default InstructorSettings;
