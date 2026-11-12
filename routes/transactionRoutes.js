import express from 'express';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../controllers/transactionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:syncId', updateTransaction);
router.delete('/:syncId', deleteTransaction);

export default router;

