import { Router } from 'express';
import * as sessionController from '../controllers/sessionController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All session routes require authentication
router.use(authenticate);

// Session management
router.post('/start', sessionController.startSession);
router.post('/:sessionId/keypress', sessionController.recordKeyPress);
router.post('/:sessionId/end', sessionController.endSession);
router.get('/:sessionId', sessionController.getSession);
router.get('/', sessionController.getSessionHistory);

export default router;
