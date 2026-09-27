import { Router } from 'express';
import { body } from 'express-validator';
import * as walletController from '../controllers/walletController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/custody/webhook', walletController.custodyWebhook);

router.use(authenticate);

router.get('/', walletController.getWallet);
router.get('/transactions', walletController.getTransactions);
router.post(
  '/deposit-address',
  [body('asset').isString().isIn(['BTC', 'ETH', 'USDT', 'BNB', 'DOGE', 'TRX'])],
  walletController.createDepositAddress,
);
router.post(
  '/deposit-claim',
  [
    body('asset').isString().isIn(['BTC', 'ETH', 'USDT', 'BNB', 'DOGE', 'TRX']),
    body('txHash').isString().isLength({ min: 20 }),
  ],
  walletController.claimUserDeposit,
);
router.post(
  '/withdraw',
  [
    body('asset').isString().isIn(['BTC', 'ETH', 'USDT', 'BNB', 'DOGE', 'TRX']),
    body('toAddress').isString().notEmpty(),
    body('amount').isString().notEmpty(),
    body('idempotencyKey').isString().isLength({ min: 8 }),
  ],
  walletController.requestUserWithdrawal,
);

export default router;
