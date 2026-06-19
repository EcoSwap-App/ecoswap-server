import { Router } from 'express';
import { rateUser, getReviewsByUserId, deleteReview } from '../controllers/reputation.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { rateUserSchema } from '../schemas/reputation.schema.js';

const router = Router();

// GET is public, so no authMiddleware is required
router.get('/:userId', getReviewsByUserId);

// POST and DELETE require authentication
router.use(authMiddleware);
router.post('/', validate(rateUserSchema), rateUser);
router.delete('/:id', deleteReview);

export default router;