import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authRateLimit } from '../middleware/rateLimit';

const router = Router();

router.post(
  '/register',
  authRateLimit,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
  ],
  authController.register
);

router.post(
  '/login',
  authRateLimit,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  authController.login
);

router.post(
  "/google",
  authRateLimit,
  [body("credential").isString().notEmpty()],
  authController.loginGoogle,
);

router.post(
  "/apple",
  authRateLimit,
  [body("identityToken").isString().notEmpty()],
  authController.loginApple,
);

router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.post('/kyc/initiate', authenticate, authController.initiateKYC);
router.post('/kyc/webhook', authController.kycWebhook);

export default router;
