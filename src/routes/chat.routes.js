import { Router } from 'express';
import { createChat, getMyChats, getChatMessages, sendChatMessage, deleteChat } from '../controllers/chat.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createChat);
router.get('/my-chats', getMyChats);
router.get('/:chatId/messages', getChatMessages);
router.post('/:chatId/messages', sendChatMessage);
router.delete('/:chatId', deleteChat);

export default router;
