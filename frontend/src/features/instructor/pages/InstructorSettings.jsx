import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const InstructorSettings = () => {
    const { openModal, showToast } = useOutletContext();

    // We need local state for settings since this page manages profile/settings editing locally
    const [profileData, setProfileData] = useState({
        fullName: 'Rohan Silva',
        email: 'rohan.silva@agriconnect.lk',
        phone: '+94 77 123 4567',
        location: 'Central Province, Sri Lanka',
        bio: 'Agricultural instructor with 8 years of experience specializing in sustainable farming practices and crop management.',
        specialization: 'Sustainable Agriculture, Crop Management',
        experience: 8,
        qualifications: 'B.Sc. in Agriculture, Certified Crop Advisor, Sustainable Farming Certification'
    });

    const [notificationSettings, setNotificationSettings] = useState({
        pestReports: true,
        meetingRequests: true,
        feedbackReceived: true,
        cropPlanReviews: true,
        systemUpdates: false,
        emailNotifications: true,
        smsNotifications: false
    });

    const handleProfileChange = (field, value) => {
        setProfileData({ ...profileData, [field]: value });
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
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Profile Settings</div>
                        <div className="card-icon"><i className="fas fa-user"></i></div>
                    </div>
                    <div className="card-content" style={{ padding: '20px' }}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={profileData.fullName}
                                onChange={(e) => handleProfileChange('fullName', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={profileData.email}
                                onChange={(e) => handleProfileChange('email', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="text"
                                value={profileData.phone}
                                onChange={(e) => handleProfileChange('phone', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Bio</label>
                            <textarea
                                rows="3"
                                value={profileData.bio}
                                onChange={(e) => handleProfileChange('bio', e.target.value)}
                            ></textarea>
                        </div>

                        <button className="btn btn-primary" onClick={saveProfile}>Save Changes</button>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="card" style={{ marginTop: '20px' }}>
                    <div className="card-header">
                        <div className="card-title">Notifications</div>
                        <div className="card-icon"><i className="fas fa-bell"></i></div>
                    </div>
                    <div className="card-content" style={{ padding: '20px' }}>
                        {Object.entries(notificationSettings).map(([key, value]) => (
                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={() => toggleNotificationSetting(key)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Security Settings */}
                <div className="card" style={{ marginTop: '20px' }}>
                    <div className="card-header">
                        <div className="card-title">Security</div>
                        <div className="card-icon"><i className="fas fa-lock"></i></div>
                    </div>
                    <div className="card-content" style={{ padding: '20px' }}>
                        <div className="form-group">
                            <label>New Password</label>
                            <input type="password" placeholder="Leave blank to keep current" />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input type="password" placeholder="Confirm new password" />
                        </div>
                        <button className="btn btn-secondary" onClick={changePassword}>Change Password</button>
                    </div>
                </div>

                {/* Support */}
                <div className="card" style={{ marginTop: '20px', cursor: 'pointer' }} onClick={() => openModal('feedback')}>
                    <div className="card-content" style={{ padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <i className="fas fa-comment-dots" style={{ fontSize: '1.2em' }}></i>
                        <span>Send Feedback & Support</span>
                    </div>
                </div>

            </div>
        </>
    );
};

export default InstructorSettings;
