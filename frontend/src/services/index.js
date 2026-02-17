/**
 * Centralized export for all API services
 */
export { authAPI } from './authService.js';
export { farmerAPI } from './farmerService.js';
export { adminAPI } from './adminService.js';
export { instructorAPI } from './instructorService.js';
export { default as apiService } from './enhancedApiService.js';

/**
 * Common API utilities
 */
export const API_ENDPOINTS = {
    AUTH: '/auth',
    FARMER: '/farmer',
    ADMIN: '/admin',
    INSTRUCTOR: '/instructor',
};

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
};
