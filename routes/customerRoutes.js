import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '../controllers/customerController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getCustomers);
router.get('/:syncId', getCustomerById);
router.post('/', createCustomer);
router.put('/:syncId', updateCustomer);
router.delete('/:syncId', deleteCustomer);

export default router;

