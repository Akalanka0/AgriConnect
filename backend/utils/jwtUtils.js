import crypto from 'crypto';

/**
 * Generate a secure JWT secret
 */
export const generateJWTSecret = () => {
    return crypto.randomBytes(64).toString('hex');
};

/**
 * Validate JWT secret strength
 */
export const validateJWTSecret = (secret) => {
    if (!secret || typeof secret !== 'string') {
        return { valid: false, message: 'JWT secret is required and must be a string' };
    }
    
    if (secret.length < 32) {
        return { valid: false, message: 'JWT secret must be at least 32 characters long' };
    }
    
    if (secret === 'your_jwt_secret_key_here' || secret === 'secret' || secret === 'jwt_secret') {
        return { valid: false, message: 'JWT secret must be changed from default value' };
    }
    
    return { valid: true, message: 'JWT secret is valid' };
};
