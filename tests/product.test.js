import request from 'supertest';
import app from '../src/server.js';
import { supabase } from '../src/config/supabaseClient.js';

// Mock de Supabase para evitar llamadas reales a la API en los tests
jest.mock('../src/config/supabaseClient.js', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: [], error: null }) // Respuesta final
    })),
    auth: {
      getUser: jest.fn()
    }
  }
}));

describe('Endpoints de Productos', () => {

  test('Debería obtener la lista de productos correctamente (GET /products)', async () => {
    // Mock específico para el select
    supabase.from().select.mockResolvedValue({
      data: [{ id: 1, title: 'Calculo I', price: 50 }],
      error: null
    });

    const res = await request(app).get('/products');

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('Calculo I');
  });

  test('Debería fallar si se intenta crear un producto sin token (POST /products)', async () => {
    const res = await request(app)
      .post('/products')
      .send({ title: 'Libro Prohibido', price: 100 });

    // Como implementamos authMiddleware, debería dar 401
    expect(res.statusCode).toEqual(401);
  });
});