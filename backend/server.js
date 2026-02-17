import express from 'express';
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
import pestRoutes from './modules/pests/pest.routes.js';
import cropRoutes from './modules/crops/crop.routes.js';
import harvestRoutes from './modules/harvests/harvest.routes.js';
import ratingRoutes from './modules/ratings/rating.routes.js';
import { testConnection } from './config/db.js';
import { sequelize } from './models/index.js';

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

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? ['https://yourdomain.com'] // Add your production domain(s) here
            : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const PORT = process.env.PORT || 5002;

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] // Add your production domain(s) here
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Database Connection
testConnection()
    .then(async () => {
        // Sync models - using a safer approach
        try {
            // Sync all models including GeneratedId, but handle GeneratedId errors specifically
            const models = Object.values(sequelize.models);
            for (const model of models) {
                try {
                    await model.sync({ alter: true });
                } catch (modelError) {
                    if (modelError.code === 'ER_TOO_MANY_KEYS') {
                        console.warn(`⚠️ Skipping sync for ${model.name} due to MySQL key limits (ER_TOO_MANY_KEYS)`);
                    } else {
                        console.error(`Error syncing ${model.name}:`, modelError.message);
                    }
                }
            }
            console.log('✅ Model sync process completed.');
        } catch (syncError) {
            console.error('Unexpected sync error:', syncError.message);
        }
    })
    .then(() => {
        console.log('✅ Database connection established.');
    })
    .catch(err => {
        console.error('Failed to connect to database:', err);
        process.exit(1);
    });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/admin/pests', pestRoutes);
app.use('/api/admin/crops', cropRoutes);
app.use('/api/admin/harvests', harvestRoutes);
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

    // Handle message read status updates
    socket.on('markMessageRead', (messageId) => {
        // Broadcast to all connected clients that a message was read
        io.emit('messageRead', messageId);
    });

    // Handle new message broadcasts (this would be called by message sending endpoints)
    socket.on('broadcastMessage', (message) => {
        // Broadcast to appropriate recipients based on message recipient_type
        if (message.recipient_type === 'all') {
            io.emit('newMessage', message);
        } else if (message.recipient_type === 'admin') {
            io.to('admin').emit('newMessage', message);
        } else if (message.recipient_type === 'farmers') {
            io.to('farmer').emit('newMessage', message);
        } else if (message.recipient_type === 'instructors') {
            io.to('instructor').emit('newMessage', message);
        } else if (message.recipient_id) {
            io.to(`user_${message.recipient_id}`).emit('newMessage', message);
        }
    });
});

// Make io instance available to routes
app.set('io', io);

// Start Server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server enabled`);
});
