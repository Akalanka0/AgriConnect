import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import { testConnection } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Database Connection
testConnection().catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('AgriConnect API is running...');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
