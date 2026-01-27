import React from 'react';
import PropTypes from 'prop-types';

const RegisterForm = ({
    role,
    setRole,
    registerData,
    setRegisterData,
    handleRegisterSubmit,
    errors,
    showPassword,
    setShowPassword,
    passwordStrength,
    setPasswordStrength,
    checkPasswordStrength,
    loading,
    setIsLogin
}) => {
    // Demo data autofill function
    const fillDemoData = () => {
        const demoData = {
            fullName: role === 'farmer' ? 'Demo Farmer' : 'Demo Instructor',
            email: 'testuseragri@gmail.com',
            password: 'demo12345',
            confirmPassword: 'demo12345',
            nic: role === 'farmer' ? '123456789V' : '987654321V',
            phone: role === 'farmer' ? '0712345678' : '0718765432',
        };

        // Cycle through demo IDs
        const farmerIds = ['FARM-2025-0001'];
        const instructorIds = ['INST-2026-0001'];
        
        // Use current time to cycle through IDs (changes every minute)
        const minuteIndex = 0; // Fixed to 0 since we only have one reusable ID now
        
        if (role === 'farmer') {
            demoData.farmerId = farmerIds[minuteIndex];
        } else if (role === 'instructor') {
            demoData.instructorId = instructorIds[minuteIndex];
        }

        setRegisterData(demoData);
        setPasswordStrength(checkPasswordStrength('demo12345'));
    };

    return (
        <div>
            <div className="login-header">
                <h2>Create Account</h2>
            </div>
            <form onSubmit={handleRegisterSubmit}>
                <div className="role-selector">
                    <button
                        type="button"
                        className={`role-btn farmer ${role === 'farmer' ? 'active' : ''}`}
                        onClick={() => setRole('farmer')}
                    >
                        <i className="fas fa-seedling"></i>
                        <div>Farmer</div>
                    </button>
                    <button
                        type="button"
                        className={`role-btn instructor ${role === 'instructor' ? 'active' : ''}`}
                        onClick={() => setRole('instructor')}
                    >
                        <i className="fas fa-chalkboard-teacher"></i>
                        <div>Instructor</div>
                    </button>
                </div>

                <div className={`form-group ${errors.fullName ? 'error' : ''}`}>
                    <input
                        type="text"
                        value={registerData.fullName}
                        onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                        placeholder="Full Name"
                    />
                    {errors.fullName && <div className="validation-message">{errors.fullName}</div>}
                </div>

                <div className={`form-group ${errors.email ? 'error' : ''}`}>
                    <input
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        placeholder="Email Address"
                    />
                    {errors.email && <div className="validation-message">{errors.email}</div>}
                </div>

                <div className={`form-group ${errors.nic ? 'error' : ''}`}>
                    <input
                        type="text"
                        value={registerData.nic}
                        onChange={(e) => setRegisterData({ ...registerData, nic: e.target.value })}
                        placeholder="NIC Number"
                    />
                    {errors.nic && <div className="validation-message">{errors.nic}</div>}
                </div>

                <div className={`form-group ${errors.phone ? 'error' : ''}`}>
                    <input
                        type="tel"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                        placeholder="Phone Number"
                    />
                    {errors.phone && <div className="validation-message">{errors.phone}</div>}
                </div>

                {role === 'farmer' && (
                    <>
                        <div className={`form-group ${errors.farmerId ? 'error' : ''}`}>
                            <input
                                type="text"
                                value={registerData.farmerId}
                                onChange={(e) => setRegisterData({ ...registerData, farmerId: e.target.value })}
                                placeholder="Farmer ID"
                            />
                            {errors.farmerId && <div className="validation-message">{errors.farmerId}</div>}
                            <div className="info-text">Provided by Department of Agriculture</div>
                        </div>
                    </>
                )}

                {role === 'instructor' && (
                    <div className={`form-group ${errors.instructorId ? 'error' : ''}`}>
                        <input
                            type="text"
                            value={registerData.instructorId}
                            onChange={(e) => setRegisterData({ ...registerData, instructorId: e.target.value })}
                            placeholder="Instructor ID"
                        />
                        {errors.instructorId && <div className="validation-message">{errors.instructorId}</div>}
                        <div className="info-text">Provided by Department of Agriculture</div>
                    </div>
                )}

                <div className={`form-group ${errors.password ? 'error' : ''}`}>
                    <input
                        type={showPassword.register ? 'text' : 'password'}
                        value={registerData.password}
                        onChange={(e) => {
                            setRegisterData({ ...registerData, password: e.target.value });
                            setPasswordStrength(checkPasswordStrength(e.target.value));
                        }}
                        placeholder="Password"
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword({ ...showPassword, register: !showPassword.register })}
                    >
                        <i className={`fas fa-eye${showPassword.register ? '-slash' : ''}`}></i>
                    </button>
                    <div className={`password-strength ${passwordStrength}`}>
                        <div className="password-strength-bar"></div>
                    </div>
                    {errors.password && <div className="validation-message">{errors.password}</div>}
                </div>

                <div className={`form-group ${errors.confirmPassword ? 'error' : ''}`}>
                    <input
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        placeholder="Confirm Password"
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                    >
                        <i className={`fas fa-eye${showPassword.confirm ? '-slash' : ''}`}></i>
                    </button>
                    {errors.confirmPassword && <div className="validation-message">{errors.confirmPassword}</div>}
                </div>

                <button type="submit" className="action-btn" disabled={loading}>
                    <span>{loading ? 'Creating...' : 'Create Account'}</span>
                    {loading && <div className="loading"></div>}
                </button>
                
                {/* Quick Demo Button */}
                <button 
                    type="button" 
                    className="demo-btn" 
                    onClick={fillDemoData}
                    disabled={loading}
                >
                    <i className="fas fa-magic"></i>
                    Quick Demo - {role === 'farmer' ? 'Farmer' : 'Instructor'}
                </button>
                
                <div className="switch-form">
                    <p>Already have an account? <a onClick={() => setIsLogin(true)}>Sign in</a></p>
                </div>
            </form>
        </div>
    );
};

RegisterForm.propTypes = {
    role: PropTypes.string.isRequired,
    setRole: PropTypes.func.isRequired,
    registerData: PropTypes.object.isRequired,
    setRegisterData: PropTypes.func.isRequired,
    handleRegisterSubmit: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
    showPassword: PropTypes.object.isRequired,
    setShowPassword: PropTypes.func.isRequired,
    passwordStrength: PropTypes.string.isRequired,
    setPasswordStrength: PropTypes.func.isRequired,
    checkPasswordStrength: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    setIsLogin: PropTypes.func.isRequired
};

export default RegisterForm;
