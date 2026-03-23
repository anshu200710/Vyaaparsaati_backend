import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import trademarkRoutes from './routes/trademarkRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import { checkTrademark, getStats, getHealth } from './controllers/trademarkController.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Trademark Search API is running' });
});

// Main API routes
app.get('/api/health', getHealth);
app.get('/api/check', checkTrademark);
app.get('/api/stats', getStats);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/trademarks', trademarkRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});