import { Router } from 'express';
import { getMyFavorites, addFavorite, removeFavorite } from '../controllers/favorite.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de favoritos requieren autenticación
router.use(authMiddleware);

router.get('/', getMyFavorites);
router.post('/', addFavorite);
router.delete('/:productId', removeFavorite);

export default router;
