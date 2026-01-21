import React from 'react';

const UserManagement = () => {
    const farmers = [
        { id: 'FARM001', name: 'Sunil Perera', email: 'sunil@example.com' },
        { id: 'FARM002', name: 'Kamala Fernando', email: 'kamala@example.com' },
        { id: 'FARM003', name: 'Nimal Rathnayake', email: 'nimal@example.com' }
    ];

    const instructors = [
        { id: 'INST001', name: 'Rohan Silva', email: 'rohan@example.com' },
        { id: 'INST002', name: 'Priya Bandara', email: 'priya@example.com' },
        { id: 'INST003', name: 'Anura Wickramasinghe', email: 'anura@example.com' }
    ];

    return (
        <div className="page active" id="users">
            <div className="page-title">
                <i className="fas fa-users"></i>
                <h2>User Management</h2>
            </div>

            <div className="card" style={{ marginBottom: '30px' }}>
                <div className="card-header">
                    <div className="card-title">Farmers Management</div>
                    <div className="card-icon"><i className="fas fa-user"></i></div>
                </div>
                <div className="card-content">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Farmer ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {farmers.map((farmer) => (
                                    <tr key={farmer.id}>
                                        <td>{farmer.id}</td>
                                        <td>{farmer.name}</td>
                                        <td>{farmer.email}</td>
                                        <td>
                                            <button className="btn btn-primary btn-sm">View Details</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title">Instructors Management</div>
                    <div className="card-icon"><i className="fas fa-chalkboard-teacher"></i></div>
                </div>
                <div className="card-content">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Instructor ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {instructors.map((instructor) => (
                                    <tr key={instructor.id}>
                                        <td>{instructor.id}</td>
                                        <td>{instructor.name}</td>
                                        <td>{instructor.email}</td>
                                        <td>
                                            <button className="btn btn-primary btn-sm">View Details</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
