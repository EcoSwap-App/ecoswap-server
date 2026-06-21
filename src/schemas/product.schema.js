import { z } from 'zod';

export const createProductSchema = z.object({
  title: z.string({
    required_error: 'El título del producto es obligatorio.'
  }).min(1, 'El título del producto es obligatorio y debe ser un texto válido.'),
  price: z.coerce.number({
    invalid_type_error: 'El precio debe ser un número.'
  }).min(0, 'El precio del producto es obligatorio y debe ser un número no negativo.'),
  imagesBase64: z.array(z.string()).optional(),
  category: z.any({
    required_error: 'La categoría del producto es obligatoria.'
  }),
  description: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  model3d: z.string().nullable().optional(),
  type: z.enum(['sale', 'wanted']).nullable().optional(),
  subject: z.string().nullable().optional()
});
