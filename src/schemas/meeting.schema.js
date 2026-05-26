import { z } from 'zod';

export const createMeetingSchema = z.object({
  productId: z.any({
    required_error: 'El ID del producto es obligatorio.'
  }),
  interestedId: z.any({
    required_error: 'El ID del usuario interesado es obligatorio.'
  }),
  locationId: z.any({
    required_error: 'El ID de la ubicación es obligatorio.'
  }),
  date: z.string({
    required_error: 'La fecha de la reunión es obligatoria.'
  }).min(1, 'La fecha de la reunión es obligatoria y debe ser un texto válido.'),
  time: z.string({
    required_error: 'La hora de la reunión es obligatoria.'
  }).min(1, 'La hora de la reunión es obligatoria y debe ser un texto válido.'),
  notes: z.string().optional()
});
