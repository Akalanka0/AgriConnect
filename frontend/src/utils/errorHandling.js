/**
 * Error handling utilities for frontend
 */
export class ApiError extends Error {
    constructor(message, status, code, details = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

/**
 * Error handler for different types of errors
 */
export class ErrorHandler {
    static handle(error) {
        console.error('API Error:', error);

        if (error instanceof ApiError) {
            return this.handleApiError(error);
        }

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return new ApiError('Network error. Please check your connection.', 0, 'NETWORK_ERROR');
        }

        if (error.name === 'AbortError') {
            return new ApiError('Request timeout. Please try again.', 0, 'TIMEOUT_ERROR');
        }

        return new ApiError(error.message || 'An unexpected error occurred', 0, 'UNKNOWN_ERROR');
    }

    static handleApiError(error) {
        switch (error.status) {
            case 400:
                return new ApiError(error.message, 400, 'BAD_REQUEST', error.details);
            case 401:
                return new ApiError('Authentication required. Please login.', 401, 'UNAUTHORIZED');
            case 403:
                return new ApiError('Access denied. You do not have permission.', 403, 'FORBIDDEN');
            case 404:
                return new ApiError('Resource not found.', 404, 'NOT_FOUND');
            case 429:
                return new ApiError('Too many requests. Please try again later.', 429, 'RATE_LIMIT');
            case 500:
                return new ApiError('Server error. Please try again later.', 500, 'SERVER_ERROR');
            default:
                return error;
        }
    }

    static getUserFriendlyMessage(error) {
        const handled = this.handle(error);
        
        const messages = {
            'NETWORK_ERROR': 'Unable to connect. Please check your internet connection.',
            'TIMEOUT_ERROR': 'Request took too long. Please try again.',
            'UNAUTHORIZED': 'Please login to continue.',
            'FORBIDDEN': 'You do not have permission to perform this action.',
            'NOT_FOUND': 'The requested resource was not found.',
            'RATE_LIMIT': 'Too many requests. Please wait before trying again.',
            'SERVER_ERROR': 'Server is experiencing issues. Please try again later.',
            'UNKNOWN_ERROR': 'Something went wrong. Please try again.'
        };

        return messages[handled.code] || handled.message;
    }
}

/**
 * Toast notification helper
 */
export class ToastHelper {
    static showError(error, toastFunction) {
        const friendlyMessage = ErrorHandler.getUserFriendlyMessage(error);
        if (toastFunction) {
            toastFunction(friendlyMessage, 'error');
        } else {
            console.error('Toast Error:', friendlyMessage);
        }
    }

    static showSuccess(message, toastFunction) {
        if (toastFunction) {
            toastFunction(message, 'success');
        }
    }

    static showInfo(message, toastFunction) {
        if (toastFunction) {
            toastFunction(message, 'info');
        }
    }
}

/**
 * Validation utilities
 */
export class ValidationHelper {
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validateRequired(fields, data) {
        const missing = fields.filter(field => !data[field]);
        return missing.length === 0 ? null : missing;
    }

    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input.trim().replace(/[<>]/g, '');
    }
}

export default {
    ApiError,
    ErrorHandler,
    ToastHelper,
    ValidationHelper
};
