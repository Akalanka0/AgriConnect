import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../styles/Login.module.css';

// Components
import { useToast } from '@/components/common/feedback/ToastProvider';
import AuthLayout from '@/features/auth/components/AuthLayout';
import LoginForm from '@/features/auth/components/LoginForm';
import RegisterForm from '@/features/auth/components/RegisterForm';
import ForgotPasswordModal from '@/features/auth/components/ForgotPasswordModal';
import VerificationModal from '@/features/auth/components/VerificationModal';

// Utilities
import {
  validateEmail,
  validateNIC,
  validatePhone,
  validateRoleId,
  checkPasswordStrength
} from '@/features/auth/utils/validation';
import { setAccessToken } from '@/utils/authStorage';
import { setStoredUser } from '@/utils/userStorage';

let hasRunBackendConnectionCheck = false;

const Login = () => {
  const { showToast } = useToast();
  const { t } = useTranslation('auth');
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('farmer');
  const [showPassword, setShowPassword] = useState({});
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailError, setResetEmailError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [loading, setLoading] = useState(false);
  const [maintenanceBanner, setMaintenanceBanner] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStep, setResetStep] = useState('email');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [showResetPassword, setShowResetPassword] = useState({ new: false, confirm: false });
  const [newPasswordData, setNewPasswordData] = useState({ password: '', confirmPassword: '' });

  const navigate = useNavigate();
  const location = useLocation();

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });

  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    nic: '',
    phone: '',
    farmerId: '',
    instructorId: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  // Check backend connection on mount
  useEffect(() => {
    if (hasRunBackendConnectionCheck) {
      return;
    }

    hasRunBackendConnectionCheck = true;

    const checkConnection = async () => {
      try {
        const response = await fetch('/api/auth/test');
        const data = await response.json();
        if (!response.ok) {
          console.error('Backend returned error:', data);
        }
      } catch (error) {
        console.error('Backend connection failed:', error);
        showToast(t('toast.connectionError'), 'error');
      }
    };

    checkConnection();
  }, [showToast]);

  useEffect(() => {
    const savedUsername = localStorage.getItem('agriConnectUsername');
    const rememberMe = localStorage.getItem('agriConnectRemember') === 'true';

    if (rememberMe && savedUsername) {
      setLoginData(prev => ({ ...prev, username: savedUsername, rememberMe: true }));
    }

    const params = new URLSearchParams(location.search);
    if (params.get('show') === 'register') {
      setIsLogin(false);
    }
  }, [location.search]);


  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const newErrors = {};

    if (!loginData.username) newErrors.username = 'Please enter your email';
    if (!loginData.password) newErrors.password = 'Please enter your password';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const loginUrl = `/api/auth/login`;

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginData.username, // Assuming username is email for backend
          password: loginData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {

        if (loginData.rememberMe) {
          localStorage.setItem('agriConnectUsername', loginData.username);
          localStorage.setItem('agriConnectRemember', 'true');
        } else {
          localStorage.removeItem('agriConnectUsername');
          localStorage.removeItem('agriConnectRemember');
        }
        // Store JWT token and user info
        setAccessToken(data.token);
        setStoredUser(data.user);


        showToast(t('toast.loginSuccess'), 'success');
        setTimeout(() => {
          // Redirect based on role from backend response
          if (data.user.role === 'admin') navigate('/admin');
          else if (data.user.role === 'instructor') navigate('/instructor');
          else navigate('/farmer');
        }, 800);
      } else {
        if (data.error?.code === 'MAINTENANCE_MODE' || (data.error?.message || data.message || '').includes('maintenance')) {
          setMaintenanceBanner(true);
        } else if (data.error?.code === 'ACCOUNT_NOT_VERIFIED' || (data.message && data.message.includes('ACCOUNT_NOT_VERIFIED'))) {
          showToast(t('toast.notVerified'), 'error');
          setTimeout(() => {
            navigate(`/verify?email=${encodeURIComponent(loginData.username)}`);
          }, 1000);
        } else {
          setMaintenanceBanner(false);
          const errorMessage = data.error?.message || data.message || 'Login failed. Please try again.';
          showToast(errorMessage, 'error');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast(t('toast.networkError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const newErrors = {};

    if (!registerData.fullName) newErrors.fullName = 'Please enter your full name';
    if (!validateEmail(registerData.email)) newErrors.email = 'Please enter a valid email';
    if (!validateNIC(registerData.nic)) newErrors.nic = 'Please enter a valid NIC';

    if (role === 'farmer') {
      if (!validatePhone(registerData.phone)) newErrors.phone = 'Please enter a valid phone';
      if (!validateRoleId(registerData.farmerId)) newErrors.farmerId = 'Please enter a valid Farmer ID';
    } else {
      if (!validatePhone(registerData.phone)) newErrors.phone = 'Please enter a valid phone';
      if (!validateRoleId(registerData.instructorId)) newErrors.instructorId = 'Please enter a valid Instructor ID';
    }

    if (registerData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (registerData.password !== registerData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const registrationPayload = {
        full_name: registerData.fullName,
        email: registerData.email,
        nic: registerData.nic,
        phone: registerData.phone,
        password: registerData.password,
        role: role,
      };

      if (role === 'farmer') {
        registrationPayload.farmer_id = registerData.farmerId;
      } else if (role === 'instructor') {
        registrationPayload.instructor_id = registerData.instructorId;
      }

      const registerUrl = `/api/auth/register`;

      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationPayload),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(t('toast.registerSuccess'), 'success');
        setRegisterData({
          fullName: '', email: '', nic: '', phone: '',
          farmerId: '', instructorId: '', password: '', confirmPassword: ''
        });
        setTimeout(() => {
          setVerificationEmail(registrationPayload.email);
          setShowVerificationModal(true);
        }, 500);
      } else {
        const errorMessage = data.error?.message || data.message || 'Registration failed. Please try again.';
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showToast(t('toast.networkError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetEmailError('');

    if (!resetEmail.trim()) {
      setResetEmailError('Please enter your email address');
      return;
    }

    if (!validateEmail(resetEmail)) {
      setResetEmailError('Please enter a valid email address');
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch(`/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(data.message, 'success');
        setResetStep('otp'); // Move to OTP step
      } else {
        showToast(data.message || 'Failed to send reset email.', 'error');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      showToast(t('toast.networkError'), 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');

    if (enteredOtp.length < 6) {
      setResetEmailError('Please enter the 6-digit code');
      return;
    }

    setResetLoading(true);
    try {
      const response = await fetch(`/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail, otp: enteredOtp }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(t('toast.otpVerified'), 'success');
        setResetStep('password');
        setResetEmailError('');
      } else {
        setResetEmailError(data.message || 'Invalid OTP code. Please try again.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setResetEmailError('Network error. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPasswordData.password.length < 8) {
      setResetEmailError('Password must be at least 8 characters');
      return;
    }
    if (newPasswordData.password !== newPasswordData.confirmPassword) {
      setResetEmailError('Passwords do not match');
      return;
    }

    setResetLoading(true);
    try {
      const response = await fetch(`/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resetEmail,
          otp: otp.join(''),
          password: newPasswordData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(t('toast.passwordUpdated'), 'success');
        setShowForgotModal(false);
        setResetStep('email');
        setResetEmail('');
        setNewPasswordData({ password: '', confirmPassword: '' });
      } else {
        setResetEmailError(data.message || 'Failed to update password.');
      }
    } catch (error) {
      console.error('Password update error:', error);
      setResetEmailError('Network error. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };



  const fillCredentials = (username, password) => {
    setLoginData(prev => ({ ...prev, username, password }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setErrors({});
    showToast(t('toast.credentialsFilled'), 'success');
  };
  return (
    <div className={styles.loginContainer}>
      <ForgotPasswordModal
        showForgotModal={showForgotModal}
        setShowForgotModal={setShowForgotModal}
        resetStep={resetStep}
        setResetStep={setResetStep}
        resetEmail={resetEmail}
        setResetEmail={setResetEmail}
        resetEmailError={resetEmailError}
        setResetEmailError={setResetEmailError}
        resetLoading={resetLoading}
        otp={otp}
        otpRefs={otpRefs}
        handleOtpChange={handleOtpChange}
        handleOtpKeyDown={handleOtpKeyDown}
        handleResetPassword={handleResetPassword}
        handleVerifyOtp={handleVerifyOtp}
        handleUpdatePassword={handleUpdatePassword}
        newPasswordData={newPasswordData}
        setNewPasswordData={setNewPasswordData}
        showResetPassword={showResetPassword}
        setShowResetPassword={setShowResetPassword}
      />

      <VerificationModal
        showVerificationModal={showVerificationModal}
        setShowVerificationModal={setShowVerificationModal}
        verificationEmail={verificationEmail}
      />

      <AuthLayout>
        {maintenanceBanner && (
          <div className={styles.maintenanceBanner}>
            <div className={styles.maintenanceBannerIcon}>
              <i className="fas fa-triangle-exclamation"></i>
            </div>
            <div className={styles.maintenanceBannerText}>
              <strong>{t('maintenance.title')}</strong>
              <p>{t('maintenance.message')}</p>
            </div>
          </div>
        )}
        {isLogin ? (
          <LoginForm
            loginData={loginData}
            setLoginData={setLoginData}
            handleLoginSubmit={handleLoginSubmit}
            errors={errors}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            loading={loading}
            setIsLogin={setIsLogin}
            setShowForgotModal={setShowForgotModal}
            fillCredentials={fillCredentials}
          />
        ) : (
          <RegisterForm
            role={role}
            setRole={setRole}
            registerData={registerData}
            setRegisterData={setRegisterData}
            handleRegisterSubmit={handleRegisterSubmit}
            errors={errors}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            passwordStrength={passwordStrength}
            setPasswordStrength={setPasswordStrength}
            checkPasswordStrength={checkPasswordStrength}
            loading={loading}
            setIsLogin={setIsLogin}
          />
        )}
      </AuthLayout>
    </div>
  );
};

export default Login;
