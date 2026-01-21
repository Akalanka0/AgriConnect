import React from 'react';

const CropPlanReview = () => {
    return (
        <>
            <div className="page-title">
                <i className="fas fa-clipboard-list"></i>
                <h2>Crop Plan Management</h2>
            </div>

            {/* Pending Reviews Card */}
            <div className="card" style={{ marginBottom: '30px' }}>
                <div className="table-header">
                    <div>Pending Reviews</div>
                    <button className="btn btn-primary">
                        <i className="fas fa-download"></i> Export Plans
                    </button>
                </div>
                <div className="table-content">
                    <table>
                        <thead>
                            <tr>
                                <th>Plan Name</th>
                                <th>Farmer</th>
                                <th>Crop Type</th>
                                <th>Submitted Date</th>
                                <th>Days Pending</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Vegetable Garden Plan</td>
                                <td>Saman Kumara</td>
                                <td>Vegetables</td>
                                <td>2025-10-14</td>
                                <td>1 day</td>
                                <td><span className="status-badge status-pending">Review</span></td>
                                <td>
                                    <button className="btn btn-primary" style={{ padding: '5px 10px' }}>View</button>
                                </td>
                            </tr>
                            {/* More rows... */}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Approved Plans Card */}
            <div className="card" style={{ marginBottom: '30px' }}>
                <div className="table-header">
                    <div>Approved Crop Plans</div>
                    <button className="btn btn-primary">
                        <i className="fas fa-download"></i> Export Plans
                    </button>
                </div>
                <div className="table-content">
                    <table>
                        <thead>
                            <tr>
                                <th>Plan Name</th>
                                <th>Farmer</th>
                                <th>Crop Type</th>
                                <th>Approval Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Vegetable Rotation Plan</td>
                                <td>Kamala Fernando</td>
                                <td>Vegetables</td>
                                <td>2025-10-10</td>
                                <td><span className="status-badge status-completed">Approved</span></td>
                                <td>
                                    <button className="btn btn-primary" style={{ padding: '5px 10px' }}>View</button>
                                </td>
                            </tr>
                            {/* More rows... */}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Analytics Card */}
            <div className="cards-grid">
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Plan Analytics</div>
                        <div className="card-icon"><i className="fas fa-chart-pie"></i></div>
                    </div>
                    <div className="card-content">
                        <ul className="card-list">
                            <li>Total Plans <span>24</span></li>
                            <li>Approval Rate <span>78%</span></li>
                            <li>Avg. Review Time <span>2.3 days</span></li>
                            <li>Pending Reviews <span>8</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CropPlanReview;
