import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import UserDetailsDrawer from '../components/UserDetailsDrawer';
import ConfirmModal from '@/components/common/feedback/ConfirmModal';
import styles from '../styles/UserManagement.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import { adminAPI } from '@/services/adminService';

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
    const [regionHierarchy, setRegionHierarchy] = useState({});
    const zonesList = Object.keys(regionHierarchy);
    const [isSavingDivision, setIsSavingDivision] = useState(false);
    const [isAddDivisionModalOpen, setIsAddDivisionModalOpen] = useState(false);
    const [newDivision, setNewDivision] = useState({
        district: 'Anuradhapura',
        zone: '',
        instructorDivision: '',
        status: 'Active'
    });

    // Toast and Confirm Modal State
    const { showToast } = useOutletContext();
    const { t } = useTranslation('admin');
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

            const result = await adminAPI.getUsers(`?${queryParams}`);

            if (result && result.data) {
                // Transform data for DataTable
                const transformedUsers = result.data.map(user => {
                    const details = user.farmerDetail || user.instructorDetail || {};
                    // Parse farmer locations JSON
                    const farmerLocations = Array.isArray(details.locations)
                        ? details.locations
                        : (typeof details.locations === 'string' ? JSON.parse(details.locations || '[]') : []);
                    // Derive district: prefer flat column, then first location entry, then default
                    const district = details.district
                        || (farmerLocations.length > 0 ? farmerLocations[0].district : null)
                        || 'Anuradhapura';
                    return {
                        id: user.id, // Keep integer ID for API calls
                        displayId: details.farmer_id || details.instructor_id || `USER-${user.id}`, // Display ID
                        name: user.full_name,
                        email: user.email,
                        phone: user.phone,
                        nic: user.nic || '-',
                        district,
                        location: formatZoneName(details.zone), // Map zone to project
                        instructorDivision: details.instructor_division || '-',
                        farmerLocations, // All farmer location entries
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
                setPagination(prev => ({ ...prev, total: result.pagination?.total || 0 }));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            showToast(t('users.loadError'), 'error');
        } finally {
            setLoading(false);
        }
    };

    // Initial Fetch & Refetch on Filters Change
    useEffect(() => {
        fetchUsers();
    }, [activeTab, statusFilter, pagination.page, searchTerm]);

    // Rebuild divisions from region hierarchy whenever hierarchy or instructor list changes
    useEffect(() => {
        if (activeTab !== 'divisions') return;
        if (!regionHierarchy || Object.keys(regionHierarchy).length === 0) return;

        // Build instructor assignment lookup: divisionName -> { name, displayId }
        const divToInstructor = {};
        users.forEach(inst => {
            (inst.divisions || []).forEach(div => {
                divToInstructor[div] = { name: inst.name, displayId: inst.displayId };
            });
        });

        // Flatten all divisions from hierarchy, annotated with assignment status
        const allDivisions = [];
        Object.entries(regionHierarchy).forEach(([zone, divisions]) => {
            if (!Array.isArray(divisions)) return;
            divisions.forEach(div => {
                const assigned = divToInstructor[div];
                allDivisions.push({
                    id: `hier-${zone}-${div}`,
                    district: 'Anuradhapura',
                    zone: formatZoneName(zone),
                    instructorDivision: div,
                    instructor: assigned ? assigned.name : null,
                    instructorDisplayId: assigned ? assigned.displayId : null,
                    status: assigned ? 'Active' : 'Unassigned'
                });
            });
        });

        setLocalDivisions(allDivisions);
    }, [regionHierarchy, users, activeTab]);

    // Fetch region hierarchy on mount
    useEffect(() => {
        const fetchHierarchy = async () => {
            try {
                const response = await adminAPI.getRegionHierarchy();
                if (response && response.data) {
                    setRegionHierarchy(response.data);
                }
            } catch (error) {
                console.error('Error fetching region hierarchy:', error);
            }
        };
        fetchHierarchy();
    }, []);

    // Handle Status Change (Block/Unblock)
    const handleStatusChange = async (user, newStatus) => {
        try {
            const result = await adminAPI.toggleUserStatus(user.id, newStatus.toLowerCase());
            // Result is boolean true or object based on enhancedApiService

            if (result) {
                showToast(t('users.statusUpdated'), 'success');

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
                showToast(t('users.statusError'), 'error');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showToast(error.message || 'Failed to update status', 'error');
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
        { header: t('users.colId'), accessor: 'displayId', className: 'col-width-140' },
        { header: t('users.colName'), accessor: 'name' },
        { header: t('users.colZone'), accessor: 'location', render: (row) => formatZoneName(row.location) },
        { header: t('users.colAssignedInstructor'), accessor: 'instructor', render: (row) => row.instructor || t('users.notAssigned') },
        {
            header: t('users.colStatus'),
            accessor: 'status',
            render: (row) => <StatusBadge status={row.status} />
        },
        { header: t('users.colJoinedDate'), accessor: 'joined' }
    ];

    const instructorColumns = [
        { header: t('users.colId'), accessor: 'displayId', className: 'col-width-140' },
        { header: t('users.colName'), accessor: 'name' },
        { header: t('users.colZone'), accessor: 'zone', render: (row) => formatZoneName(row.zone) },
        { header: t('users.colFarmersCount'), accessor: 'farmersCount', render: (row) => row.farmersCount || 0 },
        {
            header: t('users.colStatus'),
            accessor: 'status',
            render: (row) => <StatusBadge status={row.status} />
        },
        { header: t('users.colJoinedDate'), accessor: 'joined' }
    ];

    const divisionColumns = [
        { header: t('users.colDistrict'), accessor: 'district' },
        { header: t('users.colZone'), accessor: 'zone', render: (row) => formatZoneName(row.zone) },
        { header: t('users.colInstructorDivision'), accessor: 'instructorDivision' },
        {
            header: t('users.colInstructor'),
            accessor: 'instructor',
            render: (row) => row.instructor ? (
                <span>
                    {row.instructor}
                    {row.instructorDisplayId && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                            {row.instructorDisplayId}
                        </span>
                    )}
                </span>
            ) : (
                <span style={{ color: 'var(--neutral-400)', fontStyle: 'italic' }}>{t('users.unassigned')}</span>
            )
        },
        {
            header: t('users.colStatus'),
            accessor: 'status',
            render: (row) => <StatusBadge status={row.status} />
        }
    ];

    const deleteUser = async (userId) => {
        try {
            const result = await adminAPI.deleteUser(userId);

            if (result) {
                setUsers(prev => prev.filter(user => user.id !== userId));
                setPagination(prev => ({ ...prev, total: prev.total - 1 }));
                showToast(t('users.deleteSuccess'), 'success');
            } else {
                showToast(t('users.deleteError'), 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showToast(error.message || 'Failed to delete user', 'error');
        }
    };

    const handleAction = (action, user) => {
        if (action === 'view') {
            setSelectedUser(user);
            setIsDrawerOpen(true);
        } else if (action === 'delete') {
            setConfirmConfig({
                isOpen: true,
                title: activeTab === 'divisions' ? t('users.deleteDivisionTitle') : t('users.deleteUserTitle'),
                message: activeTab === 'divisions'
                    ? t('users.deleteDivisionMsg', { name: user.instructorDivision })
                    : t('users.deleteUserMsg', { name: user.name }),
                confirmText: t('users.actionDelete'),
                type: 'danger',
                onConfirm: async () => {
                    setConfirmConfig(prev => ({ ...prev, loading: true }));
                    if (activeTab === 'divisions') {
                        try {
                            const updatedHierarchy = { ...regionHierarchy };
                            const zoneKey = Object.keys(updatedHierarchy).find(key =>
                                updatedHierarchy[key].includes(user.instructorDivision)
                            );
                            if (zoneKey) {
                                updatedHierarchy[zoneKey] = updatedHierarchy[zoneKey].filter(
                                    d => d !== user.instructorDivision
                                );
                                await adminAPI.updateRegionHierarchy(updatedHierarchy);
                                setRegionHierarchy(updatedHierarchy); // triggers useEffect rebuild
                            }
                            showToast(t('users.divisionDeleted'), 'success');
                        } catch (error) {
                            console.error('Error deleting division:', error);
                            showToast(t('users.divisionDeleteError'), 'error');
                        }
                    } else {
                        await deleteUser(user.id);
                    }
                    setConfirmConfig(prev => ({ ...prev, isOpen: false, loading: false }));
                }
            });
        } else if (action === 'block') {
            setConfirmConfig({
                isOpen: true,
                title: t('users.blockUserTitle'),
                message: t('users.blockUserMsg', { name: user.name }),
                confirmText: t('users.actionBlock'),
                type: 'warning',
                onConfirm: async () => {
                    setConfirmConfig(prev => ({ ...prev, loading: true }));
                    await handleStatusChange(user, 'blocked');
                    setConfirmConfig(prev => ({ ...prev, isOpen: false, loading: false }));
                }
            });
        } else if (action === 'unblock') {
            setConfirmConfig({
                isOpen: true,
                title: t('users.unblockUserTitle'),
                message: t('users.unblockUserMsg', { name: user.name }),
                confirmText: t('users.actionUnblock'),
                type: 'success',
                onConfirm: async () => {
                    setConfirmConfig(prev => ({ ...prev, loading: true }));
                    await handleStatusChange(user, 'active');
                    setConfirmConfig(prev => ({ ...prev, isOpen: false, loading: false }));
                }
            });
        }
    };

    const actions = [
        {
            name: 'view',
            type: 'primary',
            label: t('users.actionView'),
            hidden: activeTab === 'divisions'
        },
        { name: 'delete', type: 'danger', label: t('users.actionDelete') },
        {
            name: (row) => row.status.toLowerCase() === 'blocked' ? 'unblock' : 'block',
            type: (row) => row.status.toLowerCase() === 'blocked' ? 'warning' : 'secondary',
            label: (row) => row.status.toLowerCase() === 'blocked' ? t('users.actionUnblock') : t('users.actionBlock'),
            hidden: activeTab === 'divisions'
        }
    ];

    // Filter actions for the specific tab
    const activeActions = actions.filter(action => !action.hidden);

    const handleAddDivision = async (e) => {
        e.preventDefault();
        if (!newDivision.zone || !newDivision.instructorDivision) {
            showToast(t('users.fillAllFields'), 'warning');
            return;
        }

        // Check for duplicate
        const isDuplicate = localDivisions.some(
            d => d.zone === formatZoneName(newDivision.zone) &&
                 d.instructorDivision === newDivision.instructorDivision
        );
        if (isDuplicate) {
            showToast(t('users.divisionExists'), 'warning');
            return;
        }

        setIsSavingDivision(true);
        try {
            // Build updated hierarchy
            const updatedHierarchy = { ...regionHierarchy };
            const zoneKey = newDivision.zone;
            if (!updatedHierarchy[zoneKey]) {
                updatedHierarchy[zoneKey] = [];
            }
            if (!updatedHierarchy[zoneKey].includes(newDivision.instructorDivision)) {
                updatedHierarchy[zoneKey] = [...updatedHierarchy[zoneKey], newDivision.instructorDivision];
            }

            await adminAPI.updateRegionHierarchy(updatedHierarchy);
            setRegionHierarchy(updatedHierarchy); // triggers the useEffect to rebuild localDivisions
            setIsAddDivisionModalOpen(false);
            setNewDivision({
                district: 'Anuradhapura',
                zone: '',
                instructorDivision: '',
                status: 'Active'
            });
            showToast(t('users.divisionAdded'), 'success');
        } catch (error) {
            console.error('Error saving division:', error);
            showToast(t('users.divisionSaveError'), 'error');
        } finally {
            setIsSavingDivision(false);
        }
    };

    return (
        <div className={`${styles.page} ${styles.active}`} id="users">
            <div className={styles.pageTitle}>
                <i className="fas fa-users"></i>
                <h2>{t('users.title')}</h2>
                {activeTab === 'divisions' && (
                    <button
                        className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary} btn-add-division`}
                        onClick={() => setIsAddDivisionModalOpen(true)}
                    >
                        <i className="fas fa-plus"></i> {t('users.addDivisionBtn')}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className={styles.tabsContainer}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'farmers' ? styles.active : ''}`}
                    onClick={() => setActiveTab('farmers')}
                >
                    {t('users.tabFarmers')}
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'instructors' ? styles.active : ''}`}
                    onClick={() => setActiveTab('instructors')}
                >
                    {t('users.tabInstructors')}
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'divisions' ? styles.active : ''}`}
                    onClick={() => setActiveTab('divisions')}
                >
                    {t('users.tabDivisions')}
                </button>
            </div>

            {/* Filters */}
            <div className={styles.filtersBar}>
                <div className={styles.searchBox}>
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        className={styles.filterInput}
                        placeholder={t('users.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <select
                        className={styles.filterInput}
                        value={areaFilter}
                        onChange={(e) => setAreaFilter(e.target.value)}
                    >
                        {zones.map(area => (
                            <option key={area} value={area}>{area === 'All' ? t('users.allZones') : area}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <select
                        className={styles.filterInput}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">{t('users.statusAll')}</option>
                        <option value="active">{t('users.statusActive')}</option>
                        <option value="blocked">{t('users.statusBlocked')}</option>
                    </select>
                </div>
            </div>

            {/* Search Results Info */}
            <div className={styles.resultsInfo}>
                <span>{t('users.foundLabel')} <span className={styles.resultsCountBadge}>{currentData.length}</span> {activeTab}</span>
                {(searchTerm || statusFilter !== 'all' || areaFilter !== 'All') && (
                    <button
                        className={styles.clearFiltersBtn}
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            setAreaFilter('All');
                        }}
                    >
                        {t('users.clearAllFilters')}
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
                emptyMessage={loading ? t('users.loadingTable') : (
                    activeTab === 'farmers' ? t('users.emptyFarmersTable') :
                    activeTab === 'instructors' ? t('users.emptyInstructorsTable') :
                    t('users.emptyDivisionsTable')
                )}
            />

            {/* User Details Drawer */}
            <UserDetailsDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                user={selectedUser}
                activeTab={activeTab}

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
                className={`${styles.modalOverlay} ${isAddDivisionModalOpen ? styles.active : ''}`}
                onClick={() => setIsAddDivisionModalOpen(false)}
            >
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>
                            <i className={`fas fa-location-dot ${styles.iconMarginRight} ${styles.iconPrimary}`}></i>
                            {t('users.addDivisionTitle')}
                        </h3>
                        <button className={styles.modalClose} onClick={() => setIsAddDivisionModalOpen(false)}>
                            <i className="fas fa-xmark"></i>
                        </button>
                    </div>
                    <form onSubmit={handleAddDivision}>
                        <div className={styles.adminModalBody}>
                            <div className={styles.adminFormGroup}>
                                <label>{t('users.addDivisionDistrict')}</label>
                                <div className={styles.adminFormControl}>
                                    <i className={`fas fa-city ${styles.iconMarginRightSmall} ${styles.iconGray}`}></i>
                                    <input
                                        type="text"
                                        value={newDivision.district}
                                        readOnly
                                        className={styles.inputDisabled}
                                        style={{ border: 'none', background: 'transparent', padding: 0, width: 'calc(100% - 25px)', outline: 'none' }}
                                    />
                                </div>
                                <small className={styles.smallHelpText}>{t('users.addDivisionDistrictHint')}</small>
                            </div>
                            <div className={styles.adminFormGroup}>
                                <label>
                                    <i className={`fas fa-layer-group ${styles.iconMarginRightSmall} ${styles.iconGray}`}></i>
                                    {t('users.addDivisionZoneLabel')}
                                </label>
                                <select
                                    className={styles.adminFormControl}
                                    value={newDivision.zone}
                                    onChange={(e) => setNewDivision({ ...newDivision, zone: e.target.value })}
                                    required
                                >
                                    {zonesList.map(zone => (
                                        <option key={zone} value={zone}>
                                            {zone}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.adminFormGroup}>
                                <label>
                                    <i className={`fas fa-id-badge ${styles.iconMarginRightSmall} ${styles.iconGray}`}></i>
                                    {t('users.addDivisionNameLabel')}
                                </label>
                                <input
                                    type="text"
                                    className={styles.adminFormControl}
                                    placeholder={t('users.divisionNamePlaceholderHint')}
                                    value={newDivision.instructorDivision}
                                    onChange={(e) => setNewDivision({ ...newDivision, instructorDivision: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className={styles.adminModalFooter}>
                            <button type="button" className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`} onClick={() => setIsAddDivisionModalOpen(false)}>
                                {t('users.cancelBtn')}
                            </button>
                            <button type="submit" className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} disabled={isSavingDivision}>
                                <i className={`fas ${isSavingDivision ? 'fa-spinner fa-spin' : 'fa-save'} ${styles.iconMarginRightSmall}`}></i>
                                {isSavingDivision ? t('users.savingBtn') : t('users.saveBtn')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div >
    );
};

export default UserManagement;
