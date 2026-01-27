import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { testConnection } from './config/db.js';
import { validateJWTSecret } from './utils/jwtUtils.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

// Validate JWT secret before starting server
const jwtValidation = validateJWTSecret(process.env.JWT_SECRET);
if (!jwtValidation.valid) {
    console.error('❌ JWT Secret Validation Error:', jwtValidation.message);
    console.error('Please set a strong JWT_SECRET in your .env file');
    console.error('You can generate one using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

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

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Database Connection
testConnection().catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('AgriConnect API is running...');
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
