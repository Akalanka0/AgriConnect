import React from 'react';
import { useOutletContext } from 'react-router-dom';

const FarmerManagement = () => {
    const { openModal } = useOutletContext();

    return (
        <>
            <div className="page-title">
                <i className="fas fa-users"></i>
                <h2>Farmer Management</h2>
            </div>

            <div className="card">
                <div className="table-header">
                    <div>Farmer List</div>
                    <button className="btn btn-primary" onClick={() => openModal('addFarmer')}>
                        <i className="fas fa-plus"></i> Add Farmer
                    </button>
                </div>
                <div className="table-content">
                    <table>
                        <thead>
                            <tr>
                                <th>Farmer ID</th>
                                <th>Name</th>
                                <th>Location</th>
                                <th>Crops</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>FARM001</td>
                                <td>Sunil Perera</td>
                                <td>Thalawa</td>
                                <td>Rice, Vegetables</td>
                                <td>
                                    <button className="btn btn-primary" style={{ padding: '5px 10px' }}>View</button>
                                    <button className="btn btn-secondary" style={{ padding: '5px 10px' }}>Edit</button>
                                </td>
                            </tr>
                            {/* More rows... */}
                        </tbody>
                    </table>
                </div>
                <div style={{ textAlign: 'center', padding: '15px', borderTop: '1px solid #eee' }}>
                    <button className="btn btn-secondary" onClick={() => alert('Loading more farmers...')}>
                        <i className="fas fa-chevron-down"></i> Show More
                    </button>
                </div>
            </div>
        </>
    );
};

export default FarmerManagement;
