import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server.js';
import { supabase } from '../src/config/supabaseClient.js';

describe('Endpoints de Modelado 3D (Tripo3D)', () => {

  beforeEach(() => {
    // Definimos la API key mockeada para los tests
    process.env.TRIPO_API_KEY = 'test-key';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Debería retornar 401 si no se proporciona token', async () => {
    const res = await request(app)
      .post('/products/prod-123/generate-3d')
      .send({ images: ['base64string'] });

    expect(res.statusCode).toBe(401);
  });

  test('Debería retornar 403 si el usuario no es el dueño del producto', async () => {
    // 1. Simular autenticación del usuario
    jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-222', email: 'alumno@upc.edu.pe' } },
      error: null
    });

    // 2. Simular que el producto pertenece a otro usuario (user-999)
    const mockSingle = jest.fn().mockResolvedValue({
      data: { user_id: 'user-999' },
      error: null
    });
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: mockSingle
      })
    });
    jest.spyOn(supabase, 'from').mockReturnValue({
      select: mockSelect
    });

    const res = await request(app)
      .post('/products/prod-123/generate-3d')
      .set('Authorization', 'Bearer valid-token')
      .send({ images: ['data:image/png;base64,iVBORw0K'] });

    expect(res.statusCode).toBe(403);
  });

  test('Debería crear correctamente la tarea 3D (202 Accepted)', async () => {
    // 1. Simular autenticación
    jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-111', email: 'alumno@upc.edu.pe' } },
      error: null
    });

    // 2. Simular propiedad del producto (pertenece a user-111)
    const mockSingle = jest.fn().mockResolvedValue({
      data: { user_id: 'user-111' },
      error: null
    });
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: mockSingle
      })
    });
    const fromSpy = jest.spyOn(supabase, 'from').mockReturnValue({
      select: mockSelect
    });

    // 3. Mockear la llamada fetch a Tripo API
    const mockFetch = jest.fn()
      // Primera llamada: upload de imagen
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { image_token: 'tok-999' } })
      })
      // Segunda llamada: crear tarea multiview
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { task_id: 'task-3d-111' } })
      });

    global.fetch = mockFetch;

    const res = await request(app)
      .post('/products/prod-123/generate-3d')
      .set('Authorization', 'Bearer valid-token')
      .send({ images: ['data:image/png;base64,iVBORw0K'] });

    expect(res.statusCode).toBe(202);
    expect(res.body.taskId).toBe('task-3d-111');
    expect(res.body.status).toBe('queued');
  });

  test('Debería retornar el estado de la tarea y actualizar Supabase si ya terminó (success)', async () => {
    // 1. Simular autenticación
    jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-111', email: 'alumno@upc.edu.pe' } },
      error: null
    });

    // 2. Simular consulta de producto
    const mockSingle = jest.fn().mockResolvedValue({
      data: { user_id: 'user-111' },
      error: null
    });
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: mockSingle
      })
    });

    // 3. Simular actualización de model_3d
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        error: null
      })
    });

    const fromSpy = jest.spyOn(supabase, 'from').mockImplementation((table) => {
      if (table === 'products') {
        return {
          select: mockSelect,
          update: mockUpdate
        };
      }
      return {};
    });

    // 4. Mockear respuesta de estado de Tripo (completado con éxito)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 0,
        data: {
          task_id: 'task-3d-111',
          status: 'success',
          progress: 100,
          output: {
            model: 'https://tripo3d.ai/assets/model.glb'
          }
        }
      })
    });

    const res = await request(app)
      .get('/products/prod-123/3d-task/task-3d-111')
      .set('Authorization', 'Bearer valid-token');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.modelUrl).toBe('https://tripo3d.ai/assets/model.glb');
    expect(mockUpdate).toHaveBeenCalledWith({ model_3d: 'https://tripo3d.ai/assets/model.glb' });
  });
});
