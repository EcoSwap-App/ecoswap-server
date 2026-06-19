import { Router } from 'express';
import { getMyNotifications, createNotification, markAsRead, deleteNotification } from '../controllers/notification.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de notificaciones requieren autenticación
router.use(authMiddleware);

router.get('/', getMyNotifications);
router.post('/', createNotification);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
