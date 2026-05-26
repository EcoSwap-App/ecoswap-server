import { z } from 'zod';

export const createProductSchema = z.object({
  title: z.string({
    required_error: 'El título del producto es obligatorio.'
  }).min(1, 'El título del producto es obligatorio y debe ser un texto válido.'),
  price: z.coerce.number({
    invalid_type_error: 'El precio debe ser un número.'
  }).min(0, 'El precio del producto es obligatorio y debe ser un número no negativo.'),
  imageBase64: z.string({
    required_error: 'La imagen del producto es obligatoria.'
  }).min(1, 'La imagen del producto es obligatoria y debe ser un string Base64 válido.'),
  category: z.any({
    required_error: 'La categoría del producto es obligatoria.'
  }),
  status: z.string().optional(),
  model3d: z.string().optional()
});
