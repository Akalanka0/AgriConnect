import apiService from './enhancedApiService.js';

/**
 * Authentication API service
 */
export const authAPI = {
    /**
     * Login user
     */
    login: (credentials) => apiService.post('/auth/login', credentials),

    /**
     * Register new user
     */
    register: (userData) => apiService.post('/auth/register', userData),

    /**
     * Verify email
     */
    verifyEmail: (token) => apiService.get(`/auth/verify-email?token=${token}`),

    /**
     * Send email OTP
     */
    sendEmailOTP: (email) => apiService.post('/auth/send-email-otp', { email }),

    /**
     * Verify email OTP
     */
    verifyEmailOTP: (email, otp) => apiService.post('/auth/verify-email-otp', { email, otp }),

    /**
     * Forgot password
     */
    forgotPassword: (email) => apiService.post('/auth/forgot-password', { email }),

    /**
     * Verify OTP for password reset
     */
    verifyOTP: (email, otp) => apiService.post('/auth/verify-otp', { email, otp }),

    /**
     * Reset password
     */
    resetPassword: (email, otp, newPassword) => apiService.post('/auth/reset-password', {
        email,
        otp,
        newPassword
    }),

    /**
     * Test backend connection
     */
    testConnection: () => apiService.get('/auth/test'),
};
