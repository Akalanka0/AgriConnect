import React from 'react';
import PropTypes from 'prop-types';

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
    if (!showForgotModal) return null;

    return (
        <div className="reset-modal-overlay" onClick={() => {
            if (!resetLoading) {
                setShowForgotModal(false);
                setResetStep('email');
                setResetEmail('');
                setResetEmailError('');
                setNewPasswordData({ password: '', confirmPassword: '' });
            }
        }}>
            <div className="reset-modal" onClick={(e) => e.stopPropagation()}>
                <div className={`reset-step-container ${resetStep}`}>
                    {resetStep === 'email' ? (
                        <div className="reset-step">
                            <h3>Reset Password</h3>
                            <p>Enter your registered email to receive reset instructions</p>
                            <div className="form-group">
                                <input
                                    type="email"
                                    placeholder="Enter your registered email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    className={resetEmailError ? 'error' : ''}
                                />
                                {resetEmailError && <div className="validation-message">{resetEmailError}</div>}
                            </div>
                            <div className="reset-sample-data">
                                <div className="sample-label"><i className="fas fa-lightbulb"></i> Sample Data</div>
                                <div className="sample-items">
                                    <div className="sample-item" onClick={() => setResetEmail('testuseragri@gmail.com')}>
                                        <span>Email:</span> testuseragri@gmail.com
                                    </div>
                                </div>
                            </div>
                            <div className="reset-modal-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => {
                                        setShowForgotModal(false);
                                        setResetEmail('');
                                        setResetStep('email');
                                    }}
                                    disabled={resetLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={handleResetPassword}
                                    disabled={resetLoading}
                                >
                                    {resetLoading ? 'Verifying...' : 'Continue'}
                                    {resetLoading && <div className="loading"></div>}
                                </button>
                            </div>
                        </div>
                    ) : resetStep === 'otp' ? (
                        <div className="reset-step">
                            <h3>Verify OTP</h3>
                            <p>Enter the 4-digit code sent to <strong>{resetEmail}</strong></p>
                            <div className="otp-input-group">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`otp-${index}`}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className={resetEmailError ? 'error' : ''}
                                    />
                                ))}
                            </div>
                            {resetEmailError && <div className="validation-message" style={{ textAlign: 'center', marginTop: '10px' }}>{resetEmailError}</div>}
                            <div className="reset-modal-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => setResetStep('email')}
                                    disabled={resetLoading}
                                >
                                    Back
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={handleVerifyOtp}
                                    disabled={resetLoading}
                                >
                                    {resetLoading ? 'Verifying...' : 'Verify Code'}
                                    {resetLoading && <div className="loading"></div>}
                                </button>
                            </div>
                            <div className="resend-otp">
                                Didn&apos;t receive code? <a onClick={handleResetPassword}>Resend OTP</a>
                            </div>
                        </div>
                    ) : (
                        <div className="reset-step">
                            <h3>Create New Password</h3>
                            <p>Please enter your new strong password for <strong>{resetEmail}</strong></p>
                            <div className="form-group">
                                <input
                                    type={showResetPassword.new ? 'text' : 'password'}
                                    placeholder="New Password"
                                    value={newPasswordData.password}
                                    onChange={(e) => setNewPasswordData({ ...newPasswordData, password: e.target.value })}
                                    className={resetEmailError && resetEmailError.includes('Password') ? 'error' : ''}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowResetPassword({ ...showResetPassword, new: !showResetPassword.new })}
                                >
                                    <i className={`fas fa-eye${showResetPassword.new ? '-slash' : ''}`}></i>
                                </button>
                            </div>
                            <div className="form-group">
                                <input
                                    type={showResetPassword.confirm ? 'text' : 'password'}
                                    placeholder="Confirm New Password"
                                    value={newPasswordData.confirmPassword}
                                    onChange={(e) => setNewPasswordData({ ...newPasswordData, confirmPassword: e.target.value })}
                                    className={resetEmailError && resetEmailError.includes('match') ? 'error' : ''}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowResetPassword({ ...showResetPassword, confirm: !showResetPassword.confirm })}
                                >
                                    <i className={`fas fa-eye${showResetPassword.confirm ? '-slash' : ''}`}></i>
                                </button>
                                {resetEmailError && <div className="validation-message">{resetEmailError}</div>}
                            </div>
                            <div className="reset-modal-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => setResetStep('email')}
                                    disabled={resetLoading}
                                >
                                    Back
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={handleUpdatePassword}
                                    disabled={resetLoading}
                                >
                                    {resetLoading ? 'Updating...' : 'Update Password'}
                                    {resetLoading && <div className="loading"></div>}
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
