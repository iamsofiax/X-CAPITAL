import { Router } from 'express';
import authRoutes from './auth';
import tradingRoutes from './trading';
import portfolioRoutes from './portfolio';
import fundsRoutes from './funds';
import walletRoutes from './wallet';
import commerceRoutes from './commerce';
import oracleRoutes from './oracle';
import adminRoutes from './admin';
import accountRoutes from './account';
import { getSystemHealth } from '../controllers/healthController';

const router = Router();

router.get('/health', getSystemHealth);
router.use('/auth', authRoutes);
router.use('/trading', tradingRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/funds', fundsRoutes);
router.use('/wallet', walletRoutes);
router.use('/commerce', commerceRoutes);
router.use('/oracle', oracleRoutes);
router.use('/admin', adminRoutes);
router.use('/account', accountRoutes);

export default router;
