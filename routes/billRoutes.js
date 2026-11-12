import express from 'express';
import {
  getBills,
  getBillByNumber,
  createBill,
  deleteBill
} from '../controllers/billController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getBills);
router.get('/:billNumber', getBillByNumber);
router.post('/', createBill);
router.delete('/:syncId', deleteBill);

export default router;

