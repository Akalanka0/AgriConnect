import React, { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import UserDetailsDrawer from '../components/UserDetailsDrawer';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/AdminDash.css';

const UserManagement = () => {
    const [activeTab, setActiveTab] = useState('farmers');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [areaFilter, setAreaFilter] = useState('All');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

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
                        location: details.business_area || '-', // Map business_area to location
                        instructorDivision: details.instructor_division || '-',
                        instructor: user.instructor, // Assigned Instructor Name
                        farmersCount: user.farmersCount, // Calculated Farmers Count
                        // For instructors
                        businessArea: details.business_area || '-',
                        divisions: typeof details.assigned_divisions === 'string' 
                            ? JSON.parse(details.assigned_divisions || '[]') 
                            : (details.assigned_divisions || []),
                        status: user.status.charAt(0).toUpperCase() + user.status.slice(1), // Capitalize
                        joined: new Date(user.created_at).toISOString().split('T')[0]
                    };
                });
                setUsers(transformedUsers);
                setPagination(prev => ({ ...prev, total: result.pagination.total }));
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
    const areaKey = activeTab === 'farmers' ? 'location' : 'businessArea';

    const businessAreas = ['All', ...Array.from(new Set(currentList.map(u => u[areaKey]).filter(Boolean)))];
    const currentData = currentList.filter(u => {
        const matchesArea = areaFilter === 'All' || u[areaKey] === areaFilter;
        const term = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
            u.name.toLowerCase().includes(term) ||
            (u.displayId || '').toLowerCase().includes(term) ||
            (u.phone || '').toLowerCase().includes(term) ||
            (u.email || '').toLowerCase().includes(term) ||
            (u.district || '').toLowerCase().includes(term) ||
            (u.location || '').toLowerCase().includes(term);
        return matchesArea && matchesSearch;
    });

    // Table Columns
    const farmerColumns = [
        { header: 'ID', accessor: 'displayId', width: '140px' },
        { header: 'NAME', accessor: 'name' },
        { header: 'BUSINESS AREA', accessor: 'location' },
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
        { header: 'BUSINESS AREA', accessor: 'businessArea' },
        { header: 'FARMERS COUNT', accessor: 'farmersCount', render: (row) => row.farmersCount || 0 },
        {
            header: 'STATUS',
            accessor: 'status',
            render: (row) => <StatusBadge status={row.status} />
        },
        { header: 'JOINED DATE', accessor: 'joined' }
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
                title: 'Delete User',
                message: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
                confirmText: 'Delete',
                type: 'danger',
                onConfirm: async () => {
                    setConfirmConfig(prev => ({ ...prev, loading: true }));
                    await deleteUser(user.id);
                    setConfirmConfig(prev => ({ ...prev, isOpen: false, loading: false }));
                    // Toast handled in deleteUser
                }
            });
        } else if (action === 'block') {
            setConfirmConfig({
                isOpen: true,
                title: 'Block User',
                message: `Are you sure you want to block ${user.name}? They will not be able to log in.`,
                confirmText: 'Block',
                type: 'warning',
                onConfirm: async () => {
                    setConfirmConfig(prev => ({ ...prev, loading: true }));
                    await handleStatusChange(user, 'blocked');
                    setConfirmConfig(prev => ({ ...prev, isOpen: false, loading: false }));
                    showToast(`${user.name} has been blocked.`, 'warning');
                }
            });
        } else if (action === 'unblock') {
            setConfirmConfig({
                isOpen: true,
                title: 'Unblock User',
                message: `Are you sure you want to unblock ${user.name}?`,
                confirmText: 'Unblock',
                type: 'success',
                onConfirm: async () => {
                    setConfirmConfig(prev => ({ ...prev, loading: true }));
                    await handleStatusChange(user, 'active');
                    setConfirmConfig(prev => ({ ...prev, isOpen: false, loading: false }));
                    showToast(`${user.name} has been unblocked.`, 'success');
                }
            });
        }
    };

    const actions = [
        { name: 'view', type: 'primary', label: 'View' },
        { name: 'delete', type: 'danger', label: 'Delete' },
        {
            name: (row) => row.status.toLowerCase() === 'blocked' ? 'unblock' : 'block',
            type: (row) => row.status.toLowerCase() === 'blocked' ? 'warning' : 'secondary',
            label: (row) => row.status.toLowerCase() === 'blocked' ? 'Unblock' : 'Block'
        }
    ];

    return (
        <div className="page active" id="users">
            <div className="page-title">
                <i className="fas fa-users"></i>
                <h2>User Management</h2>
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
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        className="filter-input"
                        placeholder="Search by name, ID, location, or phone..."
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
                        {businessAreas.map(area => (
                            <option key={area} value={area}>{area === 'All' ? 'All Areas' : area}</option>
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
                columns={activeTab === 'farmers' ? farmerColumns : instructorColumns}
                data={currentData}
                actions={actions}
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
        </div >
    );
};

export default UserManagement;
