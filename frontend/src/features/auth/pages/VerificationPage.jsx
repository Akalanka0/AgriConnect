import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from '../styles/VerificationPage.module.css';
import { useTranslation } from 'react-i18next';

const VerificationPage = () => {
    const { t } = useTranslation('auth');
    const location = useLocation();
    const navigate = useNavigate();

    const queryEmail = new URLSearchParams(location.search).get('email') || '';

    const [email, setEmail] = useState(() => {
        return queryEmail;
    });
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const otpRefs = useRef([]);

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

            // For demo accounts, show a professional message without exposing OTP
            if (data.demo) {
                setMessage('Verification code sent to your email (Demo Account)');
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
                navigate('/login');
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

    useEffect(() => {
        if (queryEmail) {
            sendOtp(queryEmail);
        }
    }, [queryEmail]);

    return (
        <div className={styles.verificationContainer}>
            <div className={styles.verificationCard}>
                {/* Header Section */}
                <div className={styles.verificationHeader}>
                    <div className={styles.verificationIcon}>
                        <i className="fas fa-envelope-open-text"></i>
                    </div>
                    <h2>{t('verificationPage.title')}</h2>
                    <p>{t('verificationPage.subtitle')}</p>
                </div>

                {/* Status Message */}
                {message && (
                    <div className={`${styles.messageBox} ${message.includes('Demo Account') ? styles.demoMessage : message.includes('successfully') ? styles.successMessage : styles.infoMessage}`}>
                        <i className={`fas ${message.includes('Demo Account') ? 'fa-wand-magic-sparkles' : message.includes('successfully') ? 'fa-circle-check' : 'fa-circle-info'}`}></i>
                        {message}
                    </div>
                )}

                {/* Email Section */}
                <div className={styles.emailSection}>
                    <label className={styles.sectionLabel}>
                        <i className="fas fa-envelope"></i>
                        {t('verificationPage.emailLabel')}
                    </label>
                    <div className={styles.inputGroup}>
                        <input
                            type="email"
                            placeholder={t('verificationPage.emailPlaceholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.emailInput}
                        />
                        <div className={styles.inputIcon}>
                            <i className="fas fa-envelope"></i>
                        </div>
                    </div>
                </div>

                {/* OTP Section */}
                <div className={styles.otpSection}>
                    <label className={styles.sectionLabel}>
                        <i className="fas fa-key"></i>
                        {t('verificationPage.verificationCode')}
                    </label>
                    <p className={styles.sectionDescription}>{t('verificationPage.codeDescription')}</p>

                    <div className={styles.otpInputsContainer}>
                        {otp.map((digit, index) => (
                            <div key={index} className={styles.otpInputWrapper}>
                                <input
                                    ref={el => otpRefs.current[index] = el}
                                    id={`email-otp-${index}`}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    className={styles.otpInput}
                                    placeholder="0"
                                />
                                <div className={styles.otpInputLine}></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.actionButtons}>
                    <button
                        className={styles.verifyBtn}
                        onClick={verifyOtp}
                        disabled={loading || otp.join('').length < 6}
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                {t('verificationPage.verifying')}
                            </>
                        ) : (
                            <>
                                <i className="fas fa-circle-check"></i>
                                {t('verificationPage.verifyEmail')}
                            </>
                        )}
                    </button>

                    <button
                        className={styles.resendBtn}
                        onClick={() => sendOtp(email)}
                        disabled={sending}
                    >
                        {sending ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                {t('verificationPage.sending')}
                            </>
                        ) : (
                            <>
                                <i className="fas fa-redo"></i>
                                {t('verificationPage.resendCode')}
                            </>
                        )}
                    </button>
                </div>
                {/* Footer Section */}
                <div className={styles.verificationFooter}>
                    <div className={styles.expirationNote}>
                        <i className="fas fa-clock"></i>
                        <span>{t('verificationPage.expiry')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationPage;
