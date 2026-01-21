import React from 'react';

const Engagement = () => {
    const instructorEngagement = [
        {
            id: 'INST001',
            name: 'Rohan Silva',
            farmersCount: 600
        },
        // ... more mock data
    ];

    return (
        <div className="page active" id="engagement">
            <div className="page-title">
                <i className="fas fa-handshake"></i>
                <h2>Instructor-Farmer Engagement</h2>
            </div>

            <div className="cards-grid">
                {instructorEngagement.map((instructor) => (
                    <div className="card" key={instructor.id}>
                        <div className="card-header">
                            <div className="card-title">{instructor.name} <span className="user-id">({instructor.id})</span></div>
                            <div className="card-icon"><i className="fas fa-chalkboard-teacher"></i></div>
                        </div>
                        <div className="card-content">
                            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                <div className="engagement-value">{instructor.farmersCount}</div>
                                <div className="engagement-label">Farmers Assigned</div>
                            </div>
                            {/* Farmer list rendering */}
                        </div>
                    </div>
                ))}
            </div>
            <div className="engagement-stats" style={{ marginTop: '30px', padding: '20px', background: 'white', borderRadius: 'var(--border-radius)', boxShadow: 'var(--shadow)', textAlign: 'center' }}>
                <div className="engagement-card" style={{ display: 'inline-block', padding: '15px 30px' }}>
                    <div className="engagement-value" style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--primary)' }}>58</div>
                    <div className="engagement-label" style={{ color: 'var(--gray)', marginBottom: '15px' }}>Total Instructors</div>
                    <div className="engagement-value" style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--primary)' }}>6480</div>
                    <div className="engagement-label" style={{ color: 'var(--gray)' }}>Total Farmers</div>
                </div>
            </div>
        </div>
    );
};

export default Engagement;
