import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';

const InstructorSettings = () => {
    const { openModal, showToast } = useOutletContext();
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingPicture, setIsUpdatingPicture] = useState(false);
    const [isSavingProfessional, setIsSavingProfessional] = useState(false);
    const fileInputRef = useRef(null);

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Helper to format zone names (remove "Zone" suffix if present)
    const formatZoneName = (name) => {
        if (!name) return '-';
        // More robust removal: handle trailing spaces and case-insensitive "Zone"
        return name.toString().replace(/\s+Zone\s*$/i, '').trim();
    };

    const [hierarchyData, setHierarchyData] = useState({});

    // We need local state for settings since this page manages profile/settings editing locally
    const [profileData, setProfileData] = useState({
        fullName: '',
        email: '',
        phone: '',
        district: 'Anuradhapura',
        zone: '',
        assignedDivisions: [],
        takenDivisions: [],
        specialization: '',
        experience: 0,
        qualifications: '',
        profilePicture: ''
    });

    const fetchHierarchy = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/instructor/region-hierarchy', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setHierarchyData(result.data);
            }
        } catch (error) {
            console.error('Error fetching hierarchy:', error);
        }
    }, []);

    const fetchProfile = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/instructor/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                const user = result.data;
                const details = user.instructorDetail || {};
                setProfileData({
                    fullName: user.full_name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    district: details.district || 'Anuradhapura',
                    zone: details.zone || '',
                    assignedDivisions: Array.isArray(details.assigned_divisions) 
                        ? details.assigned_divisions 
                        : (typeof details.assigned_divisions === 'string' 
                            ? JSON.parse(details.assigned_divisions || '[]') 
                            : []),
                    takenDivisions: details.takenDivisions || [],
                    specialization: details.specialization || '',
                    experience: details.experience || 0,
                    qualifications: details.qualifications || '',
                    profilePicture: user.profile_picture || ''
                });
            } else {
                showToast(result.error?.message || 'Failed to fetch profile', 'error');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            showToast('An error occurred while fetching profile', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchHierarchy();
        fetchProfile();
    }, [fetchHierarchy, fetchProfile]);

    const fetchTakenDivisions = async (zone) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/instructor/taken-divisions?zone=${encodeURIComponent(zone)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setProfileData(prev => ({ ...prev, takenDivisions: result.data }));
            }
        } catch (error) {
            console.error('Error fetching taken divisions:', error);
        }
    };

    const handleProfileChange = (field, value) => {
        if (field === 'zone') {
            setProfileData({ 
                ...profileData, 
                [field]: value,
                assignedDivisions: [], // Reset divisions when area changes
                takenDivisions: [] // Temporarily clear while fetching
            });
            fetchTakenDivisions(value);
        } else {
            setProfileData({ ...profileData, [field]: value });
        }
    };

    // Handle profile picture upload
    const handlePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUpdatingPicture(true);
        const formData = new FormData();
        formData.append('profile_picture', file);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/instructor/profile/picture', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Update local state
                setProfileData(prev => ({
                    ...prev,
                    profilePicture: result.data.profile_picture
                }));
                
                // Update local storage user data to reflect change immediately in layout
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    user.profile_picture = result.data.profile_picture;
                    user.avatar = result.data.profile_picture;
                    localStorage.setItem('user', JSON.stringify(user));
                    
                    // Force a reload or dispatch an event if needed, 
                    // but usually layout will pick up on next mount or if we had a context.
                    // Ideally we should use a context for user data.
                    window.dispatchEvent(new Event('storage'));
                }

                showToast('Profile picture updated successfully', 'success');
            } else {
                showToast(result.error?.message || 'Failed to update profile picture', 'error');
            }
        } catch (error) {
            console.error('Error updating profile picture:', error);
            showToast('An error occurred while updating profile picture', 'error');
        } finally {
            setIsUpdatingPicture(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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

    const saveProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/instructor/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_name: profileData.fullName,
                    email: profileData.email,
                    phone: profileData.phone,
                    district: profileData.district,
                    zone: profileData.zone,
                    assigned_divisions: profileData.assignedDivisions,
                    specialization: profileData.specialization,
                    experience: profileData.experience,
                    qualifications: profileData.qualifications
                })
            });
            const result = await response.json();
            if (result.success) {
                // Update localStorage with new profile info
                try {
                    const userStr = localStorage.getItem('user');
                    const user = userStr ? JSON.parse(userStr) : {};
                    user.full_name = profileData.fullName;
                    user.email = profileData.email;
                    user.phone = profileData.phone;
                    localStorage.setItem('user', JSON.stringify(user));
                } catch (error) {
                    console.error('Error updating user profile in localStorage:', error);
                }
                
                // Notify layout
                window.dispatchEvent(new Event('userProfileUpdated'));
                
                showToast('Profile settings saved successfully!', 'success');
            } else {
                showToast(result.error?.message || 'Failed to save profile', 'error');
            }
        } catch (error) { 
            console.error('Error saving profile:', error);
            showToast('An error occurred while saving profile', 'error');
        }
    };

    const saveProfessionalDetails = async () => {
        setIsSavingProfessional(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/instructor/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    specialization: profileData.specialization,
                    experience: profileData.experience,
                    qualifications: profileData.qualifications
                })
            });
            const result = await response.json();
            if (result.success) {
                showToast('Professional details saved successfully!', 'success');
            } else {
                showToast(result.error?.message || 'Failed to save professional details', 'error');
            }
        } catch (error) {
            console.error('Error saving professional details:', error);
            showToast('An error occurred while saving professional details', 'error');
        } finally {
            setIsSavingProfessional(false);
        }
    };

    const changePassword = async () => {
        if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
            showToast('Please fill in all password fields', 'error');
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/instructor/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword
                })
            });
            const result = await response.json();
            if (result.success) {
                showToast('Password changed successfully!', 'success');
                setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                showToast(result.error?.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showToast('An error occurred while changing password', 'error');
        }
    };

    // Handle profile picture removal
    const handlePictureRemove = async () => {
        if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

        setIsUpdatingPicture(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/instructor/profile/picture', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                // Update local state
                setProfileData(prev => ({
                    ...prev,
                    profilePicture: null
                }));
                
                // Update local storage user data
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    user.profile_picture = null;
                    user.avatar = null;
                    localStorage.setItem('user', JSON.stringify(user));
                    
                    // Notify layout
                    window.dispatchEvent(new Event('storage'));
                }

                showToast('Profile picture removed successfully', 'success');
            } else {
                showToast(result.error?.message || 'Failed to remove profile picture', 'error');
            }
        } catch (error) {
            console.error('Error removing profile picture:', error);
            showToast('An error occurred while removing profile picture', 'error');
        } finally {
            setIsUpdatingPicture(false);
        }
    };

    if (isLoading) {
        return <div className="loading-container">Loading settings...</div>;
    }

    return (
        <>
            <div className="settings-container">
                {/* Profile Settings */}
                <div className="settings-section">
                    <div className="settings-header">
                        <i className="fas fa-user-circle"></i>
                        <h3>Profile Settings</h3>
                    </div>

                    <div className="profile-picture">
                        <img src={profileData.profilePicture ? (profileData.profilePicture.startsWith('http') ? profileData.profilePicture : `/${profileData.profilePicture}`) : "https://via.placeholder.com/100"} alt="Profile" 
                             style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%'}}
                        />
                        <div className="profile-picture-actions">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                onChange={handlePictureUpload}
                                accept="image/*"
                            />
                            <button 
                                className="btn btn-primary" 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUpdatingPicture}
                            >
                                <i className={`fas ${isUpdatingPicture ? 'fa-spinner fa-spin' : 'fa-upload'}`}></i> 
                                {isUpdatingPicture ? ' Uploading...' : ' Upload Photo'}
                            </button>
                            <button 
                                className="btn btn-secondary" 
                                onClick={handlePictureRemove}
                                disabled={isUpdatingPicture || !profileData.profilePicture}
                            >
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
                            <label>Zone</label>
                            <select 
                                value={profileData.zone}
                                onChange={(e) => handleProfileChange('zone', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    backgroundColor: '#fff'
                                }}
                            >
                                <option value="" disabled>Select Zone</option>
                                {Object.keys(hierarchyData).map(zone => (
                                    <option key={zone} value={zone}>{zone}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Assigned Instructor Divisions</label>
                        <div className="divisions-grid" style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '10px', 
                            padding: '15px', 
                            borderRadius: '8px', 
                            border: '1px solid #eee', 
                            backgroundColor: '#fff',
                            minHeight: '50px'
                        }}>
                            {profileData.zone && hierarchyData[profileData.zone] ? (
                                hierarchyData[profileData.zone].map(division => {
                                    const isTaken = profileData.takenDivisions.includes(division);
                                    const isActive = profileData.assignedDivisions.includes(division);
                                    
                                    return (
                                        <div 
                                            key={division}
                                            className={`division-chip ${isActive ? 'active' : ''} ${isTaken ? 'taken' : ''}`}
                                            onClick={() => !isTaken && toggleDivision(division)}
                                            style={{
                                                padding: '8px 15px',
                                                borderRadius: '20px',
                                                border: '1px solid',
                                                borderColor: isActive ? 'var(--primary)' : (isTaken ? '#eee' : '#ddd'),
                                                backgroundColor: isActive ? '#e8f5e9' : (isTaken ? '#fafafa' : '#f5f5f5'),
                                                color: isActive ? 'var(--primary)' : (isTaken ? '#ccc' : '#666'),
                                                cursor: isTaken ? 'not-allowed' : 'pointer',
                                                fontSize: '0.9rem',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                opacity: isTaken ? 0.7 : 1
                                            }}
                                            title={isTaken ? 'This division is already assigned to another instructor' : ''}
                                        >
                                            <i className={`fas ${isActive ? 'fa-check-circle' : (isTaken ? 'fa-lock' : 'fa-circle')}`}></i>
                                            {division}
                                        </div>
                                    );
                                })
                            ) : (
                                <p style={{ color: '#6c757d', fontSize: '0.9rem', margin: 0 }}>
                                    {profileData.zone ? 'No divisions found for this zone' : 'Please select a zone first'}
                                </p>
                            )}
                        </div>
                        <small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
                            Select all divisions you are responsible for in the {profileData.zone}.
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
                            rows="4"
                            value={profileData.qualifications}
                            onChange={(e) => handleProfileChange("qualifications", e.target.value)}
                        ></textarea>
                    </div>

                    <button 
                        className="btn btn-primary" 
                        onClick={saveProfessionalDetails}
                        disabled={isSavingProfessional}
                    >
                        <i className={`fas ${isSavingProfessional ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> 
                        {isSavingProfessional ? ' Saving...' : ' Save Professional Details'}
                    </button>
                </div>

                {/* Security Settings */}
                <div className="settings-section">
                    <div className="settings-header">
                        <i className="fas fa-shield-alt"></i>
                        <h3>Security</h3>
                    </div>
                    <div className="form-group">
                        <label>Current Password</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            placeholder="Enter current password" 
                            value={passwords.currentPassword}
                            onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>New Password</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            placeholder="Leave blank to keep current" 
                            value={passwords.newPassword}
                            onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            placeholder="Confirm new password" 
                            value={passwords.confirmPassword}
                            onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                        />
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
