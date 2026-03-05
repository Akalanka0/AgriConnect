import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import styles from '../styles/Home.module.css';

const HeroSection = React.memo(({ onLoginClick, onRegisterClick }) => {
    const { t } = useTranslation('home');
    return (
    <section className={styles.hero} aria-label="Hero section">
        <div className={styles.heroContent}>
            <h1>{t('hero.title')}</h1>
            <p>{t('hero.description')}</p>
            <div className={styles.ctaButtons}>
                <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={onLoginClick}
                    type="button"
                >
                    <i className="fas fa-right-to-bracket"></i>
                    {t('hero.loginBtn')}
                </button>
                <button
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    onClick={onRegisterClick}
                    type="button"
                >
                    <i className="fas fa-user-plus"></i>
                    {t('hero.registerBtn')}
                </button>
            </div>
        </div>
    </section>
    );
});

HeroSection.propTypes = {
    onLoginClick: PropTypes.func.isRequired,
    onRegisterClick: PropTypes.func.isRequired
};

HeroSection.displayName = 'HeroSection';

export default HeroSection;
