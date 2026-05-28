import { Router } from 'express';
import { rateUser } from '../controllers/reputation.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { rateUserSchema } from '../schemas/reputation.schema.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(rateUserSchema), rateUser);

export default router;