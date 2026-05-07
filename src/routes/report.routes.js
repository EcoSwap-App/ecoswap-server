import { Router } from 'express';
import { createReport, getReports, getReportById } from '../controllers/report.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authMiddleware, createReport);
router.get('/', authMiddleware, getReports);
router.get('/:id', authMiddleware, getReportById);

export default router;