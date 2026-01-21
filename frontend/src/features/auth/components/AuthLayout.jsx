import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children }) => {
    return (
        <div className="login-wrapper">
            {/* Left Panel */}
            <div className="left-panel">
                <Link to="/" className="logo">
                    <i className="fas fa-seedling"></i>
                    <div className="logo-text">AgriConnect</div>
                </Link>
                <h1>Efficient Farm Management Platform</h1>
                <p>Track crops, connect with instructors, and manage farm activities efficiently with our comprehensive platform.</p>
                <div className="feature-item">
                    <span className="feature-check">✓</span>
                    <span>Crop Planning and Reporting</span>
                </div>
                <div className="feature-item">
                    <span className="feature-check">✓</span>
                    <span>Expert guidance & support</span>
                </div>
                <div className="feature-item">
                    <span className="feature-check">✓</span>
                    <span>Weather alerts and updates</span>
                </div>
                <div className="feature-item">
                    <span className="feature-check">✓</span>
                    <span>Resource management tools</span>
                </div>
            </div>

            {/* Right Panel */}
            <div className="right-panel">
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;

AuthLayout.propTypes = {
    children: PropTypes.node.isRequired
};
