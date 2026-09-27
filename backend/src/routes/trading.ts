import { Router } from 'express';
import * as tradingController from '../controllers/tradingController';
import { authenticate } from '../middleware/auth';
const router = Router();

router.get('/assets', tradingController.getAssets);
router.get('/quotes', tradingController.getLiveQuotes);
router.get('/assets/:symbol', tradingController.getAsset);
router.get('/assets/:symbol/chart', tradingController.getAssetChart);

router.use(authenticate);

router.get('/orders', tradingController.getOrders);
router.get('/orders/:id', tradingController.getOrder);

export default router;
