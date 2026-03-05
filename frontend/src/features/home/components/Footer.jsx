import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/Home.module.css';

const Footer = React.memo(() => {
    const { t } = useTranslation('home');
    return (
    <footer className={styles.footer} role="contentinfo">
        <div className={styles.footerContent}>
            <div className={styles.footerSection}>
                <h4>AgriConnect</h4>
                <p>{t('footer.tagline')}</p>
            </div>
            <div className={styles.footerSection}>
                <h4>{t('footer.contact')}</h4>
                <p>info@agriconnect.gov.lk</p>
                <p>+94 25 222 2222</p>
            </div>
            <div className={styles.footerSection}>
                <h4>{t('footer.dept')}</h4>
                <p>{t('footer.district')}</p>
            </div>
        </div>
        <div className={styles.footerBottom}>
            <p>&copy; {new Date().getFullYear()} AgriConnect. {t('footer.rights')}</p>
        </div>
    </footer>
    );
});

Footer.displayName = 'Footer';

export default Footer;
