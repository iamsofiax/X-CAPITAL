import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { body } from 'express-validator';
import { listUsers, createUser, setUserActive, postLedgerAdjustment } from '../controllers/adminController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/users', listUsers);
router.post(
  '/users',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
  ],
  createUser,
);
router.post('/users/:userId/active', [body('active').isBoolean()], setUserActive);
router.post(
  '/users/:userId/journal',
  [
    body('asset').isString().notEmpty(),
    body('amount').notEmpty(),
    body('direction').isIn(['credit', 'debit']),
    body('reason').isString().isLength({ min: 3 }),
    body('idempotencyKey').isString().isLength({ min: 8 }),
  ],
  postLedgerAdjustment,
);

export default router;
