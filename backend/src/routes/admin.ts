import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { body } from 'express-validator';
import {
  getAlerts,
  approveAlert,
  rejectAlert,
  listUsers,
  adjustUserBalance,
  createUser,
} from '../controllers/adminController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/users', listUsers);
router.post(
  '/users',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
  ],
  createUser,
);
router.post('/users/:userId/balance', adjustUserBalance);
router.get('/alerts', getAlerts);
router.post('/alerts/:id/approve', approveAlert);
router.post('/alerts/:id/reject', rejectAlert);

export default router;
