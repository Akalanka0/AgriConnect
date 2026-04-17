import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import authRoutes from './modules/auth/auth.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import farmerRoutes from './modules/farmer/farmer.routes.js';
import instructorRoutes from './modules/instructor/instructor.routes.js';
import cropRoutes from './modules/crops/crop.routes.js';
import ratingRoutes from './modules/ratings/rating.routes.js';
import { testConnection } from './config/db.js';
import { sequelize } from './models/index.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
import { validateJWTSecret } from './utils/jwtUtils.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Validate JWT secret before starting server
const jwtValidation = validateJWTSecret(process.env.JWT_SECRET);
if (!jwtValidation.valid) {
    console.error('❌ JWT Secret Validation Error:', jwtValidation.message);
    console.error('Please set a strong JWT_SECRET in your .env file');
    console.error('You can generate one using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    process.exit(1);
}

const getAllowedOrigins = () => {
    const configuredOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
        : [];

    if (configuredOrigins.length > 0) {
        return configuredOrigins;
    }

    if (process.env.FRONTEND_URL) {
        return process.env.FRONTEND_URL.split(',').map((origin) => origin.trim()).filter(Boolean);
    }

    return [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
    ];
};

const allowedOrigins = getAllowedOrigins();

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const PORT = process.env.PORT || 5005;
const isDev = process.env.NODE_ENV !== 'production';

// ── Security & Performance Middleware ─────────────────────────────────────────
// HTTP security headers
app.use(helmet({
    crossOriginEmbedderPolicy: false, // allows Cloudinary images to load
    contentSecurityPolicy: isDev ? false : {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
            connectSrc: ["'self'"],
        }
    }
}));

// Gzip / Brotli compression for all responses
app.use(compression());

// CORS
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Body parsers – strict size limits to prevent payload-based DoS
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Static uploads served with cache headers
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
    maxAge: '7d',
    immutable: true
}));

// Request logging – strips query strings to avoid leaking tokens in logs
app.use((req, res, next) => {
    if (isDev) {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    }
    next();
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/admin/crops', cropRoutes);
app.use('/api/ratings', ratingRoutes);

app.get('/', (req, res) => {
    res.send('AgriConnect API is running...');
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// WebSocket authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log(`${socket.userRole} user ${socket.userId} connected via WebSocket`);

    // Join user to their role-specific room
    socket.join(socket.userRole);
    
    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`${socket.userRole} user ${socket.userId} disconnected from WebSocket`);
    });

    // Note: message read-status updates and new message broadcasts are emitted
    // server-side only (from message.controller.js) — clients do not trigger socket
    // broadcasts to prevent privilege escalation or message spoofing.
});

// Make io instance available to routes
app.set('io', io);

const bootstrap = async () => {
    try {
        const databaseReady = await testConnection();
        if (!databaseReady) {
            throw new Error('Database connection test failed');
        }

        // Schema changes are managed exclusively through migrations — do not use alter/force.
        if (process.env.NODE_ENV !== 'production') {
            const models = Object.values(sequelize.models);
            for (const model of models) {
                try {
                    await model.sync({});
                } catch (modelError) {
                    if (modelError.code === 'ER_TOO_MANY_KEYS') {
                        console.warn(`⚠️ Skipping sync for ${model.name} due to MySQL key limits (ER_TOO_MANY_KEYS)`);
                    } else {
                        console.error(`Error syncing ${model.name}:`, modelError.message);
                    }
                }
            }
            console.log('✅ Model sync process completed.');
        }

        if (process.env.NODE_ENV !== 'test') {
            server.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
                console.log('✅ Database connection established.');
                console.log(`WebSocket server enabled`);
            });
        }
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

if (process.env.NODE_ENV !== 'test') {
    bootstrap();
}

export { app, server };

