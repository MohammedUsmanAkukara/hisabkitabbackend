import jwt from 'jsonwebtoken';
import { UserRepo } from '../storage/dbAdapter.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hisab_kitab_ultra_secure_jwt_secret_key_2026';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await UserRepo.findById(decoded.id);

    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'User not found or account is deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(403).json({ success: false, message: 'Invalid or forged token.' });
  }
};

export const requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Super Admin privileges required.' });
};

export const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'superadmin' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
};
