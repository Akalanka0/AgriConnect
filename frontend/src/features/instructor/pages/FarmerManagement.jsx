import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import DataTable from '../../admin/components/DataTable';
import StatusBadge from '../../admin/components/StatusBadge';
import FarmerDetailsModal from '../components/modals/FarmerDetailsModal';

const FarmerManagement = () => {
    const { openModal, showToast } = useOutletContext();
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

    // Fetch Instructor Info (Divisions)
    const fetchInstructorInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/instructor/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setInstructorInfo({
                    zone: data.data.zone || '',
                    assignedDivisions: data.data.assigned_divisions || []
                });
            }
        } catch (error) {
            console.error('Error fetching instructor info:', error);
        }
    };

    
    useEffect(() => {
        let isMounted = true;
        
        const fetchInstructorInfo = async () => {
            try {
                const token = localStorage.getItem('token');
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
                const token = localStorage.getItem('token');
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
                    showToast('An error occurred while fetching farmers', 'error');
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
        { header: 'Farmer ID', accessor: 'displayId', width: '150px' },
        { header: 'Name', accessor: 'name' },
        { header: 'Division', accessor: 'division' },
        { header: 'Joined Date', accessor: 'joined' }
    ];

    const actions = [
        { name: 'view', type: 'primary', label: 'View' }
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
            <div className="card">
                <div className="table-header">
                    <div className="header-left">
                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search farmers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filters">
                            <select
                                className="filter-select"
                                value={divisionFilter}
                                onChange={(e) => setDivisionFilter(e.target.value)}
                            >
                                <option value="All">All Divisions</option>
                                {instructorInfo.assignedDivisions && instructorInfo.assignedDivisions.map(div => (
                                    <option key={div} value={div}>{div}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <DataTable
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

            <style jsx>{`
                .header-left {
                    display: flex;
                    gap: 15px;
                    flex: 1;
                }
                .search-box {
                    position: relative;
                    min-width: 250px;
                }
                .search-box i {
                    position: absolute;
                    left: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #999;
                }
                .search-box input {
                    width: 100%;
                    padding: 8px 10px 8px 35px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 0.9em;
                }
                .filters {
                    display: flex;
                    gap: 10px;
                }
                .filter-select {
                    padding: 8px 10px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background-color: white;
                    font-size: 0.9em;
                    min-width: 150px;
                }
                @media (max-width: 768px) {
                    .table-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 15px;
                    }
                    .header-left {
                        flex-direction: column;
                        width: 100%;
                    }
                    .search-box {
                        width: 100%;
                    }
                    .filters {
                        width: 100%;
                    }
                    .filter-select {
                        flex: 1;
                    }
                }
            `}</style>
        </>
    );
};

export default FarmerManagement;
