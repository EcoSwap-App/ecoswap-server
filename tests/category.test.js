import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server.js';
import { supabase } from '../src/config/supabaseClient.js';

describe('Endpoints de Categorías', () => {

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Debería retornar 401 si se intenta obtener las categorías sin token (GET /categories)', async () => {
    const res = await request(app).get('/categories');
    expect(res.statusCode).toEqual(401);
  });

  test('Debería obtener la lista de categorías si el usuario está autenticado', async () => {
    // 1. Simular autenticación exitosa con correo UPC
    const authSpy = jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'mock-user-id', email: 'alumno@upc.edu.pe' } },
      error: null
    });

    // 2. Simular consulta exitosa a la base de datos de categorías
    const mockOrder = jest.fn().mockResolvedValue({
      data: [
        { id: 'cat-1', name: 'Calculadoras', description: 'Calculadoras científicas' },
        { id: 'cat-2', name: 'Libros', description: 'Libros y textos de cursos' }
      ],
      error: null
    });
    const mockSelect = jest.fn().mockReturnValue({
      order: mockOrder
    });
    const fromSpy = jest.spyOn(supabase, 'from').mockReturnValue({
      select: mockSelect
    });

    const res = await request(app)
      .get('/categories')
      .set('Authorization', 'Bearer valid-mock-token');

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0].name).toBe('Calculadoras');
    expect(res.body[1].name).toBe('Libros');

    expect(authSpy).toHaveBeenCalled();
    expect(fromSpy).toHaveBeenCalledWith('categories');
  });
});
