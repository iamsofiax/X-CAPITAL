import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import {
  getAlerts,
  approveAlert,
  rejectAlert,
} from '../controllers/adminController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/alerts', getAlerts);
router.post('/alerts/:id/approve', approveAlert);
router.post('/alerts/:id/reject', rejectAlert);

export default router;
