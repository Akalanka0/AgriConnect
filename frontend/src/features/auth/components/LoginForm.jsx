import PropTypes from 'prop-types';
import styles from '../styles/Login.module.css';
import { useTranslation } from 'react-i18next';

const LoginForm = ({
    loginData,
    setLoginData,
    handleLoginSubmit,
    errors,
    showPassword,
    setShowPassword,
    loading,
    setIsLogin,
    setShowForgotModal,
    fillCredentials
}) => {
    const { t } = useTranslation('auth');
    return (
        <div>
            <div className={styles.loginHeader}>
                <h2>{t('login.title')}</h2>
                <p>{t('login.subtitle')}</p>
            </div>
            <form onSubmit={handleLoginSubmit}>
                <div className={`${styles.formGroup} ${errors.username ? styles.error : ''}`}>
                    <input
                        type="text"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        placeholder={t('login.emailOrPhone')}
                    />
                    {errors.username && <div className={styles.validationMessage}>{errors.username}</div>}
                </div>
                <div className={`${styles.formGroup} ${errors.password ? styles.error : ''}`}>
                    <input
                        type={showPassword.login ? 'text' : 'password'}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder={t('login.password')}
                    />
                    <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword({ ...showPassword, login: !showPassword.login })}
                    >
                        <i className={`fas fa-eye${showPassword.login ? '-slash' : ''}`}></i>
                    </button>
                    {errors.password && <div className={styles.validationMessage}>{errors.password}</div>}
                </div>
                <div className={styles.rememberMe}>
                    <input
                        type="checkbox"
                        id="rememberMe"
                        checked={loginData.rememberMe}
                        onChange={(e) => setLoginData({ ...loginData, rememberMe: e.target.checked })}
                    />
                    <label htmlFor="rememberMe">{t('login.rememberMe')}</label>
                </div>
                <div className={styles.forgotPassword}>
                    <a onClick={() => setShowForgotModal(true)}>{t('login.forgotPassword')}</a>
                </div>
                <button type="submit" className={styles.actionBtn} disabled={loading}>
                    <span>{loading ? t('login.signingIn') : t('login.signIn')}</span>
                    {loading && <div className={styles.loading}></div>}
                </button>
                <div className={styles.switchForm}>
                    <p>{t('login.noAccount')} <a onClick={() => setIsLogin(false)}>{t('login.registerNow')}</a></p>
                </div>
            </form>
            {/* DEMO PANEL — remove for client delivery or set VITE_DEMO_MODE=false */}
            {import.meta.env.VITE_DEMO_MODE === 'true' && (
                <div className={styles.demoAccounts}>
                    <h3><i className="fas fa-lightbulb"></i> {t('demo.title')}</h3>
                    <div className={styles.demoAccount}>
                        <div><span>{t('demo.farmer')}</span> farmer@example.com / farmer123</div>
                        <button className={styles.copyBtn} onClick={() => fillCredentials('farmer@example.com', 'farmer123')} title="Auto-fill credentials">
                            <i className="fas fa-user-check"></i>
                        </button>
                    </div>
                    <div className={styles.demoAccount}>
                        <div><span>{t('demo.instructor')}</span> instructor@example.com / instructor123</div>
                        <button className={styles.copyBtn} onClick={() => fillCredentials('instructor@example.com', 'instructor123')} title="Auto-fill credentials">
                            <i className="fas fa-user-check"></i>
                        </button>
                    </div>
                    <div className={styles.demoAccount}>
                        <div><span>{t('demo.admin')}</span> admin@agriconnect.lk / admin123</div>
                        <button className={styles.copyBtn} onClick={() => fillCredentials('admin@agriconnect.lk', 'admin123')} title="Auto-fill credentials">
                            <i className="fas fa-user-check"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

LoginForm.propTypes = {
    loginData: PropTypes.object.isRequired,
    setLoginData: PropTypes.func.isRequired,
    handleLoginSubmit: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
    showPassword: PropTypes.object.isRequired,
    setShowPassword: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    setIsLogin: PropTypes.func.isRequired,
    setShowForgotModal: PropTypes.func.isRequired,
    fillCredentials: PropTypes.func.isRequired
};

export default LoginForm;
