import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/AdminDash.css';

// Portal Component for Absolute Isolation
const ModalPortal = ({ children }) => {
    return ReactDOM.createPortal(children, document.body);
};

const Settings = () => {
    // API Base
    const API_BASE = '/api/admin';

    // State for Profile Settings
    const [profile, setProfile] = useState({
        name: 'Super Admin',
        email: 'admin@agriconnect.lk',
        role: 'Super Admin',
        avatar: null
    });

    // State for Password Change
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // State for System Config (Super Admin Only)
    const [systemConfig, setSystemConfig] = useState({
        maintenanceMode: false,
        allowRegistration: true,
        debugMode: false,
        emailNotifications: true
    });

    // State for Admin Management (Super Admin Only)
    const [admins, setAdmins] = useState([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '' });
    const fileInputRef = useRef(null);

    // Context and State
    const { showToast } = useToast();
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [isAddingAdmin, setIsAddingAdmin] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        id: null,
        name: ''
    });

    // Fetch Admins
    const fetchAdmins = async () => {
        setLoadingAdmins(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/users?role=admin`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                // Map backend data to frontend format
                const mappedAdmins = data.data.map(admin => ({
                    id: admin.id,
                    name: admin.full_name,
                    email: admin.email,
                    role: admin.email === 'admin@agriconnect.lk' ? 'Super Admin' : (admin.role === 'admin' ? 'Admin' : admin.role),
                    status: admin.status.charAt(0).toUpperCase() + admin.status.slice(1),
                    lastActive: 'Recently' // Placeholder for last active
                }));
                setAdmins(mappedAdmins);
            } else {
                showToast(data.error?.message || 'Failed to fetch admins', 'error');
            }
        } catch (error) {
            console.error('Error fetching admins:', error);
            showToast('Failed to connect to server', 'error');
        } finally {
            setLoadingAdmins(false);
        }
    };

    // Fetch System Settings
    const fetchSystemSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setSystemConfig(prev => ({
                    ...prev,
                    ...data.data
                }));
            }
        } catch (error) {
            console.error('Error fetching system settings:', error);
        }
    };

    useEffect(() => {
        // Load real user data from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                setProfile({
                    name: user.full_name || 'Admin User',
                    email: user.email || 'admin@agriconnect.lk',
                    role: user.role === 'admin' ? 'Super Admin' : user.role,
                    avatar: user.avatar || null
                });
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        fetchAdmins();
        fetchSystemSettings();
    }, []);

    // Handlers
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        
        if (!selectedFile) {
            showToast('No changes to save', 'info');
            return;
        }

        setIsUpdatingProfile(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('avatar', selectedFile);

            const response = await fetch(`${API_BASE}/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                showToast('Profile photo updated successfully!', 'success');
                
                // Update local storage user data
                const userData = JSON.parse(localStorage.getItem('user'));
                userData.avatar = data.data.avatar;
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Update state
                setProfile(prev => ({ ...prev, avatar: data.data.avatar }));
                setSelectedFile(null);

                // Notify layout
                window.dispatchEvent(new Event('storage'));
                window.dispatchEvent(new Event('user-updated'));
            } else {
                showToast(data.error?.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('Network error while updating profile', 'error');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            showToast('New passwords do not match!', 'error');
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.current,
                    newPassword: passwordData.new
                })
            });

            const data = await response.json();

            if (data.success) {
                showToast('Password updated successfully!', 'success');
                setPasswordData({ current: '', new: '', confirm: '' });
            } else {
                showToast(data.error?.message || 'Failed to update password', 'error');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            showToast('Network error while updating password', 'error');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleSystemToggle = async (key) => {
        const newValue = !systemConfig[key];
        
        // Update local state first for responsiveness
        setSystemConfig(prev => ({ ...prev, [key]: newValue }));

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/settings/${key}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ value: newValue })
            });

            const data = await response.json();
            if (data.success) {
                showToast(`${key} setting updated!`, 'info');
            } else {
                // Revert state if backend update fails
                setSystemConfig(prev => ({ ...prev, [key]: !newValue }));
                showToast(data.error?.message || `Failed to update ${key}`, 'error');
            }
        } catch (error) {
            console.error(`Error updating ${key}:`, error);
            // Revert state on error
            setSystemConfig(prev => ({ ...prev, [key]: !newValue }));
            showToast('Network error while updating setting', 'error');
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        
        if (!newAdmin.name || !newAdmin.email) {
            showToast('Please fill in all fields', 'warning');
            return;
        }

        setIsAddingAdmin(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: newAdmin.name,
                    email: newAdmin.email
                })
            });

            const data = await response.json();

            if (data.success) {
                showToast(`Invitation sent to ${newAdmin.email}!`, 'success');
                setIsAddAdminModalOpen(false);
                setNewAdmin({ name: '', email: '' });
                fetchAdmins(); // Refresh the list
            } else {
                showToast(data.error?.message || 'Failed to send invitation', 'error');
            }
        } catch (error) {
            console.error('Error inviting admin:', error);
            showToast('Network error while sending invitation', 'error');
        } finally {
            setIsAddingAdmin(false);
        }
    };

    const handleDeleteAdmin = (id, name) => {
        setConfirmConfig({
            isOpen: true,
            id,
            name
        });
    };

    const confirmDeleteAdmin = async () => {
        const id = confirmConfig.id;
        setAdmins(admins.filter(admin => admin.id !== id));
        showToast(`${confirmConfig.name} has been removed.`, 'success');
        setConfirmConfig({ isOpen: false, id: null, name: '' });
    };

    const handlePhotoClick = () => {
        fileInputRef.current.click();
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast('File size exceeds 2MB limit', 'warning');
                return;
            }
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                showToast('Only JPG and PNG files are allowed', 'warning');
                return;
            }

            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = async () => {
        if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/profile/picture`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                showToast('Profile picture removed successfully', 'success');

                // Update local storage
                const userData = JSON.parse(localStorage.getItem('user'));
                userData.avatar = null;
                localStorage.setItem('user', JSON.stringify(userData));

                // Update state
                setProfile(prev => ({ ...prev, avatar: null }));
                setSelectedFile(null);

                // Notify layout
                window.dispatchEvent(new Event('storage'));
                window.dispatchEvent(new Event('user-updated'));
            } else {
                showToast(data.error?.message || 'Failed to remove profile picture', 'error');
            }
        } catch (error) {
            console.error('Error removing profile picture:', error);
            showToast('Network error while removing profile picture', 'error');
        }
    };

    return (
        <div className="page active" id="settings">
            <div className="page-title">
                <i className="fas fa-cog"></i>
                <h2>Settings</h2>
            </div>

            <div className="dashboard-grid two-columns">

                {/* 1. Profile Settings */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">My Profile</div>
                        <div className="card-icon"><i className="fas fa-user-circle"></i></div>
                    </div>
                    <div className="card-content">
                        <form onSubmit={handleProfileUpdate}>
                            <div className="profile-header">
                                <div className="profile-avatar-large" style={{
                                    backgroundImage: profile.avatar ? `url(${profile.avatar})` : 'none',
                                    backgroundColor: profile.avatar ? 'transparent' : 'var(--primary)'
                                }}>
                                    {!profile.avatar && profile.name.charAt(0)}
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/jpeg, image/png"
                                        onChange={handlePhotoChange}
                                    />
                                    <div className="profile-actions">
                                        <button type="button" className="btn btn-outline btn-sm" onClick={handlePhotoClick}>
                                            <i className="fas fa-camera"></i> Change
                                        </button>
                                        {profile.avatar && (
                                            <button type="button" className="btn btn-outline btn-sm btn-danger-outline" onClick={handleRemovePhoto}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                    <div className="profile-hint">Allowed: JPG, PNG (Max 2MB)</div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    className="form-control input-disabled"
                                    value={profile.name}
                                    disabled
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    className="form-control input-disabled"
                                    value={profile.email}
                                    disabled
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={isUpdatingProfile}>
                                {isUpdatingProfile ? <><i className="fas fa-spinner fa-spin"></i> Updating...</> : 'Update Profile'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* 2. Security Settings */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Security</div>
                        <div className="card-icon"><i className="fas fa-lock"></i></div>
                    </div>
                    <div className="card-content">
                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={passwordData.current}
                                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={passwordData.new}
                                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={passwordData.confirm}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={isUpdatingPassword}>
                                {isUpdatingPassword ? <><i className="fas fa-spinner fa-spin"></i> Updating...</> : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* 3. Admin Management (Super Admin Only) */}
            {profile.role === 'Super Admin' && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <div className="card-header">
                        <div className="card-title">Admin Team Management</div>
                        <button className="btn btn-sm btn-primary" onClick={() => setIsAddAdminModalOpen(true)}>
                            <i className="fas fa-plus"></i> Add New Admin
                        </button>
                    </div>
                    <div className="card-content">
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Last Active</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admins.map(admin => (
                                        <tr key={admin.id}>
                                            <td style={{ fontWeight: '500' }}>{admin.name}</td>
                                            <td>{admin.email}</td>
                                            <td>
                                                <span className={`user-role ${admin.role === 'Super Admin' ? 'role-admin' : 'role-instructor'}`}>
                                                    {admin.role}
                                                </span>
                                            </td>
                                            <td><StatusBadge status={admin.status} /></td>
                                            <td>{admin.lastActive}</td>
                                            <td>
                                                {admin.role !== 'Super Admin' && admin.role !== 'admin' && (
                                                    <button
                                                        className="btn btn-sm btn-danger btn-icon-only"
                                                        onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. System Configuration (Super Admin Only) */}
            {profile.role === 'Super Admin' && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <div className="card-header">
                        <div className="card-title">System Configuration</div>
                        <div className="card-icon"><i className="fas fa-cogs"></i></div>
                    </div>
                    <div className="card-content">
                        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 0 }}>
                            <div className="status-item">
                                <div className="status-info">
                                    <span className="status-label">Maintenance Mode</span>
                                    <span className="status-value">{systemConfig.maintenanceMode ? 'Enabled' : 'Disabled'}</span>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={systemConfig.maintenanceMode}
                                        onChange={() => handleSystemToggle('maintenanceMode')}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Admin Modal */}
            {isAddAdminModalOpen && (
                <ModalPortal>
                    <div className="admin-modal active">
                        <div className="admin-modal-content" style={{ width: '450px' }}>
                            <div className="admin-modal-header">
                                <div className="admin-modal-title">Add New Admin</div>
                                <button className="admin-modal-close-round" onClick={() => setIsAddAdminModalOpen(false)}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <form onSubmit={handleAddAdmin}>
                                <div className="admin-modal-body">
                                    <div className="admin-form-group">
                                        <label>Name</label>
                                        <input
                                            type="text"
                                            className="admin-form-control"
                                            required
                                            value={newAdmin.name}
                                            onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="admin-form-group">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            className="admin-form-control"
                                            required
                                            value={newAdmin.email}
                                            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="admin-modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setIsAddAdminModalOpen(false)}
                                        disabled={isAddingAdmin}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-send"
                                        disabled={isAddingAdmin}
                                    >
                                        {isAddingAdmin ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i> Sending...
                                            </>
                                        ) : (
                                            'Send Invitation'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                onConfirm={confirmDeleteAdmin}
                title="Remove Admin"
                message={`Are you sure you want to remove ${confirmConfig.name}? They will no longer have administrative access.`}
                confirmText="Remove Admin"
                type="danger"
            />
        </div>
    );
};

export default Settings;
