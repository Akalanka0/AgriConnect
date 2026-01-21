import React from 'react';

const PestReports = () => {
    return (
        <>
            <div className="page-title">
                <i className="fas fa-bug"></i>
                <h2>Pest & Disease Management</h2>
            </div>

            {/* Active Issues Card */}
            <div className="card" style={{ marginBottom: '30px' }}>
                <div className="table-header">
                    <div>Active Pest & Disease Issues</div>
                </div>
                <div className="table-content">
                    <table>
                        <thead>
                            <tr>
                                <th>Farmer Name</th>
                                <th>Location</th>
                                <th>Reported Date</th>
                                <th>Severity</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Sunil Perera</td>
                                <td>Thalawa</td>
                                <td>2025-10-15</td>
                                <td><span className="status-badge status-urgent">High</span></td>
                                <td>
                                    <button className="btn btn-primary" style={{ padding: '5px 10px' }}>View</button>
                                </td>
                            </tr>
                            {/* More rows... */}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reviewed Issues Card */}
            <div className="card" style={{ marginBottom: '30px' }}>
                <div className="table-header">
                    <div>Reviewed Pest & Disease Issues</div>
                </div>
                <div className="table-content">
                    <table>
                        <thead>
                            <tr>
                                <th>Farmer Name</th>
                                <th>Location</th>
                                <th>Reported Date</th>
                                <th>Severity</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Chaminda Silva</td>
                                <td>Kebithigollewa</td>
                                <td>2025-10-10</td>
                                <td><span className="status-badge status-pending">Medium</span></td>
                                <td><span className="status-badge status-completed">Resolved</span></td>
                                <td>
                                    <button className="btn btn-primary" style={{ padding: '5px 10px' }}>View</button>
                                </td>
                            </tr>
                            {/* More rows... */}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Reports Card */}
            <div className="cards-grid">
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Recent Pest Reports</div>
                        <div className="card-icon"><i className="fas fa-history"></i></div>
                    </div>
                    <div className="card-content">
                        <ul className="card-list">
                            <li>
                                <div>Sunil Perera - Thalawa</div>
                                <span>Today</span>
                            </li>
                            <li>
                                <div>Kamala Fernando - Tambuttegama</div>
                                <span>1 day ago</span>
                            </li>
                            <li>
                                <div>Nimal Rajapaksa - Padaviya</div>
                                <span>2 days ago</span>
                            </li>
                            <li>
                                <div>Saman Kumara - Anuradhapura Town</div>
                                <span>3 days ago</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PestReports;
