import PropTypes from 'prop-types';
import styles from '../styles/Login.module.css';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AuthLayout = ({ children }) => {
    const { t } = useTranslation('auth');
    return (
        <div className={styles.loginWrapper}>
            {/* Left Panel */}
            <div className={styles.leftPanel}>
                <Link to="/" className={styles.logo}>
                    <i className="fas fa-seedling"></i>
                    <div className={styles.logoText}>AgriConnect</div>
                </Link>
                <h1>{t('authLayout.tagline')}</h1>
                <p>{t('authLayout.desc')}</p>
                <div className={styles.featureItem}>
                    <span className={styles.featureCheck}>✓</span>
                    <span>{t('authLayout.feat1')}</span>
                </div>
                <div className={styles.featureItem}>
                    <span className={styles.featureCheck}>✓</span>
                    <span>{t('authLayout.feat2')}</span>
                </div>
                <div className={styles.featureItem}>
                    <span className={styles.featureCheck}>✓</span>
                    <span>{t('authLayout.feat3')}</span>
                </div>
                <div className={styles.featureItem}>
                    <span className={styles.featureCheck}>✓</span>
                    <span>{t('authLayout.feat4')}</span>
                </div>
            </div>

            {/* Right Panel */}
            <div className={styles.rightPanel}>
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;

AuthLayout.propTypes = {
    children: PropTypes.node.isRequired
};
