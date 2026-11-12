import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import billRoutes from './routes/billRoutes.js';
import syncRoutes from './routes/syncRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import { seedDatabase } from './seed.js';
import { dbStore } from './storage/dbStore.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hisab_kitab';

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: isConnected ? 'MongoDB (Connected)' : 'File-Store (Active backend/data/db.json)',
    service: 'Hisab-Kitab & Billing Management API'
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/settings', settingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server and Database Connection
const startServer = async () => {
  try {
    console.log(`📡 Connecting to MongoDB at ${MONGODB_URI}...`);
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 2000
      });
      console.log('✅ Connected to MongoDB successfully.');
      await seedDatabase();
    } catch (dbErr) {
      console.warn('⚠️ MongoDB not running on 127.0.0.1:27017.');
      console.log('⚡ Activating built-in JSON file database (backend/data/db.json) for instant operation.');
      console.log('💡 To connect live MongoDB, update MONGODB_URI in backend/.env');
      await dbStore.seed();
    }

    app.listen(PORT, () => {
      console.log(`🚀 Hisab-Kitab Backend Server running on http://localhost:${PORT}`);
      console.log(`🔑 Super Admin login: username [admin] | password [admin123]`);
    });
  } catch (error) {
    console.error('Fatal server startup error:', error);
    process.exit(1);
  }
};

startServer();
