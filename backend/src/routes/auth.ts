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
  '/oauth/google',
  authRateLimit,
  [body('idToken').isString().notEmpty()],
  authController.googleLogin
);

router.post(
  '/oauth/apple',
  authRateLimit,
  authController.appleLogin
);

router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.post(
  '/password',
  authenticate,
  authRateLimit,
  [
    body('currentPassword').optional().isString(),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  authController.changePassword
);
router.post('/kyc/initiate', authenticate, authController.initiateKYC);
router.post('/kyc/webhook', authController.kycWebhook);

export default router;
