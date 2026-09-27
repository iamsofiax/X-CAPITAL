import { Router } from 'express';
import authRoutes from './auth';
import tradingRoutes from './trading';
import portfolioRoutes from './portfolio';
import fundsRoutes from './funds';
import walletRoutes from './wallet';
import commerceRoutes from './commerce';
import oracleRoutes from './oracle';
import adminRoutes from './admin';
import simRoutes from './sim';

const router = Router();

router.get('/health', async (_req, res) => {
  const { collectHealth } = await import('../services/healthService');
  const snap = await collectHealth();
  res.json({ success: true, data: snap });
});

router.use('/auth', authRoutes);
router.use('/trading', tradingRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/funds', fundsRoutes);
router.use('/wallet', walletRoutes);
router.use('/commerce', commerceRoutes);
router.use('/oracle', oracleRoutes);
router.use('/admin', adminRoutes);
router.use('/sim', simRoutes);

export default router;
