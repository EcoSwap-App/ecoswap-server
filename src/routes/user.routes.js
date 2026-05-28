import { Router } from 'express';
import { syncProfile } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { getUserStats } from '../controllers/user.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/sync', syncProfile);
router.get('/stats', getUserStats);

export default router;