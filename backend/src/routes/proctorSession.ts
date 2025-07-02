import { Router, Request, Response } from 'express';
import { proctorSessionController } from '../controllers/proctorSession';

const router: Router = Router();

// Start a new proctoring session
router.post('/start', proctorSessionController.startSession);

// End a proctoring session
router.post('/:sessionId/end', proctorSessionController.endSession);

// Get session status
router.get('/:sessionId/status', proctorSessionController.getSessionStatus);

// Get all active sessions
router.get('/active', proctorSessionController.getActiveSessions);

// Get session history for a user
router.get('/history/:userId', proctorSessionController.getSessionHistory);

export default router;
