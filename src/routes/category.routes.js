import { Router } from 'express';
import { getAllCategories } from '../controllers/category.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Protegemos el endpoint para que solo usuarios UPC autenticados listen las categorías
router.use(authMiddleware);

router.get('/', getAllCategories);

export default router;
