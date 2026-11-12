import express from 'express';
import {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor
} from '../controllers/vendorController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getVendors);
router.get('/:syncId', getVendorById);
router.post('/', createVendor);
router.put('/:syncId', updateVendor);
router.delete('/:syncId', deleteVendor);

export default router;

