import PropTypes from 'prop-types';
import styles from '../styles/Login.module.css';
import { useTranslation } from 'react-i18next';

const ForgotPasswordModal = ({
    showForgotModal,
    setShowForgotModal,
    resetStep,
    setResetStep,
    resetEmail,
    setResetEmail,
    resetEmailError,
    setResetEmailError,
    resetLoading,
    otp,
    otpRefs,
    handleOtpChange,
    handleOtpKeyDown,
    handleResetPassword,
    handleVerifyOtp,
    handleUpdatePassword,
    newPasswordData,
    setNewPasswordData,
    showResetPassword,
    setShowResetPassword
}) => {
    const { t } = useTranslation('auth');
    if (!showForgotModal) return null;

    return (
        <div className={styles.resetModalOverlay} onClick={() => {
            if (!resetLoading) {
                setShowForgotModal(false);
                setResetStep('email');
                setResetEmail('');
                setResetEmailError('');
                setNewPasswordData({ password: '', confirmPassword: '' });
            }
        }}>
            <div className={styles.resetModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.resetStepContainer}>
                    {resetStep === 'email' ? (
                        <div className={styles.resetStep}>
                            <h3>{t('forgotPassword.title')}</h3>
                            <p>{t('forgotPassword.emailSubtitle')}</p>
                            <div className={styles.formGroup}>
                                <input
                                    type="email"
                                    placeholder={t('forgotPassword.emailPlaceholder')}
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    className={resetEmailError ? styles.error : ''}
                                />
                                {resetEmailError && <div className={styles.validationMessage}>{resetEmailError}</div>}
                            </div>
                            <div className={styles.resetSampleData}>
                                <div className={styles.sampleLabel}><i className="fas fa-lightbulb"></i> {t('forgotPassword.sampleLabel')}</div>
                                <div className={styles.sampleItems}>
                                    <div className={styles.sampleItem} onClick={() => setResetEmail('testuseragri@gmail.com')}>
                                        <span>Email:</span> testuseragri@gmail.com
                                    </div>
                                </div>
                            </div>
                            <div className={styles.resetModalActions}>
                                <button
                                    className={styles.btnSecondary}
                                    onClick={() => {
                                        setShowForgotModal(false);
                                        setResetEmail('');
                                        setResetStep('email');
                                    }}
                                    disabled={resetLoading}
                                >
                                    {t('forgotPassword.cancel')}
                                </button>
                                <button
                                    className={styles.btnPrimary}
                                    onClick={handleResetPassword}
                                    disabled={resetLoading}
                                >
                                    {resetLoading ? t('forgotPassword.verifying') : t('forgotPassword.continue')}
                                    {resetLoading && <div className={styles.loading}></div>}
                                </button>
                            </div>
                        </div>
                    ) : resetStep === 'otp' ? (
                        <div className={styles.resetStep}>
                            <h3>{t('forgotPassword.otpTitle')}</h3>
                            <p>{t('forgotPassword.otpSubtitle')} <strong>{resetEmail}</strong></p>
                            <div className={styles.otpInputGroup}>
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => otpRefs.current[index] = el}
                                        id={`otp-${index}`}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className={`${styles.otpInput} ${resetEmailError ? styles.error : ''}`}
                                        placeholder="0"
                                    />
                                ))}
                            </div>
                            {resetEmailError && <div className={styles.validationMessage} style={{ textAlign: 'center', marginTop: '10px' }}>{resetEmailError}</div>}
                            <div className={styles.resetModalActions}>
                                <button
                                    className={styles.btnSecondary}
                                    onClick={() => setResetStep('email')}
                                    disabled={resetLoading}
                                >
                                    {t('forgotPassword.back')}
                                </button>
                                <button
                                    className={styles.btnPrimary}
                                    onClick={handleVerifyOtp}
                                    disabled={resetLoading}
                                >
                                    {resetLoading ? t('forgotPassword.verifying') : t('forgotPassword.verifyCode')}
                                    {resetLoading && <div className={styles.loading}></div>}
                                </button>
                            </div>
                            <div className={styles.resendOtp}>
                                {t('forgotPassword.resendOtp')} <a onClick={handleResetPassword}>{t('forgotPassword.resendLink')}</a>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.resetStep}>
                            <h3>{t('forgotPassword.newPasswordTitle')}</h3>
                            <p>{t('forgotPassword.newPasswordSubtitle')} <strong>{resetEmail}</strong></p>
                            <div className={styles.formGroup}>
                                <input
                                    type={showResetPassword.new ? 'text' : 'password'}
                                    placeholder={t('forgotPassword.newPasswordPlaceholder')}
                                    value={newPasswordData.password}
                                    onChange={(e) => setNewPasswordData({ ...newPasswordData, password: e.target.value })}
                                    className={resetEmailError && resetEmailError.includes('Password') ? styles.error : ''}
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowResetPassword({ ...showResetPassword, new: !showResetPassword.new })}
                                >
                                    <i className={`fas fa-eye${showResetPassword.new ? '-slash' : ''}`}></i>
                                </button>
                            </div>
                            <div className={styles.formGroup}>
                                <input
                                    type={showResetPassword.confirm ? 'text' : 'password'}
                                    placeholder={t('forgotPassword.confirmPasswordPlaceholder')}
                                    value={newPasswordData.confirmPassword}
                                    onChange={(e) => setNewPasswordData({ ...newPasswordData, confirmPassword: e.target.value })}
                                    className={resetEmailError && resetEmailError.includes('match') ? styles.error : ''}
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowResetPassword({ ...showResetPassword, confirm: !showResetPassword.confirm })}
                                >
                                    <i className={`fas fa-eye${showResetPassword.confirm ? '-slash' : ''}`}></i>
                                </button>
                                {resetEmailError && <div className={styles.validationMessage}>{resetEmailError}</div>}
                            </div>
                            <div className={styles.resetModalActions}>
                                <button
                                    className={styles.btnSecondary}
                                    onClick={() => setResetStep('email')}
                                    disabled={resetLoading}
                                >
                                    {t('forgotPassword.back')}
                                </button>
                                <button
                                    className={styles.btnPrimary}
                                    onClick={handleUpdatePassword}
                                    disabled={resetLoading}
                                >
                                    {resetLoading ? t('forgotPassword.updating') : t('forgotPassword.updatePassword')}
                                    {resetLoading && <div className={styles.loading}></div>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

ForgotPasswordModal.propTypes = {
    showForgotModal: PropTypes.bool.isRequired,
    setShowForgotModal: PropTypes.func.isRequired,
    resetStep: PropTypes.string.isRequired,
    setResetStep: PropTypes.func.isRequired,
    resetEmail: PropTypes.string.isRequired,
    setResetEmail: PropTypes.func.isRequired,
    resetEmailError: PropTypes.string.isRequired,
    setResetEmailError: PropTypes.func.isRequired,
    resetLoading: PropTypes.bool.isRequired,
    otp: PropTypes.array.isRequired,
    otpRefs: PropTypes.object.isRequired,
    handleOtpChange: PropTypes.func.isRequired,
    handleOtpKeyDown: PropTypes.func.isRequired,
    handleResetPassword: PropTypes.func.isRequired,
    handleVerifyOtp: PropTypes.func.isRequired,
    handleUpdatePassword: PropTypes.func.isRequired,
    newPasswordData: PropTypes.object.isRequired,
    setNewPasswordData: PropTypes.func.isRequired,
    showResetPassword: PropTypes.object.isRequired,
    setShowResetPassword: PropTypes.func.isRequired
};

export default ForgotPasswordModal;
