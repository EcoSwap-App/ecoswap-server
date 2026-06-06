import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server.js';
import { supabase } from '../src/config/supabaseClient.js';

describe('Endpoints de Chat y Mensajería', () => {
  let getUserSpy;

  beforeEach(() => {
    // Mock general de autenticación para evitar rechazos en authMiddleware
    getUserSpy = jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-id-123', email: 'estudiante@upc.edu.pe' } },
      error: null
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Debería denegar acceso si el usuario no pertenece a la reunión (GET /meetings/:meetingId/messages)', async () => {
    // Simulamos que la reunión existe pero los participantes son user-aaa y user-bbb (el usuario es user-id-123)
    const mockSingle = jest.fn().mockResolvedValue({
      data: { creator_id: 'user-aaa', interested_id: 'user-bbb' },
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
      .get('/meetings/meeting-999/messages')
      .set('Authorization', 'Bearer valid-token');

    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toContain('No tienes permiso');
  });

  test('Debería retornar el historial de mensajes para un participante válido (GET /meetings/:meetingId/messages)', async () => {
    const mockMeetingSingle = jest.fn().mockResolvedValue({
      data: { creator_id: 'user-id-123', interested_id: 'user-bbb' },
      error: null
    });

    const mockMessagesOrder = jest.fn().mockResolvedValue({
      data: [
        { id: 1, content: 'Hola, ¿dónde estás?', sender_id: 'user-id-123', meeting_id: 'meeting-1' },
        { id: 2, content: 'En el pabellón H', sender_id: 'user-bbb', meeting_id: 'meeting-1' }
      ],
      error: null
    });

    const mockMessagesEq = jest.fn().mockReturnValue({
      order: mockMessagesOrder
    });

    // Mockeamos la primera consulta (Meetings) y luego la de Messages
    const fromSpy = jest.spyOn(supabase, 'from');
    fromSpy.mockImplementation((table) => {
      if (table === 'meetings') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: mockMeetingSingle
            })
          })
        };
      }
      if (table === 'messages') {
        return {
          select: jest.fn().mockReturnValue({
            eq: mockMessagesEq
          })
        };
      }
    });

    const res = await request(app)
      .get('/meetings/meeting-1/messages')
      .set('Authorization', 'Bearer valid-token');

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].content).toBe('Hola, ¿dónde estás?');
  });

  test('Debería poder enviar un mensaje si es participante (POST /meetings/:meetingId/messages)', async () => {
    const mockMeetingSingle = jest.fn().mockResolvedValue({
      data: { creator_id: 'user-id-123', interested_id: 'user-bbb' },
      error: null
    });

    const mockInsertSingle = jest.fn().mockResolvedValue({
      data: { id: 10, content: 'Llego en 5', sender_id: 'user-id-123', meeting_id: 'meeting-1' },
      error: null
    });

    const mockInsertSelect = jest.fn().mockReturnValue({
      single: mockInsertSingle
    });

    const fromSpy = jest.spyOn(supabase, 'from');
    fromSpy.mockImplementation((table) => {
      if (table === 'meetings') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: mockMeetingSingle
            })
          })
        };
      }
      if (table === 'messages') {
        return {
          insert: jest.fn().mockReturnValue({
            select: mockInsertSelect
          })
        };
      }
    });

    const res = await request(app)
      .post('/meetings/meeting-1/messages')
      .set('Authorization', 'Bearer valid-token')
      .send({ content: 'Llego en 5' });

    expect(res.statusCode).toEqual(201);
    expect(res.body.content).toBe('Llego en 5');
  });
});
