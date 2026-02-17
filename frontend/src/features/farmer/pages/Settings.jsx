import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const Settings = () => {
    const { showToast } = useOutletContext();

    const [settings, setSettings] = useState({
        farmerId: '',
        district: 'Anuradhapura',
        zone: '', // Initialize zone field
        locations: [],
        fullName: '',
        email: '',
        phone: '',
        profilePicture: null
    });
    const [loading, setLoading] = useState(true);
    const [isUpdatingPicture, setIsUpdatingPicture] = useState(false);
    const [hierarchyData, setHierarchyData] = useState({});
    const [instructors, setInstructors] = useState([]);
    const fileInputRef = React.useRef(null);

    // Fetch farmer profile and other data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                // Fetch Profile, Hierarchy, and Instructors in parallel
                const [profileRes, hierarchyRes, instructorsRes] = await Promise.all([
                    fetch('/api/farmer/profile', { headers }),
                    fetch('/api/farmer/region-hierarchy', { headers }),
                    fetch('/api/farmer/instructors', { headers })
                ]);

                const [profileData, hierarchyData, instructorsData] = await Promise.all([
                    profileRes.json(),
                    hierarchyRes.json(),
                    instructorsRes.json()
                ]);

                if (profileData.success) {
                    const profile = profileData.data;
                    const locations = (profile.locations || []).map(loc => {
                        // If assignedInstructorRefId is missing, it might be an old record
                        // where assignedInstructorId was the reference ID
                        const refId = loc.assignedInstructorRefId || (typeof loc.assignedInstructorId === 'string' && loc.assignedInstructorId.startsWith('INST-') ? loc.assignedInstructorId : '');
                        const dbId = typeof loc.assignedInstructorId === 'number' ? loc.assignedInstructorId : (loc.assignedInstructorDbId || '');
                        
                        return {
                            ...loc,
                            assignedInstructorRefId: refId,
                            assignedInstructorId: dbId
                        };
                    });

                    setSettings({
                        farmerId: profile.id || '',
                        district: profile.district || 'Anuradhapura',
                        zone: profile.zone || 'Not set',
                        locations: locations,
                        fullName: profile.full_name || profile.name || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        profilePicture: profile.profile_picture || null
                    });
                }

                if (hierarchyData.success) {
                    setHierarchyData(hierarchyData.data);
                }

                if (instructorsData.success) {
                    setInstructors(instructorsData.data);
                }

            } catch (error) {
                console.error('Error fetching data:', error);
                showToast('Failed to load settings data', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showToast]);

    const handlePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUpdatingPicture(true);
        const formData = new FormData();
        formData.append('profile_picture', file);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/farmer/profile/picture', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Update local state
                setSettings(prev => ({
                    ...prev,
                    profilePicture: result.data.profile_picture
                }));
                
                // Update local storage user data
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    user.profile_picture = result.data.profile_picture;
                    user.avatar = result.data.profile_picture;
                    localStorage.setItem('user', JSON.stringify(user));
                    
                    // Notify layout
                    window.dispatchEvent(new Event('storage'));
                    window.dispatchEvent(new Event('user-updated'));
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

    // Handle profile picture removal
    const handlePictureRemove = async () => {
        if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

        setIsUpdatingPicture(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/farmer/profile/picture', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                // Update local state
                setSettings(prev => ({
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
                    window.dispatchEvent(new Event('user-updated'));
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

    const handleLocationChange = (index, field, value) => {
        const updatedLocations = [...settings.locations];
        const location = { ...updatedLocations[index] };

        if (field === 'zone') {
            // Reset division when zone changes
            const divisions = hierarchyData[value] || [];
            const defaultDivision = divisions.length > 0 ? divisions[0] : '';

            location.zone = value;
            location.instructorDivision = defaultDivision;
            
            // Find instructor for this division
            const instructor = instructors.find(inst => inst.division.startsWith(defaultDivision));
            location.assignedInstructorId = instructor ? instructor.dbId : 'Pending';
            location.assignedInstructorName = instructor ? instructor.name : 'No Instructor Assigned';
            location.assignedInstructorRefId = instructor ? instructor.id : '';
        } else if (field === 'instructorDivision') {
            location.instructorDivision = value;
            // Find instructor for this division
            const instructor = instructors.find(inst => inst.division.startsWith(value));
            location.assignedInstructorId = instructor ? instructor.dbId : 'Pending';
            location.assignedInstructorName = instructor ? instructor.name : 'No Instructor Assigned';
            location.assignedInstructorRefId = instructor ? instructor.id : '';
        }

        updatedLocations[index] = location;
        setSettings({ ...settings, locations: updatedLocations });
    };

    const addLocation = () => {
        const newLocation = {
            id: Date.now(),
            zone: '', // Let user select
            instructorDivision: '', // Let user select
            assignedInstructorId: '', // Let user select
            assignedInstructorName: 'Select Division First', // Let user select
            assignedInstructorRefId: ''
        };
        
        setSettings({
            ...settings,
            locations: [
                ...settings.locations,
                newLocation
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

    const saveProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/farmer/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_name: settings.fullName,
                    email: settings.email,
                    phone: settings.phone
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast('Profile updated successfully!');
            } else {
                showToast(data.error?.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('Failed to update profile', 'error');
        }
    };

    const saveLocationDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Determine primary instructor division from the first location if available
            const primaryDivision = settings.locations.length > 0 ? settings.locations[0].instructorDivision : '';
            const primaryZone = settings.locations.length > 0 ? settings.locations[0].zone : '';

            const res = await fetch('/api/farmer/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    locations: settings.locations,
                    instructor_division: primaryDivision,
                    zone: primaryZone
                })
            });
            console.log('🔍 [Settings] Data sent to server:', { 
                locations: settings.locations,
                instructor_division: primaryDivision,
                zone: primaryZone
            });

            const data = await res.json();
            console.log('🔍 [Settings] Server response:', data);
            if (res.ok && data.success) {
                showToast('Location & Land Details saved successfully!');
                console.log('✅ Locations saved:', settings.locations);
            } else {
                showToast(data.error?.message || 'Failed to save locations', 'error');
            }
        } catch (error) {
            console.error('Error saving locations:', error);
            showToast('Failed to save locations', 'error');
        }
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
                        <div className="profile-image-container" style={{
                            backgroundImage: settings.profilePicture ? `url(${settings.profilePicture.startsWith('http') ? settings.profilePicture : `/${settings.profilePicture}`})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundColor: settings.profilePicture ? 'transparent' : 'var(--primary)',
                            position: 'relative'
                        }}>
                            {!settings.profilePicture && (
                                <div className="profile-avatar">
                                    {settings.fullName ? settings.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'F'}
                                </div>
                            )}
                            {isUpdatingPicture && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%'
                                }}>
                                    <i className="fas fa-spinner fa-spin text-white"></i>
                                </div>
                            )}
                        </div>
                        <div className="profile-picture-actions">
                            <button 
                                className="btn btn-primary" 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUpdatingPicture}
                            >
                                <i className={`fas ${isUpdatingPicture ? 'fa-spinner fa-spin' : 'fa-upload'}`}></i>
                                {isUpdatingPicture ? ' Uploading...' : ' Upload New Photo'}
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handlePictureUpload}
                                style={{ display: 'none' }} 
                                accept="image/*" 
                            />
                            <button 
                                className="btn btn-secondary" 
                                onClick={handlePictureRemove}
                                disabled={isUpdatingPicture || !settings.profilePicture}
                            >
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
                                        <label style={{ fontSize: '0.9rem' }}>Zone</label>
                                        <select
                                            className="form-control"
                                            value={location.zone}
                                            onChange={(e) => handleLocationChange(index, 'zone', e.target.value)}
                                        >
                                            <option value="">Select Zone</option>
                                            {Object.keys(hierarchyData).map(zoneName => (
                                                <option key={zoneName} value={zoneName}>
                                                    {zoneName}
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
                                            disabled={!location.zone}
                                        >
                                            <option value="">Select Division</option>
                                            {(hierarchyData[location.zone] || []).map(division => (
                                                <option key={division} value={division}>
                                                    {division}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.9rem' }}>Assigned Instructor</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={location.assignedInstructorRefId ? `${location.assignedInstructorName} (${location.assignedInstructorRefId})` : location.assignedInstructorName}
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
                        <button
                            className="btn btn-primary"
                            onClick={saveLocationDetails}
                            style={{ width: '100%', marginTop: '10px' }}
                        >
                            <i className="fas fa-save"></i> Save Location Details
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
