import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import styles from '../styles/UserIdManagement.module.css';
import btnStyles from '@/components/common/styles/Button.module.css';
import ConfirmModal from '@/components/common/feedback/ConfirmModal';
import { adminAPI } from '@/services/adminService';

const UserIdManagement = () => {
    const [activeTab, setActiveTab] = useState('farmer');
    const [ids, setIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        type: 'warning',
        action: null
    });

    const { showToast } = useOutletContext();
    const { t } = useTranslation('admin');

    const openConfirm = ({ title, message, confirmText = 'Confirm', type = 'warning', action }) => {
        setConfirmConfig({
            isOpen: true,
            title,
            message,
            confirmText,
            type,
            action
        });
    };

    const closeConfirm = () => {
        setConfirmConfig({
            isOpen: false,
            title: '',
            message: '',
            confirmText: 'Confirm',
            type: 'warning',
            action: null
        });
    };

    const executeConfirm = async () => {
        if (typeof confirmConfig.action === 'function') {
            await confirmConfig.action();
        }
        closeConfirm();
    };

    // Fetch IDs
    const fetchIds = async () => {
        setLoading(true);
        try {
            const data = await adminAPI.getUserIds(activeTab);

            if (data) {
                setIds(data.data || data);
            } else {
                showToast(data?.error?.message || 'Failed to fetch IDs', 'error');
            }
        } catch (error) {
            console.error('Error fetching IDs:', error);
            showToast(error.message || 'Failed to connect to server', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIds();
    }, [activeTab]);

    // Generate IDs
    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const data = await adminAPI.generateUserId(activeTab);

            if (data && (data.success || data.message)) {
                showToast(data.message || 'IDs generated successfully', 'success');
                await fetchIds(); // Refresh list - await to ensure loading state is handled if needed
            } else {
                showToast(data?.error?.message || 'Failed to generate IDs', 'error');
            }
        } catch (error) {
            console.error('Error generating IDs:', error);
            showToast(error.message || 'Failed to generate IDs', 'error');
        } finally {
            setGenerating(false);
        }
    };

    // Clear Unused IDs
    const handleClearUnused = async () => {
        setClearing(true);
        try {
            const data = await adminAPI.pruneUserIds(activeTab, 'active');

            if (data && (data.success || data.message)) {
                showToast(data.message || 'Unused IDs cleared successfully', 'success');
                await fetchIds(); // Refresh list
            } else {
                showToast(data?.error?.message || 'Failed to clear IDs', 'error');
            }
        } catch (error) {
            console.error('Error clearing IDs:', error);
            showToast(error.message || 'Failed to clear IDs', 'error');
        } finally {
            setClearing(false);
        }
    };

    const requestClearUnused = () => {
        openConfirm({
            title: t('ids.clearUnusedTitle'),
            message: t('ids.clearUnusedMsg'),
            confirmText: t('ids.clearIdsConfirm'),
            type: 'danger',
            action: handleClearUnused
        });
    };

    // Toggle Status
    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'used' : 'active';
        try {
            const data = await adminAPI.updateUserIdStatus(id, newStatus);

            if (data && (data.success || data.message)) {
                showToast('Status updated successfully', 'success');
                // Update local state to avoid full refetch
                setIds(prevIds => prevIds.map(item =>
                    item.id === id ? { ...item, status: newStatus } : item
                ));
            } else {
                showToast(data?.error?.message || 'Failed to update status', 'error');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showToast(error.message || 'Failed to update status', 'error');
        }
    };

    // Filter Logic
    const filteredIds = ids.filter(item => {
        const matchesSearch = item.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Columns configuration
    const columns = [
        { header: t('ids.colCode'), accessor: 'code', sortable: true },
        { header: t('ids.colYear'), accessor: 'year', sortable: true },
        {
            header: t('ids.colCreatedAtLabel'),
            accessor: 'created_at',
            sortable: true,
            render: (row) => new Date(row.created_at).toLocaleDateString() + ' ' + new Date(row.created_at).toLocaleTimeString()
        },
        {
            header: t('ids.colStatus'),
            accessor: 'status',
            sortable: true,
            render: (row) => (
                <StatusBadge status={row.status === 'active' ? 'Active' : 'Using'} />
            )
        },
        {
            header: t('ids.colActionsLabel'),
            accessor: 'actions',
            render: (row) => (
                row.status === 'active' ? (
                    <button
                        className={styles.btnMarkUsing}
                        onClick={(e) => {
                            e.stopPropagation();
                            openConfirm({
                                title: t('ids.markUsingTitle'),
                                message: t('ids.markUsingMsg'),
                                confirmText: t('ids.markUsingConfirm'),
                                type: 'warning',
                                action: () => toggleStatus(row.id, row.status)
                            });
                        }}
                    >
                        {t('ids.markAsUsing')}
                    </button>
                ) : (
                    <span className={styles.textInUse}>
                        {t('ids.inUseLocked')}
                    </span>
                )
            )
        }
    ];

    return (
        <div className={styles.page}>
            <div className={styles.pageTitle}>
                <div className={styles.pageTitleLeft}>
                    <i className="fas fa-id-card"></i>
                    <h2>{t('ids.title')}</h2>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={`${btnStyles.btn} ${btnStyles.btnSecondary}`}
                        onClick={requestClearUnused}
                        disabled={clearing || loading}
                    >
                        <i className={`fas ${clearing ? 'fa-spinner fa-spin' : 'fa-trash-can'}`}></i>
                        <span>{clearing ? t('ids.clearingBtn') : t('ids.clearBtn')}</span>
                    </button>
                    <button
                        className={`${btnStyles.btn} ${btnStyles.btnPrimary}`}
                        onClick={handleGenerate}
                        disabled={generating || loading}
                    >
                        <i className={`fas ${generating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                        <span>{generating ? t('ids.generatingNewBtn') : t('ids.generateNewBtn')}</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabsContainer}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'farmer' ? styles.active : ''}`}
                    onClick={() => setActiveTab('farmer')}
                >
                    {t('ids.tabFarmers')}
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'instructor' ? styles.active : ''}`}
                    onClick={() => setActiveTab('instructor')}
                >
                    {t('ids.tabInstructors')}
                </button>
            </div>

            {/* Filters */}
            <div className={styles.filtersBar}>
                <div className={styles.searchBox}>
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        className={styles.filterInput}
                        placeholder={t('ids.searchIdsPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <select
                        className={styles.filterInput}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">{t('ids.statusAll')}</option>
                        <option value="active">{t('ids.statusActive')}</option>
                        <option value="used">{t('ids.statusUsing')}</option>
                    </select>
                </div>
            </div>

            {/* Results Info */}
            <div className={styles.resultsInfo}>
                {t('ids.showingLabel')} <span className={styles.resultsCountBadge}>{filteredIds.length}</span> {t('ids.codesLabel')}
                {(searchTerm || statusFilter !== 'all') && (
                    <button
                        className={styles.clearFiltersBtn}
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                        }}
                    >
                        {t('ids.clearFilters')}
                    </button>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>{t('ids.loadingIds')}</p>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={filteredIds}
                    emptyMessage={t('ids.emptyIds')}
                />
            )}

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={closeConfirm}
                onConfirm={executeConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                type={confirmConfig.type}
            />
        </div>
    );
};

export default UserIdManagement;
