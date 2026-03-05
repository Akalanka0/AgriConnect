import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import styles from '../styles/Home.module.css';

const NavBar = React.memo(({ menuOpen, onMenuToggle, onNavigate }) => {
    const { t } = useTranslation('home');
    return (
    <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
        <div className={styles.navContainer}>
            <Link to="/" className={styles.logo} aria-label="AgriConnect home">
                <i className="fas fa-seedling" aria-hidden="true"></i>
                <span>AgriConnect</span>
            </Link>

            <button
                className={styles.menuToggle}
                onClick={onMenuToggle}
                aria-label="Toggle mobile menu"
                aria-expanded={menuOpen}
                type="button"
            >
                <i className="fas fa-bars" aria-hidden="true"></i>
            </button>

            <div className={`${styles.navMenu} ${menuOpen ? styles.open : ''}`}>
                <a href="#features" onClick={onMenuToggle}>{t('nav.features')}</a>
                <a href="#stakeholders" onClick={onMenuToggle}>{t('nav.stakeholders')}</a>
                <a href="#contact" onClick={onMenuToggle}>{t('nav.contact')}</a>
                <button
                    className={styles.btnLogin}
                    onClick={onNavigate}
                    type="button"
                >
                    {t('nav.login')}
                </button>
                <LanguageSwitcher />
            </div>
        </div>
    </nav>
    );
});

NavBar.propTypes = {
    menuOpen: PropTypes.bool.isRequired,
    onMenuToggle: PropTypes.func.isRequired,
    onNavigate: PropTypes.func.isRequired
};

NavBar.displayName = 'NavBar';

export default NavBar;
