import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import '../styles/AdminDash.css';
import '../styles/UserIdManagement.css';

const UserIdManagement = () => {
    const [activeTab, setActiveTab] = useState('farmer');
    const [ids, setIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    const { showToast } = useToast();
    const API_BASE = '/api/admin';

    // Fetch IDs
    const fetchIds = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/ids?type=${activeTab}`);
            const data = await response.json();
            
            if (data.success) {
                setIds(data.data);
            } else {
                showToast(data.error?.message || 'Failed to fetch IDs', 'error');
            }
        } catch (error) {
            console.error('Error fetching IDs:', error);
            showToast('Failed to connect to server', 'error');
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
            const response = await fetch(`${API_BASE}/ids/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type: activeTab })
            });
            const data = await response.json();
            
            if (data.success) {
                showToast(data.message, 'success');
                await fetchIds(); // Refresh list - await to ensure loading state is handled if needed
            } else {
                showToast(data.error?.message || 'Failed to generate IDs', 'error');
            }
        } catch (error) {
            console.error('Error generating IDs:', error);
            showToast('Failed to generate IDs', 'error');
        } finally {
            setGenerating(false);
        }
    };

    // Clear Unused IDs
    const handleClearUnused = async () => {
        if (!window.confirm('Are you sure you want to delete all "Unused" (Active) IDs? This action cannot be undone.')) {
            return;
        }

        setClearing(true);
        try {
            const response = await fetch(`${API_BASE}/ids/prune`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type: activeTab, status: 'active' })
            });
            const data = await response.json();
            
            if (data.success) {
                showToast(data.message, 'success');
                await fetchIds(); // Refresh list
            } else {
                showToast(data.error?.message || 'Failed to clear IDs', 'error');
            }
        } catch (error) {
            console.error('Error clearing IDs:', error);
            showToast('Failed to clear IDs', 'error');
        } finally {
            setClearing(false);
        }
    };

    // Toggle Status
    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'used' : 'active';
        try {
            const response = await fetch(`${API_BASE}/ids/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await response.json();
            
            if (data.success) {
                showToast('Status updated successfully', 'success');
                // Update local state to avoid full refetch
                setIds(prevIds => prevIds.map(item => 
                    item.id === id ? { ...item, status: newStatus } : item
                ));
            } else {
                showToast(data.error?.message || 'Failed to update status', 'error');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showToast('Failed to update status', 'error');
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
        { header: 'Code', accessor: 'code', sortable: true },
        { header: 'Year', accessor: 'year', sortable: true },
        { 
            header: 'Created At', 
            accessor: 'created_at', 
            sortable: true,
            render: (row) => new Date(row.created_at).toLocaleDateString() + ' ' + new Date(row.created_at).toLocaleTimeString()
        },
        { 
            header: 'Status', 
            accessor: 'status', 
            sortable: true,
            render: (row) => (
                <StatusBadge status={row.status === 'active' ? 'Active' : 'Using'} />
            )
        },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (row) => (
                row.status === 'active' ? (
                    <button 
                        className="btn-action btn-success"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to mark this ID as Using? This action cannot be reverted.')) {
                                toggleStatus(row.id, row.status);
                            }
                        }}
                        style={{ padding: '5px 10px', fontSize: '0.8rem', borderRadius: '4px', border: 'none', cursor: 'pointer', color: 'white', background: '#2ecc71' }}
                    >
                        Mark as Using
                    </button>
                ) : (
                    <span style={{ color: '#7f8c8d', fontStyle: 'italic', fontSize: '0.85rem' }}>
                        In Use (Locked)
                    </span>
                )
            )
        }
    ];

    return (
        <div className="page active" id="user-ids">
            <div className="page-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <i className="fas fa-id-card"></i>
                    <h2>User ID Management</h2>
                </div>
                <div className="header-actions">
                    <button 
                        className="btn-secondary" 
                        onClick={handleClearUnused}
                        disabled={clearing || loading}
                    >
                        <i className={`fas ${clearing ? 'fa-spinner fa-spin' : 'fa-trash-alt'}`}></i>
                        <span>{clearing ? 'Clearing...' : 'Clear Unused IDs'}</span>
                    </button>
                    <button 
                        className="btn-primary" 
                        onClick={handleGenerate}
                        disabled={generating || loading}
                    >
                        <i className={`fas ${generating ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
                        <span>{generating ? 'Generating...' : 'Generate 50 New IDs'}</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <button 
                    className={`tab-btn ${activeTab === 'farmer' ? 'active' : ''}`}
                    onClick={() => setActiveTab('farmer')}
                >
                    Farmers
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'instructor' ? 'active' : ''}`}
                    onClick={() => setActiveTab('instructor')}
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
                        placeholder="Search IDs..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <select 
                        className="filter-input"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="used">Using</option>
                    </select>
                </div>
            </div>

            {/* Results Info */}
            <div className="results-info">
                Showing <span className="results-count-badge">{filteredIds.length}</span> codes
                {(searchTerm || statusFilter !== 'all') && (
                    <button
                        className="clear-filters-btn"
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                        }}
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading IDs...</p>
                </div>
            ) : (
                <DataTable 
                    columns={columns}
                    data={filteredIds}
                    onRowClick={() => {}}
                    emptyMessage={`No IDs found. Generate some new ones!`}
                />
            )}
        </div>
    );
};

export default UserIdManagement;
