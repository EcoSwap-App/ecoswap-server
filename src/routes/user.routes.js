import { Router } from 'express';
import { syncProfile } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { getUserStats } from '../controllers/user.controller.js';

const router = Router();

router.post('/sync', authMiddleware, syncProfile);
router.get('/stats', authMiddleware, getUserStats);

export default router;