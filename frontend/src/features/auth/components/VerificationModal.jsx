import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from '../styles/Login.module.css';
import { useTranslation } from 'react-i18next';

const VerificationModal = ({
    showVerificationModal,
    setShowVerificationModal,
    verificationEmail = ''
}) => {
    const { t } = useTranslation('auth');
    const [email, setEmail] = useState(verificationEmail);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const otpRefs = useRef([]);

    useEffect(() => {
        if (verificationEmail) {
            setEmail(verificationEmail);
            sendOtp(verificationEmail);
        }
    }, [verificationEmail, showVerificationModal]);

    const sendOtp = async (targetEmail) => {
        const effectiveEmail = (targetEmail ?? email).trim();
        if (!effectiveEmail) {
            setMessage('Please enter your email address.');
            return;
        }

        setSending(true);
        setMessage('');
        try {
            const response = await fetch('/api/auth/send-email-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: effectiveEmail })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data?.error?.message || 'Failed to send verification code');
            }

            if (data.demo) {
                setMessage('Verification code sent to your email');
            } else {
                setMessage(data.message || 'Verification code sent to your email');
            }
        } catch (err) {
            setMessage(err.message || 'Failed to send verification code');
        } finally {
            setSending(false);
        }
    };

    const verifyOtp = async () => {
        const enteredOtp = otp.join('');
        if (!email.trim()) {
            setMessage('Please enter your email address.');
            return;
        }
        if (enteredOtp.length < 6) {
            setMessage('Please enter the 6-digit verification code.');
            return;
        }

        setLoading(true);
        setMessage('');
        try {
            const response = await fetch('/api/auth/verify-email-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, otp: enteredOtp })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data?.error?.message || 'Verification failed');
            }

            setMessage('Email verified successfully! You can now log in.');
            setTimeout(() => {
                setShowVerificationModal(false);
            }, 1500);
        } catch (err) {
            setMessage(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const next = [...otp];
        next[index] = value.substring(value.length - 1);
        setOtp(next);

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    if (!showVerificationModal) return null;

    return (
        <div className={styles.resetModalOverlay} onClick={() => {
            if (!loading && !sending) {
                setShowVerificationModal(false);
                setOtp(['', '', '', '', '', '']);
                setEmail(verificationEmail);
                setMessage('');
            }
        }}>
            <div className={styles.verificationModalContent} onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className={styles.verificationModalHeader}>
                    <button
                        type="button"
                        className={styles.modalCloseBtn}
                        onClick={() => {
                            if (!loading && !sending) {
                                setShowVerificationModal(false);
                                setOtp(['', '', '', '', '', '']);
                                setEmail(verificationEmail);
                                setMessage('');
                            }
                        }}
                        disabled={loading || sending}
                        title="Close"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                    <h3>{t('verification.title')}</h3>
                    <p>{t('verification.subtitle')}</p>
                </div>

                {/* Status Message */}
                {message && (
                    <div className={`${styles.messageBox} ${message.includes('successfully') ? styles.successMessage : styles.infoMessage}`}>
                        <i className={`fas ${message.includes('successfully') ? 'fa-circle-check' : 'fa-circle-info'}`}></i>
                        {message}
                    </div>
                )}

                <div className={styles.verificationModalBody}>
                    {/* Email Section */}
                    <div className={styles.formGroup}>
                        <label><i className="fas fa-envelope"></i> {t('verification.emailLabel')}</label>
                        <input
                            type="email"
                            placeholder={t('verification.emailPlaceholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* OTP Section */}
                    <div className={styles.verificationOtpSection}>
                        <label><i className="fas fa-key"></i> {t('verification.verificationCode')}</label>
                        <p className={styles.otpDescription}>{t('verification.codeDescription')}</p>
                        
                        <div className={styles.otpInputGroup}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => otpRefs.current[index] = el}
                                    id={`verification-otp-${index}`}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    placeholder="0"
                                    className={styles.otpInput}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.verificationModalActions}>
                        <button
                            className={styles.actionBtn}
                            onClick={verifyOtp}
                            disabled={loading}
                        >
                            {loading ? t('verification.verifying') : t('verification.verifyEmail')}
                        </button>
                        <button
                            className={styles.verificationResendBtn}
                            onClick={() => sendOtp(email)}
                            disabled={sending}
                        >
                            {sending ? t('verification.resending') : t('verification.resendCode')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

VerificationModal.propTypes = {
    showVerificationModal: PropTypes.bool.isRequired,
    setShowVerificationModal: PropTypes.func.isRequired,
    verificationEmail: PropTypes.string
};

export default VerificationModal;
