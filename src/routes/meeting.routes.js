import { Router } from 'express';
import { createMeeting, confirmMeeting, cancelMeeting } from '../controllers/meeting.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createMeetingSchema } from '../schemas/meeting.schema.js';
import { supabase } from '../config/supabaseClient.js';
import { TABLES } from '../constants/entities.js';
import messageRoutes from './message.routes.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createMeetingSchema), createMeeting);
router.post('/:id/confirm', confirmMeeting);
router.post('/:id/cancel', cancelMeeting);

router.get('/my-meetings', async (req, res) => {
    const { data, error } = await supabase
        .from(TABLES.MEETINGS)
        .select('*, products(title), locations(name)')
        .or(`creator_id.eq.${req.user.id},interested_id.eq.${req.user.id}`);

    if (error) return res.status(400).json(error);
    res.json(data);
});

router.use('/:meetingId/messages', messageRoutes);

export default router;