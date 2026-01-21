import React from 'react';
import PropTypes from 'prop-types';

const CTASection = React.memo(({ onLoginClick, onRegisterClick }) => (
    <section className="cta" id="contact" aria-label="Call to action">
        <h2>Join the Digital Agriculture Revolution</h2>
        <p>Ready to get started? Create your account today and join our growing community of agricultural professionals.</p>
        <div className="cta-buttons">
            <button
                className="btn btn-white"
                onClick={onLoginClick}
                type="button"
            >
                <i className="fas fa-sign-in-alt"></i>
                Login
            </button>
            <button
                className="btn btn-outline"
                onClick={onRegisterClick}
                type="button"
            >
                <i className="fas fa-user-plus"></i>
                Register Now
            </button>
        </div>
    </section>
));

CTASection.propTypes = {
    onLoginClick: PropTypes.func.isRequired,
    onRegisterClick: PropTypes.func.isRequired
};

CTASection.displayName = 'CTASection';

export default CTASection;
