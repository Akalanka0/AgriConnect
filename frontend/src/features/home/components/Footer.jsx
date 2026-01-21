import React from 'react';

const Footer = React.memo(() => (
    <footer className="footer" role="contentinfo">
        <div className="footer-content">
            <div className="footer-section">
                <h4>AgriConnect</h4>
                <p>Modern agriculture for better yields</p>
            </div>
            <div className="footer-section">
                <h4>Contact</h4>
                <p>info@agriconnect.gov.lk</p>
                <p>+94 25 222 2222</p>
            </div>
            <div className="footer-section">
                <h4>Department of Agriculture</h4>
                <p>Anuradhapura District</p>
            </div>
        </div>
        <div className="footer-bottom">
            <p>&copy; 2025 AgriConnect. All rights reserved.</p>
        </div>
    </footer>
));

Footer.displayName = 'Footer';

export default Footer;
