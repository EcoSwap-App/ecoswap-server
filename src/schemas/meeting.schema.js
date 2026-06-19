import { z } from 'zod';

export const createMeetingSchema = z.object({
  chatId: z.string({
    required_error: 'El ID del chat es obligatorio.'
  }).uuid('El ID del chat debe ser un UUID válido.'),
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
