import jwt from 'jsonwebtoken';
import { User, SystemSetting, FarmerDetail, InstructorDetail } from '../models/index.js';

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'Access denied. Please log in.'
                }
            });
        }

        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token - no fallback; JWT_SECRET must always be set via env
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({
                success: false,
                error: { code: 'SERVER_CONFIG_ERROR', message: 'Server configuration error.' }
            });
        }
        const decoded = jwt.verify(token, jwtSecret);

        // Get user from database with associated details
        let userInclude = [];
        if (decoded.role === 'farmer') {
            userInclude = [{ model: FarmerDetail, as: 'farmerDetail' }];
        } else if (decoded.role === 'instructor') {
            userInclude = [{ model: InstructorDetail, as: 'instructorDetail' }];
        }

        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] },
            include: userInclude
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Session invalid. Please log in again.'
                }
            });
        }

        // Check if account is active
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: {
                    code: `ACCOUNT_${user.status.toUpperCase()}`,
                    message: `Account is ${user.status}. Access denied.`
                }
            });
        }

        // Attach user to request
        req.user = user;

        // Check for Maintenance Mode (Allow Admins only)
        if (user.role !== 'admin' && user.role !== 'Super Admin') {
            const maintenanceSetting = await SystemSetting.findOne({
                where: { setting_key: 'maintenance_mode' }
            });

            if (maintenanceSetting && maintenanceSetting.setting_value === 'true') {
                return res.status(503).json({
                    success: false,
                    error: {
                        code: 'MAINTENANCE_MODE',
                        message: 'System is currently under maintenance. Please try again later.'
                    }
                });
            }
        }

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid token.'
                }
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Token has expired. Please login again.'
                }
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'AUTH_ERROR',
                message: 'Authentication failed.'
            }
        });
    }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role(s)
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                }
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: `Access denied. Required role: ${roles.join(' or ')}`
                }
            });
        }

        next();
    };
};
