import { Router } from 'express';
import { getCategories } from '../controllers/category.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/', getCategories);

export default router;
