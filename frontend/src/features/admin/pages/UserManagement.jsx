import React, { useState } from 'react';
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

    // Mock Data (In real app, fetch from API)
    const [farmers, setFarmers] = useState([
        { id: 'FARM001', name: 'Sunil Perera', email: 'sunil@example.com', phone: '0771234567', district: 'Anuradhapura', location: 'Padaviya', instructorDivision: 'Boganewa', instructor: 'Rohan Silva', status: 'Active', joined: '2023-10-15' },
        { id: 'FARM002', name: 'Kamala Fernando', email: 'kamala@example.com', phone: '0719876543', district: 'Anuradhapura', location: 'Padaviya', instructorDivision: 'Boganewa', instructor: 'Rohan Silva', status: 'Active', joined: '2024-01-20' },
        { id: 'FARM003', name: 'Nimal Rathnayake', email: 'nimal@example.com', phone: '0755555555', district: 'Anuradhapura', location: 'Padaviya', instructorDivision: 'Kumbukwewa', instructor: 'Rohan Silva', status: 'Active', joined: '2023-11-05' },
        { id: 'FARM004', name: 'Saman Kumara', email: 'saman@example.com', phone: '0761112222', district: 'Anuradhapura', location: 'Padaviya', instructorDivision: 'Kumbukwewa', instructor: 'Rohan Silva', status: 'Blocked', joined: '2023-09-12' },
        { id: 'FARM005', name: 'Ajith Weerasinghe', email: 'ajith@example.com', phone: '0773334444', district: 'Anuradhapura', location: 'Padaviya', instructorDivision: 'Boganewa', instructor: 'Rohan Silva', status: 'Active', joined: '2024-02-10' },

        { id: 'FARM006', name: 'Chitra Kumari', email: 'chitra@example.com', phone: '0712223333', district: 'Anuradhapura', location: 'Rajanganaya', instructorDivision: 'Yaya 1', instructor: 'Priya Bandara', status: 'Active', joined: '2023-12-01' },
        { id: 'FARM007', name: 'Sarath Fonseka', email: 'sarath@example.com', phone: '0774445555', district: 'Anuradhapura', location: 'Rajanganaya', instructorDivision: 'Yaya 1', instructor: 'Priya Bandara', status: 'Active', joined: '2023-11-20' },
        { id: 'FARM008', name: 'Malini De Silva', email: 'malini@example.com', phone: '0756667777', district: 'Anuradhapura', location: 'Rajanganaya', instructorDivision: 'Yaya 2', instructor: 'Priya Bandara', status: 'Active', joined: '2024-01-05' },
        { id: 'FARM009', name: 'Bandara Menike', email: 'bandara@example.com', phone: '0701112222', district: 'Anuradhapura', location: 'Rajanganaya', instructorDivision: 'Yaya 2', instructor: 'Priya Bandara', status: 'Active', joined: '2023-10-30' },
        { id: 'FARM010', name: 'Jagath Pushpakumara', email: 'jagath@example.com', phone: '0763334444', district: 'Anuradhapura', location: 'Rajanganaya', instructorDivision: 'Yaya 1', instructor: 'Priya Bandara', status: 'Active', joined: '2024-02-15' },

        { id: 'FARM011', name: 'Gunapala Herath', email: 'gunapala@example.com', phone: '0715556666', district: 'Anuradhapura', location: 'Vahalkada', instructorDivision: 'Track 5', instructor: 'Anura Wickramasinghe', status: 'Active', joined: '2023-09-25' },
        { id: 'FARM012', name: 'Siripala Gamage', email: 'siripala@example.com', phone: '0777778888', district: 'Anuradhapura', location: 'Vahalkada', instructorDivision: 'Track 5', instructor: 'Anura Wickramasinghe', status: 'Active', joined: '2023-10-10' },
        { id: 'FARM013', name: 'Chandani Liyanage', email: 'chandani@example.com', phone: '0758889999', district: 'Anuradhapura', location: 'Vahalkada', instructorDivision: 'Track 6', instructor: 'Anura Wickramasinghe', status: 'Active', joined: '2024-01-12' },
        { id: 'FARM014', name: 'Duminda Silva', email: 'duminda@example.com', phone: '0702223333', district: 'Anuradhapura', location: 'Vahalkada', instructorDivision: 'Track 6', instructor: 'Anura Wickramasinghe', status: 'Active', joined: '2023-11-18' },
        { id: 'FARM015', name: 'Mahesh Senanayake', email: 'mahesh@example.com', phone: '0764445555', district: 'Anuradhapura', location: 'Vahalkada', instructorDivision: 'Track 5', instructor: 'Anura Wickramasinghe', status: 'Active', joined: '2024-02-20' },

        { id: 'FARM016', name: 'Thilini Priyadarshani', email: 'thilini@example.com', phone: '0716667777', district: 'Anuradhapura', location: 'Medawachchiya', instructorDivision: 'Tulana 1', instructor: 'Kasun Jayasuriya', status: 'Active', joined: '2023-12-10' },
        { id: 'FARM017', name: 'Ruwan Hettiarachchi', email: 'ruwan@example.com', phone: '0779990000', district: 'Anuradhapura', location: 'Medawachchiya', instructorDivision: 'Tulana 1', instructor: 'Kasun Jayasuriya', status: 'Active', joined: '2023-11-08' },
        { id: 'FARM018', name: 'Sanath Jayasuriya', email: 'sanath@example.com', phone: '0751112222', district: 'Anuradhapura', location: 'Medawachchiya', instructorDivision: 'Tulana 2', instructor: 'Kasun Jayasuriya', status: 'Active', joined: '2024-01-25' },
        { id: 'FARM019', name: 'Upul Tharanga', email: 'upul@example.com', phone: '0703334444', district: 'Anuradhapura', location: 'Medawachchiya', instructorDivision: 'Tulana 2', instructor: 'Kasun Jayasuriya', status: 'Active', joined: '2023-10-22' },
        { id: 'FARM020', name: 'Damitha Abeyratne', email: 'damitha@example.com', phone: '0765556666', district: 'Anuradhapura', location: 'Medawachchiya', instructorDivision: 'Tulana 1', instructor: 'Kasun Jayasuriya', status: 'Blocked', joined: '2024-02-28' },

        { id: 'FARM021', name: 'Kanthi Perera', email: 'kanthi@example.com', phone: '0718889999', district: 'Anuradhapura', location: 'Kebithigollewa', instructorDivision: 'Handagala', instructor: 'Nimali Perera', status: 'Active', joined: '2023-09-15' },
        { id: 'FARM022', name: 'Nihal Fernando', email: 'nihal@example.com', phone: '0772223333', district: 'Anuradhapura', location: 'Kebithigollewa', instructorDivision: 'Handagala', instructor: 'Nimali Perera', status: 'Active', joined: '2023-10-05' },
        { id: 'FARM023', name: 'Wasantha Kumar', email: 'wasantha@example.com', phone: '0754445555', district: 'Anuradhapura', location: 'Kebithigollewa', instructorDivision: 'Kanugahawewa', instructor: 'Nimali Perera', status: 'Active', joined: '2024-01-18' },
        { id: 'FARM024', name: 'Nayana Kumari', email: 'nayana@example.com', phone: '0706667777', district: 'Anuradhapura', location: 'Kebithigollewa', instructorDivision: 'Kanugahawewa', instructor: 'Nimali Perera', status: 'Active', joined: '2023-11-12' },
        { id: 'FARM025', name: 'Ranjith Premadasa', email: 'ranjith@example.com', phone: '0768889999', district: 'Anuradhapura', location: 'Kebithigollewa', instructorDivision: 'Handagala', instructor: 'Nimali Perera', status: 'Active', joined: '2024-02-05' }
    ]);

    const [instructors, setInstructors] = useState([
        { id: 'INST001', name: 'Rohan Silva', email: 'rohan@example.com', phone: '0711112222', district: 'Anuradhapura', businessArea: 'Padaviya', divisions: ['Boganewa', 'Kumbukwewa'], farmersCount: 5, status: 'Active', joined: '2023-01-15' },
        { id: 'INST002', name: 'Priya Bandara', email: 'priya@example.com', phone: '0773334444', district: 'Anuradhapura', businessArea: 'Rajanganaya', divisions: ['Yaya 1', 'Yaya 2'], farmersCount: 5, status: 'Active', joined: '2023-02-20' },
        { id: 'INST003', name: 'Anura Wickramasinghe', email: 'anura@example.com', phone: '0755556666', district: 'Anuradhapura', businessArea: 'Vahalkada', divisions: ['Track 5', 'Track 6'], farmersCount: 5, status: 'Active', joined: '2023-03-10' },
        { id: 'INST004', name: 'Kasun Jayasuriya', email: 'kasun@example.com', phone: '0707778888', district: 'Anuradhapura', businessArea: 'Medawachchiya', divisions: ['Tulana 1', 'Tulana 2'], farmersCount: 5, status: 'Active', joined: '2023-04-05' },
        { id: 'INST005', name: 'Nimali Perera', email: 'nimali@example.com', phone: '0769990000', district: 'Anuradhapura', businessArea: 'Kebithigollewa', divisions: ['Handagala', 'Kanugahawewa'], farmersCount: 5, status: 'Active', joined: '2023-05-12' }
    ]);

    // Filter Logic
    const filterData = (data) => {
        return data.filter(user => {
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                user.name.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                user.id.toLowerCase().includes(term) ||
                (user.phone && user.phone.includes(term)) ||
                (user.district && user.district.toLowerCase().includes(term)) ||
                (user.location && user.location.toLowerCase().includes(term)) || // Farmer Business Area
                (user.businessArea && user.businessArea.toLowerCase().includes(term)) || // Instructor Business Area
                (user.instructorDivision && user.instructorDivision.toLowerCase().includes(term)) || // Farmer Division
                (user.instructor && user.instructor.toLowerCase().includes(term)) || // Farmer's Instructor
                (user.divisions && Array.isArray(user.divisions) && user.divisions.some(div => div.toLowerCase().includes(term))); // Instructor Divisions

            const matchesStatus = statusFilter === 'all' || user.status.toLowerCase() === statusFilter.toLowerCase();

            const userArea = activeTab === 'farmers' ? user.location : user.businessArea;
            const matchesArea = areaFilter === 'All' || userArea === areaFilter;

            return matchesSearch && matchesStatus && matchesArea;
        });
    };

    // Get unique values for dropdowns
    const getUniqueValues = (data, key) => {
        return ['All', ...new Set(data.map(item => item[key]).filter(Boolean))];
    };

    const currentList = activeTab === 'farmers' ? farmers : instructors;
    const areaKey = activeTab === 'farmers' ? 'location' : 'businessArea';
    const businessAreas = getUniqueValues(currentList, areaKey);

    const currentData = activeTab === 'farmers' ? filterData(farmers) : filterData(instructors);

    // Table Columns
    const farmerColumns = [
        { header: 'ID', accessor: 'id', width: '100px' },
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
        { header: 'ID', accessor: 'id', width: '100px' },
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

    // Actions
    const updateUserStatus = (userId, newStatus) => {
        if (activeTab === 'farmers') {
            setFarmers(prev => prev.map(user => user.id === userId ? { ...user, status: newStatus } : user));
        } else {
            setInstructors(prev => prev.map(user => user.id === userId ? { ...user, status: newStatus } : user));
        }
    };

    const deleteUser = (userId) => {
        if (activeTab === 'farmers') {
            setFarmers(prev => prev.filter(user => user.id !== userId));
        } else {
            setInstructors(prev => prev.filter(user => user.id !== userId));
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
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 800));
                    deleteUser(user.id);
                    setConfirmConfig(prev => ({ ...prev, isOpen: false, loading: false }));
                    showToast(`${user.name} has been deleted.`, 'success');
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
                    await new Promise(resolve => setTimeout(resolve, 800));
                    updateUserStatus(user.id, 'Blocked');
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
                    await new Promise(resolve => setTimeout(resolve, 800));
                    updateUserStatus(user.id, 'Active');
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
            name: (row) => row.status === 'Blocked' ? 'unblock' : 'block',
            type: (row) => row.status === 'Blocked' ? 'warning' : 'secondary',
            label: (row) => row.status === 'Blocked' ? 'Unblock' : 'Block'
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
                        <option value="banned">Blocked</option>
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
                emptyMessage={`No ${activeTab} found matching your filters.`}
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
