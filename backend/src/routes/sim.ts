import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import * as simController from '../controllers/simController';

const router = Router();

const snapshotRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/leaderboard', simController.getLeaderboard);

// Bounds keep self-reported standings within what the simulation can actually produce.
router.post(
  '/snapshot',
  authenticate,
  snapshotRateLimit,
  [
    body('season').isInt({ min: 0 }),
    body('nav').isFloat({ min: 0, max: 100_000_000 }),
    body('seasonReturn').isFloat({ min: -1, max: 100 }),
    body('sortino').optional({ values: 'null' }).isFloat({ min: -10, max: 10 }),
    body('maxDrawdown').isFloat({ min: -1, max: 0 }),
    body('careerTier').isString().isLength({ min: 1, max: 32 }),
    body('xp').isInt({ min: 0, max: 100_000_000 }),
    body('resets').isInt({ min: 0, max: 100_000 }),
    body('epochs').isInt({ min: 0, max: 100_000 }),
  ],
  simController.submitSnapshot,
);

export default router;
