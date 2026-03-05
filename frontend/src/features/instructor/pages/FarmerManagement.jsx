import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import InstructorDataTable from '../components/InstructorDataTable';
import FarmerDetailsModal from '../components/modals/FarmerDetailsModal';
import styles from '../styles/FarmerManagement.module.css';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import { getAccessToken } from '@/utils/authStorage';

const FarmerManagement = () => {
    const { openModal, showToast } = useOutletContext();
    const { t } = useTranslation('instructor');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [divisionFilter, setDivisionFilter] = useState('All');
    const [loading, setLoading] = useState(false);
    const [farmers, setFarmers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [selectedFarmerId, setSelectedFarmerId] = useState(null);
    const [instructorInfo, setInstructorInfo] = useState({
        zone: '',
        assignedDivisions: []
    });

    // Helper to format zone names (remove "Zone" suffix if present)
    const formatZoneName = (name) => {
        if (!name) return '-';
        return name.replace(/\s+Zone$/i, '').trim();
    };

    useEffect(() => {
        let isMounted = true;

        const fetchInstructorInfo = async () => {
            try {
                const token = getAccessToken();
                const response = await fetch('/api/instructor/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success && isMounted) {
                    setInstructorInfo({
                        zone: data.data.zone || '',
                        assignedDivisions: data.data.assigned_divisions || []
                    });
                }
            } catch (error) {
                if (isMounted) console.error('Error fetching instructor info:', error);
            }
        };

        fetchInstructorInfo();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchFarmersData = async () => {
            if (!isMounted) return;
            setLoading(true);
            try {
                const token = getAccessToken();
                const response = await fetch('/api/instructor/farmers', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success && isMounted) {
                    setFarmers(data.data);
                    setPagination(prev => ({ ...prev, total: data.data.length }));
                } else if (isMounted) {
                    showToast(data.error?.message || 'Failed to fetch farmers', 'error');
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Error fetching farmers:', error);
                    showToast(t('farmerMgmt.fetchError'), 'error');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchFarmersData();

        return () => {
            isMounted = false;
        };
    }, [pagination.page, showToast]);

    const handleAction = (action, farmer) => {
        if (action === 'view') {
            setSelectedFarmerId(farmer.id);
        }
    };

    const columns = [
        { header: t('farmers.colId'), accessor: 'displayId', width: '220px' },
        { header: t('farmers.colName'), accessor: 'name' },
        { header: t('farmers.colDivision'), accessor: 'division' },
        { header: t('farmers.colJoinedDate'), accessor: 'joined' }
    ];

    const actions = [
        { name: 'view', type: 'primary', label: t('farmers.actionView') }
    ];

    // Filter Logic
    const filteredData = farmers.filter(f => {
        const matchesDivision = divisionFilter === 'All' || f.division === divisionFilter;
        const term = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm ||
            f.name.toLowerCase().includes(term) ||
            f.displayId.toLowerCase().includes(term);

        return matchesDivision && matchesSearch;
    });

    return (
        <>
            <div className={commonCardStyles.card}>
                <div className={styles.tableHeader}>
                    <div className={styles.headerLeft}>
                        <div className={styles.searchBox}>
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder={t('farmers.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className={styles.filters}>
                            <select
                                className={styles.filterSelect}
                                value={divisionFilter}
                                onChange={(e) => setDivisionFilter(e.target.value)}
                            >
                                <option value="All">{t('farmers.allDivisions')}</option>
                                {instructorInfo.assignedDivisions && instructorInfo.assignedDivisions.map(div => (
                                    <option key={div} value={div}>{div}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <InstructorDataTable
                    columns={columns}
                    data={filteredData}
                    loading={loading}
                    actions={actions}
                    onAction={handleAction}
                    pagination={{
                        ...pagination,
                        onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
                    }}
                />
            </div>

            {/* Farmer Details Modal */}
            <FarmerDetailsModal
                isOpen={!!selectedFarmerId}
                onClose={() => setSelectedFarmerId(null)}
                farmerId={selectedFarmerId}
            />
        </>
    );
};

export default FarmerManagement;
