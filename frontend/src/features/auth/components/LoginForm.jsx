import React from 'react';
import PropTypes from 'prop-types';

const LoginForm = ({
    loginData,
    setLoginData,
    handleLoginSubmit,
    errors,
    showPassword,
    setShowPassword,
    loading,
    setIsLogin,
    setShowForgotModal,
    fillCredentials
}) => {
    return (
        <div>
            <div className="login-header">
                <h2>Sign In to Your Account</h2>
                <p>Sign in to continue</p>
            </div>
            <form onSubmit={handleLoginSubmit}>
                <div className={`form-group ${errors.username ? 'error' : ''}`}>
                    <input
                        type="text"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        placeholder="Email or Phone"
                    />
                    {errors.username && <div className="validation-message">{errors.username}</div>}
                </div>
                <div className={`form-group ${errors.password ? 'error' : ''}`}>
                    <input
                        type={showPassword.login ? 'text' : 'password'}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder="Password"
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword({ ...showPassword, login: !showPassword.login })}
                    >
                        <i className={`fas fa-eye${showPassword.login ? '-slash' : ''}`}></i>
                    </button>
                    {errors.password && <div className="validation-message">{errors.password}</div>}
                </div>
                <div className="remember-me">
                    <input
                        type="checkbox"
                        id="rememberMe"
                        checked={loginData.rememberMe}
                        onChange={(e) => setLoginData({ ...loginData, rememberMe: e.target.checked })}
                    />
                    <label htmlFor="rememberMe">Remember me</label>
                </div>
                <div className="forgot-password">
                    <a onClick={() => setShowForgotModal(true)}>Forgot password?</a>
                </div>
                <button type="submit" className="action-btn" disabled={loading}>
                    <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                    {loading && <div className="loading"></div>}
                </button>
                <div className="switch-form">
                    <p>Don&apos;t have an account? <a onClick={() => setIsLogin(false)}>Register now</a></p>
                </div>
            </form>
            <div className="demo-accounts">
                <h3><i className="fas fa-lightbulb"></i> Demo Accounts</h3>
                <div className="demo-account">
                    <div><span>Farmer:</span> farmer@example.com / farmer123</div>
                    <button className="copy-btn" onClick={() => fillCredentials('farmer@example.com', 'farmer123')} title="Auto-fill credentials">
                        <i className="fas fa-user-check"></i>
                    </button>
                </div>
                <div className="demo-account">
                    <div><span>Instructor:</span> instructor@example.com / instructor123</div>
                    <button className="copy-btn" onClick={() => fillCredentials('instructor@example.com', 'instructor123')} title="Auto-fill credentials">
                        <i className="fas fa-user-check"></i>
                    </button>
                </div>
                <div className="demo-account">
                    <div><span>Admin:</span> admin@example.com / admin123</div>
                    <button className="copy-btn" onClick={() => fillCredentials('admin@example.com', 'admin123')} title="Auto-fill credentials">
                        <i className="fas fa-user-check"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

LoginForm.propTypes = {
    loginData: PropTypes.object.isRequired,
    setLoginData: PropTypes.func.isRequired,
    handleLoginSubmit: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
    showPassword: PropTypes.object.isRequired,
    setShowPassword: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    setIsLogin: PropTypes.func.isRequired,
    setShowForgotModal: PropTypes.func.isRequired,
    fillCredentials: PropTypes.func.isRequired
};

export default LoginForm;
