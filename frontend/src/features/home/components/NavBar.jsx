import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const NavBar = React.memo(({ menuOpen, onMenuToggle, onNavigate }) => (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="nav-container">
            <Link to="/" className="logo" aria-label="AgriConnect home">
                <i className="fas fa-seedling" aria-hidden="true"></i>
                <span>AgriConnect</span>
            </Link>

            <button
                className="menu-toggle"
                onClick={onMenuToggle}
                aria-label="Toggle mobile menu"
                aria-expanded={menuOpen}
                type="button"
            >
                <i className="fas fa-bars" aria-hidden="true"></i>
            </button>

            <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
                <a href="#features" onClick={onMenuToggle}>Features</a>
                <a href="#stakeholders" onClick={onMenuToggle}>Stakeholders</a>
                <a href="#contact" onClick={onMenuToggle}>Contact</a>
                <button
                    className="btn-login"
                    onClick={onNavigate}
                    type="button"
                >
                    Login
                </button>
            </div>
        </div>
    </nav>
));

NavBar.propTypes = {
    menuOpen: PropTypes.bool.isRequired,
    onMenuToggle: PropTypes.func.isRequired,
    onNavigate: PropTypes.func.isRequired
};

NavBar.displayName = 'NavBar';

export default NavBar;
