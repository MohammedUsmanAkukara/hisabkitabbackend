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
app.options('*', cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure MongoDB connection once per cold start (reused across serverless invocations)
let dbInitPromise = null;

const ensureDatabaseReady = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      console.log('📡 Connecting to MongoDB...');
      try {
        await mongoose.connect(MONGODB_URI, {
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000
        });
        console.log('✅ Connected to MongoDB successfully.');
        await seedDatabase();
        return true;
      } catch (dbErr) {
        console.warn('⚠️ MongoDB unavailable, falling back to local File-Store:', dbErr.message);
        await dbStore.seed();
        dbInitPromise = null;
        return false;
      }
    })();
  }

  return dbInitPromise;
};

// Wait for DB initialization before handling API requests (critical on serverless)
app.use('/api', async (req, res, next) => {
  await ensureDatabaseReady();
  next();
});

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

if (!process.env.VERCEL) {
  ensureDatabaseReady()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Hisab-Kitab Backend Server running on http://localhost:${PORT}`);
        console.log(`🔑 Super Admin login: username [admin] | password [admin123]`);
      });
    })
    .catch((error) => {
      console.error('Fatal server startup error:', error);
      process.exit(1);
    });
}

export default app;
