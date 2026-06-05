import express from 'express';
import { createProduct, getAllProducts, updateProduct, deleteProduct, getProductById } from '../controllers/product.controller.js';
import { generate3DModel, check3DTaskStatus } from '../controllers/model3d.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createProductSchema } from '../schemas/product.schema.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', validate(createProductSchema), createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Rutas para generación de modelos 3D
router.post('/:id/generate-3d', generate3DModel);
router.get('/:id/3d-task/:taskId', check3DTaskStatus);

export default router;