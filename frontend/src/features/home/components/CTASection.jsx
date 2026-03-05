import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/Home.module.css';
import PropTypes from 'prop-types';

const CTASection = React.memo(({ onLoginClick, onRegisterClick }) => {
    const { t } = useTranslation('home');
    return (
    <section className={styles.cta} id="contact" aria-label="Call to action">
        <h2>{t('cta.title')}</h2>
        <p>{t('cta.desc')}</p>
        <div className={styles.ctaButtons}>
            <button
                className={`${styles.btn} ${styles.btnWhite}`}
                onClick={onLoginClick}
                type="button"
            >
                <i className="fas fa-right-to-bracket"></i>
                {t('cta.loginBtn')}
            </button>
            <button
                className={`${styles.btn} ${styles.btnOutline}`}
                onClick={onRegisterClick}
                type="button"
            >
                <i className="fas fa-user-plus"></i>
                {t('cta.registerBtn')}
            </button>
        </div>
    </section>
    );
});

CTASection.propTypes = {
    onLoginClick: PropTypes.func.isRequired,
    onRegisterClick: PropTypes.func.isRequired
};

CTASection.displayName = 'CTASection';

export default CTASection;
