import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '@/features/auth/styles/Login.css';

// Sub-components
import AuthLayout from '@/features/auth/components/AuthLayout';
import LoginForm from '@/features/auth/components/LoginForm';
import RegisterForm from '@/features/auth/components/RegisterForm';
import ForgotPasswordModal from '@/features/auth/components/ForgotPasswordModal';

// Utilities
import {
  validateEmail,
  validateNIC,
  validatePhone,
  validateRoleId,
  checkPasswordStrength
} from '@/shared/utils/validation';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('farmer');
  const [showPassword, setShowPassword] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailError, setResetEmailError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStep, setResetStep] = useState('email');
  const [otp, setOtp] = useState(['', '', '', '']);
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

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  // Check backend connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log('Checking backend connection...');
        const response = await fetch('/api/auth/test');
        const data = await response.json();
        console.log('Backend connection status:', data);
        if (response.ok) {
          showNotification('Connected to backend successfully', 'success');
        } else {
            console.error('Backend returned error:', data);
        }
      } catch (error) {
        console.error('Backend connection failed:', error);
        showNotification('Cannot connect to backend server', 'error');
      }
    };
    
    checkConnection();
  }, [showNotification]);

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
      console.log('Attempting login to:', loginUrl);
      
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
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        showNotification('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          // Redirect based on role from backend response
          if (data.user.role === 'admin') navigate('/admin');
          else if (data.user.role === 'instructor') navigate('/instructor');
          else navigate('/farmer');
        }, 800);
      } else {
        if (data.message && data.message.includes('ACCOUNT_NOT_VERIFIED')) {
          showNotification('Account not verified. Please check your email.', 'error');
          setTimeout(() => {
            navigate(`/verify?email=${encodeURIComponent(loginData.username)}`);
          }, 1000);
        } else {
          const errorMessage = data.error?.message || data.message || 'Login failed. Please try again.';
          showNotification(errorMessage, 'error');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification('Network error. Please try again later.', 'error');
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
      console.log('Attempting registration to:', registerUrl);

      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationPayload),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Account created successfully! Please verify your email.', 'success');
        setRegisterData({
          fullName: '', email: '', nic: '', phone: '',
          farmerId: '', instructorId: '', password: '', confirmPassword: ''
        });
        setTimeout(() => {
          navigate(`/verify?email=${encodeURIComponent(registrationPayload.email)}`);
        }, 800);
      } else {
        const errorMessage = data.error?.message || data.message || 'Registration failed. Please try again.';
        showNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showNotification('Network error. Please try again later.', 'error');
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
        showNotification(data.message, 'success');
        setResetStep('otp'); // Move to OTP step
      } else {
        showNotification(data.message || 'Failed to send reset email.', 'error');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      showNotification('Network error. Please try again later.', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');

    if (enteredOtp.length < 4) {
      setResetEmailError('Please enter the 4-digit code');
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
        showNotification('OTP Verified! Create your new password.', 'success');
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
        showNotification('Password updated successfully!', 'success');
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

    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };



  const fillCredentials = (username, password) => {
    setLoginData(prev => ({ ...prev, username, password }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setErrors({});
    showNotification('Credentials auto-filled! You can now sign in.', 'success');
  };

  return (
    <div className="login-container">
      <div className={`notification ${notification.show ? 'show' : ''} ${notification.type}`}>
        <i className={`fas ${notification.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
        <span>{notification.message}</span>
      </div>

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

      <AuthLayout>
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