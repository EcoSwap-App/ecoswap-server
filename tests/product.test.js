import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server.js';
import { supabase } from '../src/config/supabaseClient.js';

describe('Endpoints de Productos', () => {

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Debería obtener la lista de productos correctamente (GET /products)', async () => {
    jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-id-123', email: 'estudiante@upc.edu.pe' } },
      error: null
    });

    const mockEq = jest.fn().mockResolvedValue({
      data: [{ id: 1, title: 'Calculo I', price: 50 }],
      error: null
    });
    const mockSelect = jest.fn().mockReturnValue({
      eq: mockEq
    });
    const fromSpy = jest.spyOn(supabase, 'from').mockReturnValue({
      select: mockSelect
    });

    const res = await request(app)
      .get('/products')
      .set('Authorization', 'Bearer valid-token');

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