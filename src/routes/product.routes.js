import express from 'express';
import { createProduct, getAllProducts, updateProduct, deleteProduct, getProductById } from '../controllers/product.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createProduct);
router.get('/', getAllProducts);
router.get('/:id', authMiddleware, getProductById);
router.put('/:id', authMiddleware, updateProduct);
router.delete('/:id', authMiddleware, deleteProduct);

export default router;