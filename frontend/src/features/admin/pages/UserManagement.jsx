import React, { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import UserDetailsDrawer from '../components/UserDetailsDrawer';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/AdminDash.css';

const zoneOptions = [
    { id: 'BA-001', name: 'Nochchiyagama' },
    { id: 'BA-002', name: 'Thambuttegama' },
    { id: 'BA-003', name: 'Galenbindunuwewa' },
    { id: 'BA-004', name: 'Rajanganaya' },
    { id: 'BA-005', name: 'Vilachchiya' },
    { id: 'BA-006', name: 'Huruluwewa' }
];

const UserManagement = () => {
    // Helper to format zone names (remove "Zone" suffix if present)
    const formatZoneName = (name) => {
        if (!name) return '-';
        // More robust removal: handle trailing spaces and case-insensitive "Zone"
        return name.toString().replace(/\s+Zone\s*$/i, '').trim();
    };

    const [activeTab, setActiveTab] = useState('farmers');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [areaFilter, setAreaFilter] = useState('All');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

    // New state for local divisions
    const [localDivisions, setLocalDivisions] = useState([]);
    const [isAddDivisionModalOpen, setIsAddDivisionModalOpen] = useState(false);
    const [newDivision, setNewDivision] = useState({
        district: 'Anuradhapura',
        zone: zoneOptions[0].name,
        instructorDivision: '',
        status: 'Active'
    });

    // Toast and Confirm Modal State
    const { showToast } = useToast();
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger',
        loading: false
    });

    // Fetch Users Function
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                role: activeTab === 'farmers' ? 'farmer' : 'instructor',
                page: pagination.page,
                limit: pagination.limit,
                status: statusFilter
            });

            if (searchTerm) queryParams.append('search', searchTerm);

            const response = await fetch(`/api/admin/users?${queryParams}`);
            const result = await response.json();

            if (result.success) {
                // Transform data for DataTable
                const transformedUsers = result.data.map(user => {
                    const details = user.farmerDetail || user.instructorDetail || {};
                    return {
                        id: user.id, // Keep integer ID for API calls
                        displayId: details.farmer_id || details.instructor_id || `USER-${user.id}`, // Display ID
                        name: user.full_name,
                        email: user.email,
                        phone: user.phone,
                        district: details.district || '-',
                        location: formatZoneName(details.zone), // Map zone to project
                        instructorDivision: details.instructor_division || '-',
                        instructor: user.instructor, // Assigned Instructor Name
                        farmersCount: user.farmersCount, // Calculated Farmers Count
                        // For instructors
                        zone: formatZoneName(details.zone),
                        divisions: typeof details.assigned_divisions === 'string' 
                            ? JSON.parse(details.assigned_divisions || '[]') 
                            : (details.assigned_divisions || []),
                        status: user.status.charAt(0).toUpperCase() + user.status.slice(1), // Capitalize
                        joined: new Date(user.created_at).toISOString().split('T')[0]
                    };
                });
                setUsers(transformedUsers);
                setPagination(prev => ({ ...prev, total: result.pagination.total }));

        // Sync localDivisions with instructor divisions if it's the first fetch
        if (localDivisions.length === 0) {
            const initialDivs = transformedUsers
                .filter(u => u.divisions && u.divisions.length > 0)
                .flatMap(inst => inst.divisions.map(div => ({
                    id: `init-${inst.id}-${div}`,
                    district: inst.district,
                    zone: inst.zone,
                    instructorDivision: div,
                    status: 'Active'
                })));
            
            // Remove duplicates based on zone and instructorDivision
            const uniqueDivs = initialDivs.reduce((acc, current) => {
                const x = acc.find(item => 
                    item.zone === current.zone && 
                    item.instructorDivision === current.instructorDivision
                );
                if (!x) {
                    return acc.concat([current]);
                } else {
                    return acc;
                }
            }, []);

            setLocalDivisions(uniqueDivs);
        }
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            showToast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Initial Fetch & Refetch on Filters Change
    useEffect(() => {
        fetchUsers();
    }, [activeTab, statusFilter, pagination.page, searchTerm]);

    // Handle Status Change (Block/Unblock)
    const handleStatusChange = async (user, newStatus) => {
        try {
            const response = await fetch(`/api/admin/users/${user.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus.toLowerCase() })
            });
            const result = await response.json();

            if (result.success) {
                showToast(`User ${newStatus} successfully`, 'success');
                
                // Update local state immediately for real-time feel
                setUsers(prevUsers => {
                    // If current filter excludes the new status, remove the user
                    if (statusFilter !== 'all' && statusFilter !== newStatus.toLowerCase()) {
                        return prevUsers.filter(u => u.id !== user.id);
                    }
                    // Otherwise update the status in place
                    return prevUsers.map(u => 
                        u.id === user.id 
                            ? { ...u, status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1) } 
                            : u
                    );
                });

                // Update total count if user was removed from view
                if (statusFilter !== 'all' && statusFilter !== newStatus.toLowerCase()) {
                    setPagination(prev => ({ ...prev, total: prev.total - 1 }));
                }
            } else {
                showToast(result.error.message, 'error');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showToast('Failed to update status', 'error');
        }
    };

    // Filter Logic (Client-side filtering for Area/District if needed, but mostly Server-side now)
    const currentList = users;
    const areaKey = activeTab === 'farmers' ? 'location' : 'zone';

    const zones = ['All', ...Array.from(new Set(
        activeTab === 'divisions' 
            ? localDivisions.map(d => d.zone).filter(Boolean)
            : currentList.map(u => u[areaKey]).filter(Boolean)
    ))];

    // Helper to get flattened divisions if activeTab is 'divisions'
    const getFlattenedData = () => {
        if (activeTab !== 'divisions') return currentList;
        return localDivisions;
    };

    const currentData = getFlattenedData().filter(u => {
        const matchesArea = areaFilter === 'All' || (u.zone || u.location) === areaFilter;
        const matchesStatus = statusFilter === 'all' || (u.status || '').toLowerCase() === statusFilter.toLowerCase();
        const term = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm ||
            (u.name || '').toLowerCase().includes(term) ||
            (u.displayId || '').toLowerCase().includes(term) ||
            (u.phone || '').toLowerCase().includes(term) ||
            (u.email || '').toLowerCase().includes(term) ||
            (u.district || '').toLowerCase().includes(term) ||
            (u.location || '').toLowerCase().includes(term) ||
            (u.zone || '').toLowerCase().includes(term) ||
            (u.instructorDivision || '').toLowerCase().includes(term);
        return matchesArea && matchesSearch && matchesStatus;
    });

    // Table Columns
    const farmerColumns = [
        { header: 'ID', accessor: 'displayId', width: '140px' },
        { header: 'NAME', accessor: 'name' },
        { header: 'ZONE', accessor: 'location', render: (row) => formatZoneName(row.location) },
        { header: 'ASSIGNED INSTRUCTOR', accessor: 'instructor', render: (row) => row.instructor || 'Not Assigned' },
        {
            header: 'STATUS',
            accessor: 'status',
            render: (row) => <StatusBadge status={row.status} />
        },
        { header: 'JOINED DATE', accessor: 'joined' }
    ];

    const instructorColumns = [
        { header: 'ID', accessor: 'displayId', width: '140px' },
        { header: 'NAME', accessor: 'name' },
        { header: 'ZONE', accessor: 'zone', render: (row) => formatZoneName(row.zone) },
        { header: 'FARMERS COUNT', accessor: 'farmersCount', render: (row) => row.farmersCount || 0 },
        {
            header: 'STATUS',
            accessor: 'status',
            render: (row) => <StatusBadge status={row.status} />
        },
        { header: 'JOINED DATE', accessor: 'joined' }
    ];

    const divisionColumns = [
        { header: 'DISTRICT', accessor: 'district' },
        { header: 'ZONE', accessor: 'zone', render: (row) => formatZoneName(row.zone) },
        { header: 'INSTRUCTOR DIVISION', accessor: 'instructorDivision' }
    ];

    const deleteUser = async (userId) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                setUsers(prev => prev.filter(user => user.id !== userId));
                setPagination(prev => ({ ...prev, total: prev.total - 1 }));
                showToast('User deleted successfully', 'success');
            } else {
                showToast(result.error.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showToast('Failed to delete user', 'error');
        }
    };

    const handleAction = (action, user) => {
        if (action === 'view') {
            setSelectedUser(user);
            setIsDrawerOpen(true);
        } else if (action === 'delete') {
            setConfirmConfig({
                isOpen: true,
                title: activeTab === 'divisions' ? 'Delete Division' : 'Delete User',
                message: activeTab === 'divisions' 
                    ? `Are you sure you want to delete the division "${user.instructorDivision}"?` 
                    : `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
                confirmText: 'Delete',
                type: 'danger',
                onConfirm: async () => {
                    setConfirmConfig(prev => ({ ...prev, loading: true }));
                    if (activeTab === 'divisions') {
                        setLocalDivisions(prev => prev.filter(d => d.id !== user.id));
                        showToast('Division deleted successfully', 'success');
                    } else {
                        await deleteUser(user.id);
                    }
                    setConfirmConfig(prev => ({ ...prev, isOpen: false, loading: false }));
                }
            });
        } else if (action === 'block' || action === 'disable') {
            setConfirmConfig({
                isOpen: true,
                title: activeTab === 'divisions' ? 'Disable Division' : 'Block User',
                message: activeTab === 'divisions'
                    ? `Are you sure you want to disable "${user.instructorDivision}"?`
                    : `Are you sure you want to block ${user.name}? They will not be able to log in.`,
                confirmText: activeTab === 'divisions' ? 'Disable' : 'Block',
                type: 'warning',
                onConfirm: async () => {
                    setConfirmConfig(prev => ({ ...prev, loading: true }));
                    if (activeTab === 'divisions') {
                        setLocalDivisions(prev => prev.map(d => d.id === user.id ? { ...d, status: 'Blocked' } : d));
                        showToast('Division disabled successfully', 'warning');
                    } else {
                        await handleStatusChange(user, 'blocked');
                    }
                    setConfirmConfig(prev => ({ ...prev, isOpen: false, loading: false }));
                }
            });
        } else if (action === 'unblock' || action === 'enable') {
            setConfirmConfig({
                isOpen: true,
                title: activeTab === 'divisions' ? 'Enable Division' : 'Unblock User',
                message: activeTab === 'divisions'
                    ? `Are you sure you want to enable "${user.instructorDivision}"?`
                    : `Are you sure you want to unblock ${user.name}?`,
                confirmText: activeTab === 'divisions' ? 'Enable' : 'Unblock',
                type: 'success',
                onConfirm: async () => {
                    setConfirmConfig(prev => ({ ...prev, loading: true }));
                    if (activeTab === 'divisions') {
                        setLocalDivisions(prev => prev.map(d => d.id === user.id ? { ...d, status: 'Active' } : d));
                        showToast('Division enabled successfully', 'success');
                    } else {
                        await handleStatusChange(user, 'active');
                    }
                    setConfirmConfig(prev => ({ ...prev, isOpen: false, loading: false }));
                }
            });
        }
    };

    const actions = [
        { 
            name: 'view', 
            type: 'primary', 
            label: 'View',
            hidden: activeTab === 'divisions'
        },
        { name: 'delete', type: 'danger', label: 'Delete' },
        {
            name: (row) => row.status.toLowerCase() === 'blocked' ? (activeTab === 'divisions' ? 'enable' : 'unblock') : (activeTab === 'divisions' ? 'disable' : 'block'),
            type: (row) => row.status.toLowerCase() === 'blocked' ? 'warning' : 'secondary',
            label: (row) => row.status.toLowerCase() === 'blocked' ? (activeTab === 'divisions' ? 'Enable' : 'Unblock') : (activeTab === 'divisions' ? 'Disable' : 'Block')
        }
    ];

    // Filter actions for the specific tab
    const activeActions = actions.filter(action => !action.hidden);

    const handleAddDivision = (e) => {
        e.preventDefault();
        if (!newDivision.zone || !newDivision.instructorDivision) {
            showToast('Please fill in all fields', 'warning');
            return;
        }

        const newEntry = {
            ...newDivision,
            zone: formatZoneName(newDivision.zone),
            id: `new-${Date.now()}`
        };

        setLocalDivisions(prev => [newEntry, ...prev]);
        setIsAddDivisionModalOpen(false);
        setNewDivision({
            district: 'Anuradhapura',
            zone: zoneOptions[0].name,
            instructorDivision: '',
            status: 'Active'
        });
        showToast('Division added successfully', 'success');
    };

    return (
        <div className="page active" id="users">
            <div className="page-title">
                <i className="fas fa-users"></i>
                <h2>User Management</h2>
                {activeTab === 'divisions' && (
                    <button 
                        className="btn btn-primary" 
                        style={{ marginLeft: 'auto' }}
                        onClick={() => setIsAddDivisionModalOpen(true)}
                    >
                        <i className="fas fa-plus" style={{ marginRight: '8px' }}></i> Add Division
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <button
                    className={`tab-btn ${activeTab === 'farmers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('farmers')}
                >
                    Farmers
                </button>
                <button
                    className={`tab-btn ${activeTab === 'instructors' ? 'active' : ''}`}
                    onClick={() => setActiveTab('instructors')}
                >
                    Instructors
                </button>
                <button
                    className={`tab-btn ${activeTab === 'divisions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('divisions')}
                >
                    Divisions
                </button>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        className="filter-input"
                        placeholder="Search by name, ID, zone, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        className="filter-input"
                        value={areaFilter}
                        onChange={(e) => setAreaFilter(e.target.value)}
                    >
                        {zones.map(area => (
                            <option key={area} value={area}>{area === 'All' ? 'All Zones' : area}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <select
                        className="filter-input"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                    </select>
                </div>
            </div>

            {/* Search Results Info */}
            <div className="results-info">
                <span>Found <span className="results-count-badge">{currentData.length}</span> {activeTab}</span>
                {(searchTerm || statusFilter !== 'all' || areaFilter !== 'All') && (
                    <button
                        className="clear-filters-btn"
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            setAreaFilter('All');
                        }}
                    >
                        Clear all filters
                    </button>
                )}
            </div>

            {/* Data Table */}
            <DataTable
                columns={
                    activeTab === 'farmers' ? farmerColumns :
                        activeTab === 'instructors' ? instructorColumns :
                            divisionColumns
                }
                data={currentData}
                actions={activeActions}
                onAction={handleAction}
                emptyMessage={loading ? 'Loading users...' : `No ${activeTab} found matching your filters.`}
            />

            {/* User Details Drawer */}
            <UserDetailsDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                user={selectedUser}
                activeTab={activeTab}
                onEdit={() => alert('Editing user...')}
            />

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                type={confirmConfig.type}
                loading={confirmConfig.loading}
            />

            {/* Add Division Modal */}
            <div 
                className={`modal-overlay ${isAddDivisionModalOpen ? 'active' : ''}`}
                onClick={() => setIsAddDivisionModalOpen(false)}
            >
                <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3 className="modal-title">
                            <i className="fas fa-map-marker-alt" style={{ marginRight: '10px', color: 'var(--primary)' }}></i>
                            Add New Division
                        </h3>
                        <button className="modal-close" onClick={() => setIsAddDivisionModalOpen(false)}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <form onSubmit={handleAddDivision}>
                        <div className="admin-modal-body">
                            <div className="admin-form-group">
                                <label>
                                    <i className="fas fa-city" style={{ marginRight: '8px', color: 'var(--gray)' }}></i>
                                    District
                                </label>
                                <input 
                                    type="text" 
                                    className="admin-form-control" 
                                    value={newDivision.district}
                                    readOnly
                                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                />
                                <small style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>Default district is Anuradhapura</small>
                            </div>
                            <div className="admin-form-group">
                                <label>
                                    <i className="fas fa-layer-group" style={{ marginRight: '8px', color: 'var(--gray)' }}></i>
                                    Zone (Project)
                                </label>
                                <select 
                                    className="admin-form-control" 
                                    value={newDivision.zone}
                                    onChange={(e) => setNewDivision({...newDivision, zone: e.target.value})}
                                    required
                                >
                                    {zoneOptions.map(zone => (
                                        <option key={zone.id} value={zone.name}>
                                            {zone.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label>
                                    <i className="fas fa-id-badge" style={{ marginRight: '8px', color: 'var(--gray)' }}></i>
                                    Instructor Division
                                </label>
                                <input 
                                    type="text" 
                                    className="admin-form-control" 
                                    placeholder="e.g. Division 01"
                                    value={newDivision.instructorDivision}
                                    onChange={(e) => setNewDivision({...newDivision, instructorDivision: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsAddDivisionModalOpen(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
                                Save Division
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div >
    );
};

export default UserManagement;
