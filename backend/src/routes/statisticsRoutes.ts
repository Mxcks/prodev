import { Router } from 'express';
import * as statisticsController from '../controllers/statisticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All statistics routes require authentication
router.use(authenticate);

router.get('/', statisticsController.getStatistics);

export default router;
