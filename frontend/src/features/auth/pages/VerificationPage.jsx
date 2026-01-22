import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/VerificationPage.css';

const VerificationPage = () => {
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
            const nextInput = document.getElementById(`email-otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`email-otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    useEffect(() => {
        if (queryEmail) {
            sendOtp(queryEmail);
        }
    }, [queryEmail]);

    return (
        <div className="verification-container">
            <div className="verification-card">
                {/* Header Section */}
                <div className="verification-header">
                    <div className="verification-icon">
                        <i className="fas fa-envelope-open-text"></i>
                    </div>
                    <h2>Verify Your Account</h2>
                    <p>Thank you for registering! Please check your email and enter the verification code below.</p>
                </div>

                {/* Status Message */}
                {message && (
                    <div className={`message-box ${message.includes('Demo account') ? 'demo-message' : message.includes('successfully') ? 'success-message' : 'info-message'}`}>
                        <i className={`fas ${message.includes('Demo account') ? 'fa-magic' : message.includes('successfully') ? 'fa-check-circle' : 'fa-info-circle'}`}></i>
                        {message}
                    </div>
                )}

                {/* Email Section */}
                <div className="email-section">
                    <label className="section-label">
                        <i className="fas fa-envelope"></i>
                        Email Address
                    </label>
                    <div className="input-group">
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="email-input"
                        />
                        <div className="input-icon">
                            <i className="fas fa-envelope"></i>
                        </div>
                    </div>
                </div>

                {/* OTP Section */}
                <div className="otp-section">
                    <label className="section-label">
                        <i className="fas fa-key"></i>
                        Verification Code
                    </label>
                    <p className="section-description">We&apos;ve sent a 6-digit verification code to your email. Please enter it below.</p>
                    
                    <div className="otp-inputs-container">
                        {otp.map((digit, index) => (
                            <div key={index} className="otp-input-wrapper">
                                <input
                                    id={`email-otp-${index}`}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    className="otp-input"
                                    placeholder="0"
                                />
                                <div className="otp-input-line"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button 
                        className="verify-btn" 
                        onClick={verifyOtp} 
                        disabled={loading || otp.join('').length < 6}
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Verifying...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check-circle"></i>
                                Verify Email
                            </>
                        )}
                    </button>
                    
                    <button 
                        className="resend-btn" 
                        onClick={() => sendOtp(email)} 
                        disabled={sending}
                    >
                        {sending ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Sending...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-redo"></i>
                                Resend Code
                            </>
                        )}
                    </button>
                </div>
                {/* Footer Section */}
                <div className="verification-footer">
                    <div className="expiration-note">
                        <i className="fas fa-clock"></i>
                        <span>Verification codes expire after 10 minutes.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationPage;
