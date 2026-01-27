import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import DataTable from '../../admin/components/DataTable';
import StatusBadge from '../../admin/components/StatusBadge';

const FarmerManagement = () => {
    const { openModal, showToast } = useOutletContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [divisionFilter, setDivisionFilter] = useState('All');
    const [loading, setLoading] = useState(false);
    const [farmers, setFarmers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

    // Mock Instructor Data (In a real app, this would come from auth context or API)
    const instructorInfo = {
        businessArea: 'Nuwaragam Palatha Zone',
        assignedDivisions: ['Nuwaragam Palatha Central', 'Mihintale', 'Nochchiyagama']
    };

    // Mock Data Fetching
    const fetchFarmers = async () => {
        setLoading(true);
        // Simulating API delay
        setTimeout(() => {
            const mockFarmers = [
                {
                    id: 1,
                    displayId: 'FARM-2026-0001',
                    name: 'Sunil Perera',
                    division: 'Nuwaragam Palatha Central',
                    joined: '2025-12-10'
                },
                {
                    id: 2,
                    displayId: 'FARM-2026-0002',
                    name: 'Kamal Gunaratne',
                    division: 'Mihintale',
                    joined: '2025-12-15'
                },
                {
                    id: 3,
                    displayId: 'FARM-2026-0003',
                    name: 'Nimal Siripala',
                    division: 'Nochchiyagama',
                    joined: '2026-01-05'
                },
                {
                    id: 4,
                    displayId: 'FARM-2026-0004',
                    name: 'Wimal Weerawansa',
                    division: 'Nuwaragam Palatha Central',
                    joined: '2026-01-10'
                },
                {
                    id: 5,
                    displayId: 'FARM-2026-0005',
                    name: 'Bandula Gunawardena',
                    division: 'Mihintale',
                    joined: '2026-01-20'
                }
            ];

            setFarmers(mockFarmers);
            setPagination(prev => ({ ...prev, total: mockFarmers.length }));
            setLoading(false);
        }, 500);
    };

    useEffect(() => {
        fetchFarmers();
    }, [pagination.page, divisionFilter]);

    const handleAction = (action, farmer) => {
        if (action === 'view') {
            showToast(`Viewing details for ${farmer.name}`, 'info');
            // Logic to open view drawer/modal
        } else if (action === 'edit') {
            showToast(`Editing ${farmer.name}`, 'info');
            // Logic to open edit modal
        }
    };

    const columns = [
        { header: 'Farmer ID', accessor: 'displayId', width: '150px' },
        { header: 'Name', accessor: 'name' },
        { header: 'Division', accessor: 'division' },
        { header: 'Joined Date', accessor: 'joined' }
    ];

    const actions = [
        { name: 'view', type: 'primary', label: 'View' },
        { name: 'edit', type: 'secondary', label: 'Edit' }
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
            <div className="page-title">
                <i className="fas fa-users"></i>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2>Farmer Management</h2>
                    <span style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
                        <i className="fas fa-map-marker-alt" style={{ marginRight: '5px' }}></i>
                        {instructorInfo.businessArea}
                    </span>
                </div>
            </div>

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
                                {instructorInfo.assigned_divisions && instructorInfo.assigned_divisions.map(div => (
                                    <option key={div} value={div}>{div}</option>
                                ))}
                                {/* Fallback for mock data */}
                                {!instructorInfo.assigned_divisions && instructorInfo.assignedDivisions.map(div => (
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
