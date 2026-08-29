import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getAccountSnapshot } from '../controllers/accountController';

const router = Router();

router.use(authenticate);
router.get('/snapshot', getAccountSnapshot);

export default router;
