import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const FarmerDetailsModal = ({ isOpen, onClose, farmerId }) => {
    const [farmer, setFarmer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchDetails = async () => {
            if (!farmerId) return;
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/instructor/farmers/${farmerId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                
                if (isMounted) {
                    if (result.success) {
                        setFarmer(result.data);
                    } else {
                        setError(result.error?.message || 'Failed to fetch details');
                    }
                }
            } catch (err) {
                if (isMounted) {
                    console.error(err);
                    setError('An error occurred while fetching details');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (isOpen && farmerId) {
            fetchDetails();
        }

        return () => {
            isMounted = false;
        };
    }, [isOpen, farmerId]);

    if (!isOpen) return null;

    return (
        <div className="theme-instructor">
            <div className="instructor-modal" style={{ display: 'flex' }}>
                <div className="instructor-modal-content" style={{ maxWidth: '600px', width: '90%' }}>
                    <div className="instructor-modal-header">
                        <h3 className="instructor-modal-title">Farmer Details</h3>
                        <span className="instructor-close" onClick={onClose}>&times;</span>
                    </div>
                    
                    <div className="instructor-modal-body">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2em', color: 'var(--primary)' }}></i>
                                <p>Loading details...</p>
                            </div>
                        ) : error ? (
                            <div className="alert alert-error">{error}</div>
                        ) : farmer ? (
                            <div className="farmer-details-container">
                                {/* Header Profile Section */}
                                <div className="profile-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                                    <div className="avatar" style={{ 
                                        width: '80px', 
                                        height: '80px', 
                                        borderRadius: '50%', 
                                        backgroundColor: '#e0e0e0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2rem',
                                        color: '#757575',
                                        overflow: 'hidden'
                                    }}>
                                        {farmer.profilePicture ? (
                                            <img src={farmer.profilePicture} alt={farmer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <i className="fas fa-user"></i>
                                        )}
                                    </div>
                                    <div>
                                        <h2 style={{ margin: '0 0 5px 0', fontSize: '1.4rem' }}>{farmer.name}</h2>
                                        <div className="badge badge-success">Active</div>
                                        <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '5px' }}>ID: {farmer.displayId}</div>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                    <div className="info-item">
                                        <label style={{ display: 'block', color: '#666', fontSize: '0.85rem' }}>Email Address</label>
                                        <div style={{ fontWeight: '500' }}>{farmer.email}</div>
                                    </div>
                                    <div className="info-item">
                                        <label style={{ display: 'block', color: '#666', fontSize: '0.85rem' }}>Phone Number</label>
                                        <div style={{ fontWeight: '500' }}>{farmer.phone}</div>
                                    </div>
                                    <div className="info-item">
                                        <label style={{ display: 'block', color: '#666', fontSize: '0.85rem' }}>NIC</label>
                                        <div style={{ fontWeight: '500' }}>{farmer.nic || 'N/A'}</div>
                                    </div>
                                    <div className="info-item">
                                        <label style={{ display: 'block', color: '#666', fontSize: '0.85rem' }}>Joined Date</label>
                                        <div style={{ fontWeight: '500' }}>{new Date(farmer.joined).toLocaleDateString()}</div>
                                    </div>
                                    <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', color: '#666', fontSize: '0.85rem' }}>Primary Division (Residential)</label>
                                        <div style={{ fontWeight: '500' }}>{farmer.primaryDivision}</div>
                                    </div>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

                                {/* Location Section */}
                                <h4 style={{ marginBottom: '15px', color: 'var(--primary-dark)' }}>
                                    <i className="fas fa-map-marker-alt" style={{ marginRight: '8px' }}></i>
                                    Location & Land Details
                                </h4>

                                <div className="location-info" style={{ marginBottom: '15px', display: 'flex', gap: '20px' }}>
                                    <div>
                                        <span style={{color: '#666', fontSize: '0.9rem'}}>District:</span> <strong>{farmer.district}</strong>
                                    </div>
                                    <div>
                                        <span style={{color: '#666', fontSize: '0.9rem'}}>Zone:</span> <strong>{farmer.zone}</strong>
                                    </div>
                                </div>

                                {farmer.locations && farmer.locations.length > 0 && (
                                    <div className="land-locations">
                                        <label style={{ display: 'block', color: '#666', fontSize: '0.9rem', marginBottom: '8px' }}>Registered Lands:</label>
                                        <div className="locations-list" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
                                            {farmer.locations.map((loc, idx) => (
                                                <div key={idx} style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div>
                                                        <span style={{ color: '#888', marginRight: '5px' }}>
                                                            {loc.village ? `${loc.village} - ` : ''}
                                                        </span>
                                                        <strong>{loc.instructorDivision || loc.division}</strong>
                                                    </div>
                                                    {loc.isMain && <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Main</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                    
                    <div className="instructor-modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

FarmerDetailsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    farmerId: PropTypes.number
};

export default FarmerDetailsModal;