import express from 'express';
import { pushSyncBatch, pullSyncData } from '../controllers/syncController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/push', pushSyncBatch);
router.get('/pull', pullSyncData);

export default router;

