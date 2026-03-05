import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from '../styles/VerificationPage.module.css';
import { useTranslation } from 'react-i18next';

const EmailVerificationPage = () => {
    const { t } = useTranslation('auth');
    const [message, setMessage] = useState('Verifying your email...');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const token = new URLSearchParams(location.search).get('token');

        if (token) {
            fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
                .then(async (res) => {
                    const data = await res.json();
                    if (!res.ok || !data.success) {
                        throw new Error(data?.error?.message || 'Email verification failed');
                    }
                    setMessage('Email verified successfully! You can now log in.');
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                })
                .catch((err) => {
                    setMessage(err.message || 'Email verification failed');
                });
        } else {
            setMessage('Invalid verification link.');
        }
    }, [location, navigate]);

    return (
        <div className={styles.verificationContainer}>
            <div className={styles.verificationCard}>
                <div className={styles.verificationHeader}>
                    <div className={styles.verificationIcon}>
                        <i className="fas fa-envelope-check"></i>
                    </div>
                    <h2>{t('emailVerification.title')}</h2>
                </div>
                <div className={styles.messageBox} style={{ margin: 'var(--space-lg)' }}>
                    <p>{message}</p>
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationPage;
