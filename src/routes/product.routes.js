import express from 'express';
import { createProduct, getAllProducts, updateProduct, deleteProduct, getProductById } from '../controllers/product.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createProductSchema } from '../schemas/product.schema.js';

const router = express.Router();

router.post('/', authMiddleware, validate(createProductSchema), createProduct);
router.get('/', getAllProducts);
router.get('/:id', authMiddleware, getProductById);
router.put('/:id', authMiddleware, updateProduct);
router.delete('/:id', authMiddleware, deleteProduct);

export default router;