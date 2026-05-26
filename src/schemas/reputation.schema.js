import { z } from 'zod';

export const rateUserSchema = z.object({
  targetUserId: z.any({
    required_error: 'El ID del usuario a calificar es obligatorio.'
  }),
  meetingId: z.any({
    required_error: 'El ID de la reunión asociada es obligatorio.'
  }),
  points: z.coerce.number({
    required_error: 'La calificación es obligatoria y debe estar en el rango de 1 a 5.',
    invalid_type_error: 'La calificación debe ser un número.'
  }).int('La calificación debe ser un número entero.').min(1, 'La calificación es obligatoria y debe estar en el rango de 1 a 5.').max(5, 'La calificación es obligatoria y debe estar en el rango de 1 a 5.'),
  reason: z.string().optional()
});
