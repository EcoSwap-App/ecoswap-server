import { Router } from 'express';
import { sendMessage, getMessagesByMeeting } from '../controllers/message.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { sendMessageSchema } from '../schemas/message.schema.js';

const router = Router({ mergeParams: true });

// Todas las rutas de mensajería requieren estar autenticado
router.use(authMiddleware);

router.post('/', validate(sendMessageSchema), sendMessage);
router.get('/', getMessagesByMeeting);

export default router;
