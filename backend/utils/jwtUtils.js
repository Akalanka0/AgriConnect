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
    
    const knownWeakSecrets = [
        'your_jwt_secret_key_here',
        'secret',
        'jwt_secret',
        'change_me',
        'changeme',
        'password',
        'your-secret-key-change-this'
    ];
    const lowerSecret = secret.toLowerCase();
    if (
        knownWeakSecrets.includes(lowerSecret) ||
        lowerSecret.startsWith('your_jwt_secret') ||
        lowerSecret.startsWith('your-secret') ||
        lowerSecret.includes('change_this') ||
        lowerSecret.includes('change-this')
    ) {
        return { valid: false, message: 'JWT secret must be changed from default or placeholder value' };
    }
    
    return { valid: true, message: 'JWT secret is valid' };
};
