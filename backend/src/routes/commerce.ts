import { Router } from 'express';
import * as commerceController from '../controllers/commerceController';
import { authenticate } from '../middleware/auth';
import { retiredInSimulation } from '../middleware/simulationOnly';

const router = Router();

// Public product listings
router.get('/products', commerceController.getProducts);
router.get('/products/:id', commerceController.getProduct);

router.use(authenticate);

router.post('/checkout', retiredInSimulation);

export default router;
