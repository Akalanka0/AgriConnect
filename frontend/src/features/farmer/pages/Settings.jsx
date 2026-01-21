import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const Settings = () => {
    const { showToast } = useOutletContext();
    const [settings, setSettings] = useState({
        fullName: 'Sunil Perera',
        email: 'sunil.perera@example.com',
        phone: '+94 77 123 4567',
        locationResident: 'Anuradhapura',
        locationFarm: 'Location: Nochchiyagama/ Farm Area: 2.0 ha/ Crop: Paddy',
        emailNotifications: true,
        messageNotifications: true,
        weatherAlerts: true,
        pestAlerts: true
    });

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
                    <div className="form-group">
                        <label htmlFor="locationResident">Location (Resident)</label>
                        <input
                            type="text"
                            id="locationResident"
                            className="form-control"
                            value={settings.locationResident}
                            onChange={(e) => setSettings({ ...settings, locationResident: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="locationFarm">Farm & Land Details</label>
                        <input
                            type="text"
                            id="locationFarm"
                            className="form-control"
                            value={settings.locationFarm}
                            onChange={(e) => setSettings({ ...settings, locationFarm: e.target.value })}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={saveProfile}>
                        <i className="fas fa-save"></i> Update Profile
                    </button>
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
                        { id: 'emailNotifications', label: 'Email Notifications' },
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
