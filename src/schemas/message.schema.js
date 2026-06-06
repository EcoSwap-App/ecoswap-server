import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string({
    required_error: 'El contenido del mensaje es obligatorio.'
  }).min(1, 'El mensaje no puede estar vacío.')
});
