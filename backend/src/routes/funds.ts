import { Router } from 'express';
import * as fundsController from '../controllers/fundsController';
import { authenticate } from '../middleware/auth';
import { retiredInSimulation } from '../middleware/simulationOnly';

const router = Router();

// Public fund listings
router.get('/', fundsController.getFunds);
router.get('/:id', fundsController.getFund);

router.use(authenticate);

router.get('/my/investments', fundsController.getMyInvestments);

router.post('/:id/invest', retiredInSimulation);
router.post('/:investmentId/redeem', retiredInSimulation);

export default router;
