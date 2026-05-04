import { authMiddleware } from '../src/middleware/auth.js';

describe('Middleware de Autenticación', () => {
  test('Debería rechazar correos externos', async () => {
    const { supabase } = await import('../src/config/supabaseClient.js');

    // Simulamos usuario infiltrado de Gmail
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { email: 'infiltrado@gmail.com' } },
      error: null
    });

    const req = { headers: { authorization: 'Bearer token' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});