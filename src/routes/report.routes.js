import { Router } from 'express';
import { createReport, getReports, getReportById } from '../controllers/report.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createReport);
router.get('/', getReports);
router.get('/:id', getReportById);

export default router;