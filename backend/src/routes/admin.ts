import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { body } from 'express-validator';
import {
  getAlerts,
  approveAlert,
  rejectAlert,
  approveByTransactionId,
  rejectByTransactionId,
  listUsers,
  listAudit,
  adjustUserBalance,
  createUser,
  upsertCommerceProduct,
} from '../controllers/adminController';
import {
  getYieldConfig,
  putYieldConfig,
  setYieldHold,
  createYieldSpike,
  resolveYieldSpike,
} from '../controllers/yieldController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/users', listUsers);
router.get('/audit', listAudit);
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
router.get('/users/:userId/yield-config', getYieldConfig);
router.put('/users/:userId/yield-config', putYieldConfig);
router.post('/users/:userId/hold', setYieldHold);
router.post('/users/:userId/spikes', createYieldSpike);
router.post('/users/:userId/spikes/:spikeId/resolve', resolveYieldSpike);
router.post('/users/:userId/spikes/resolve', resolveYieldSpike);
router.get('/alerts', getAlerts);
router.post('/alerts/:id/approve', approveAlert);
router.post('/alerts/:id/reject', rejectAlert);
router.post('/alerts/approve-by-tx', approveByTransactionId);
router.post('/alerts/reject-by-tx', rejectByTransactionId);
router.put('/commerce/products', upsertCommerceProduct);

export default router;
