import { Router } from 'express';
import { syncProfile, getUserStats, getUserById, updateProfile } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/:id', getUserById);

router.use(authMiddleware);

router.post('/sync', syncProfile);
router.get('/stats', getUserStats);
router.put('/profile', updateProfile);

export default router;