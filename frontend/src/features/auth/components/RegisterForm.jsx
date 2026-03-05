import PropTypes from 'prop-types';
import styles from '../styles/Login.module.css';
import { useTranslation } from 'react-i18next';

const RegisterForm = ({
    role,
    setRole,
    registerData,
    setRegisterData,
    handleRegisterSubmit,
    errors,
    showPassword,
    setShowPassword,
    passwordStrength,
    setPasswordStrength,
    checkPasswordStrength,
    loading,
    setIsLogin
}) => {
    const { t } = useTranslation('auth');
    // Demo data autofill function
    const fillDemoData = () => {
        const demoData = {
            fullName: role === 'farmer' ? 'Demo Farmer' : 'Demo Instructor',
            email: 'testuseragri@gmail.com',
            password: 'demo12345',
            confirmPassword: 'demo12345',
            nic: role === 'farmer' ? '123456789V' : '987654321V',
            phone: role === 'farmer' ? '0712345678' : '0718765432',
        };

        const farmerIds = ['FARM-2025-0001'];
        const instructorIds = ['INST-2026-0001'];

        if (role === 'farmer') {
            demoData.farmerId = farmerIds[0];
        } else if (role === 'instructor') {
            demoData.instructorId = instructorIds[0];
        }

        setRegisterData(demoData);
        setPasswordStrength(checkPasswordStrength('demo12345'));
    };

    return (
        <div>
            <div className={styles.loginHeader}>
                <h2>{t('register.title')}</h2>
            </div>
            <form onSubmit={handleRegisterSubmit}>
                <div className={styles.roleSelector}>
                    <button
                        type="button"
                        className={`${styles.roleBtn} ${styles.farmerBtn} ${role === 'farmer' ? styles.active : ''}`}
                        onClick={() => setRole('farmer')}
                    >
                        <i className="fas fa-seedling"></i>
                        <div>{t('register.farmer')}</div>
                    </button>
                    <button
                        type="button"
                        className={`${styles.roleBtn} ${styles.instructorBtn} ${role === 'instructor' ? styles.active : ''}`}
                        onClick={() => setRole('instructor')}
                    >
                        <i className="fas fa-chalkboard-teacher"></i>
                        <div>{t('register.instructor')}</div>
                    </button>
                </div>

                <div className={`${styles.formGroup} ${errors.fullName ? styles.error : ''}`}>
                    <input
                        type="text"
                        value={registerData.fullName}
                        onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                        placeholder={t('register.fullName')}
                    />
                    {errors.fullName && <div className={styles.validationMessage}>{errors.fullName}</div>}
                </div>

                <div className={`${styles.formGroup} ${errors.email ? styles.error : ''}`}>
                    <input
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        placeholder={t('register.email')}
                    />
                    {errors.email && <div className={styles.validationMessage}>{errors.email}</div>}
                </div>

                <div className={`${styles.formGroup} ${errors.nic ? styles.error : ''}`}>
                    <input
                        type="text"
                        value={registerData.nic}
                        onChange={(e) => setRegisterData({ ...registerData, nic: e.target.value })}
                        placeholder={t('register.nic')}
                    />
                    {errors.nic && <div className={styles.validationMessage}>{errors.nic}</div>}
                </div>

                <div className={`${styles.formGroup} ${errors.phone ? styles.error : ''}`}>
                    <input
                        type="tel"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                        placeholder={t('register.phone')}
                    />
                    {errors.phone && <div className={styles.validationMessage}>{errors.phone}</div>}
                </div>

                {role === 'farmer' && (
                    <>
                        <div className={`${styles.formGroup} ${errors.farmerId ? styles.error : ''}`}>
                            <input
                                type="text"
                                value={registerData.farmerId}
                                onChange={(e) => setRegisterData({ ...registerData, farmerId: e.target.value })}
                                placeholder={t('register.farmerId')}
                            />
                            {errors.farmerId && <div className={styles.validationMessage}>{errors.farmerId}</div>}
                            <div className={styles.infoText}>{t('register.idNote')}</div>
                        </div>
                    </>
                )}

                {role === 'instructor' && (
                    <div className={`${styles.formGroup} ${errors.instructorId ? styles.error : ''}`}>
                        <input
                            type="text"
                            value={registerData.instructorId}
                            onChange={(e) => setRegisterData({ ...registerData, instructorId: e.target.value })}
                            placeholder={t('register.instructorId')}
                        />
                        {errors.instructorId && <div className={styles.validationMessage}>{errors.instructorId}</div>}
                        <div className={styles.infoText}>{t('register.idNote')}</div>
                    </div>
                )}

                <div className={`${styles.formGroup} ${errors.password ? styles.error : ''}`}>
                    <input
                        type={showPassword.register ? 'text' : 'password'}
                        value={registerData.password}
                        onChange={(e) => {
                            setRegisterData({ ...registerData, password: e.target.value });
                            setPasswordStrength(checkPasswordStrength(e.target.value));
                        }}
                        placeholder={t('register.password')}
                    />
                    <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword({ ...showPassword, register: !showPassword.register })}
                    >
                        <i className={`fas fa-eye${showPassword.register ? '-slash' : ''}`}></i>
                    </button>
                    <div className={`${styles.passwordStrength} ${passwordStrength}`}>
                        <div className={styles.passwordStrengthBar}></div>
                    </div>
                    {errors.password && <div className={styles.validationMessage}>{errors.password}</div>}
                </div>

                <div className={`${styles.formGroup} ${errors.confirmPassword ? styles.error : ''}`}>
                    <input
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        placeholder={t('register.confirmPassword')}
                    />
                    <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                    >
                        <i className={`fas fa-eye${showPassword.confirm ? '-slash' : ''}`}></i>
                    </button>
                    {errors.confirmPassword && <div className={styles.validationMessage}>{errors.confirmPassword}</div>}
                </div>

                <button type="submit" className={styles.actionBtn} disabled={loading}>
                    <span>{loading ? t('register.creating') : t('register.createAccount')}</span>
                    {loading && <div className={styles.loading}></div>}
                </button>

                {/* Quick Demo Button */}
                <button
                    type="button"
                    className={styles.demoBtn}
                    onClick={fillDemoData}
                    disabled={loading}
                >
                    <i className="fas fa-wand-magic-sparkles"></i>
                    {role === 'farmer' ? t('register.quickDemoFarmer') : t('register.quickDemoInstructor')}
                </button>

                <div className={styles.switchForm}>
                    <p>{t('register.haveAccount')} <a onClick={() => setIsLogin(true)}>{t('register.signIn')}</a></p>
                </div>
            </form>
        </div>
    );
};

RegisterForm.propTypes = {
    role: PropTypes.string.isRequired,
    setRole: PropTypes.func.isRequired,
    registerData: PropTypes.object.isRequired,
    setRegisterData: PropTypes.func.isRequired,
    handleRegisterSubmit: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
    showPassword: PropTypes.object.isRequired,
    setShowPassword: PropTypes.func.isRequired,
    passwordStrength: PropTypes.string.isRequired,
    setPasswordStrength: PropTypes.func.isRequired,
    checkPasswordStrength: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    setIsLogin: PropTypes.func.isRequired
};

export default RegisterForm;
