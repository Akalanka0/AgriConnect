import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const EmailVerificationPage = () => {
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
        <div className="verification-container">
            <div className="verification-box">
                <h2>Email Verification</h2>
                <p>{message}</p>
            </div>
        </div>
    );
};

export default EmailVerificationPage;
