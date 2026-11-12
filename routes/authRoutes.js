import express from 'express';
import {
  login,
  verify2FA,
  forgotPassword,
  resetPassword,
  getMe,
  listUsers,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/authController.js';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public Authentication Endpoints (Strictly NO public registration route)
router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Authenticated User Profile
router.get('/me', authenticateToken, getMe);

// Super Admin Only: User Account Management (The ONLY way to create accounts)
router.get('/users', authenticateToken, requireSuperAdmin, listUsers);
router.post('/users', authenticateToken, requireSuperAdmin, createUser);
router.patch('/users/:id', authenticateToken, requireSuperAdmin, updateUser);
router.delete('/users/:id', authenticateToken, requireSuperAdmin, deleteUser);

export default router;

