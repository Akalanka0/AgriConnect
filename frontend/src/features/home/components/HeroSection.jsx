import React from 'react';
import PropTypes from 'prop-types';

const HeroSection = React.memo(({ onLoginClick, onRegisterClick }) => (
    <section className="hero" aria-label="Hero section">
        <div className="hero-content">
            <h1>Empowering Smart Agriculture in Sri Lanka</h1>
            <p>AgriConnect is a centralized Agriculture Management System developed to enhance coordination between farmers, agricultural instructors, and administrators under the Department of Agriculture, Anuradhapura District.</p>
            <div className="cta-buttons">
                <button
                    className="btn btn-primary"
                    onClick={onLoginClick}
                    type="button"
                >
                    <i className="fas fa-sign-in-alt"></i>
                    Login
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={onRegisterClick}
                    type="button"
                >
                    <i className="fas fa-user-plus"></i>
                    Register
                </button>
            </div>
        </div>
    </section>
));

HeroSection.propTypes = {
    onLoginClick: PropTypes.func.isRequired,
    onRegisterClick: PropTypes.func.isRequired
};

HeroSection.displayName = 'HeroSection';

export default HeroSection;
