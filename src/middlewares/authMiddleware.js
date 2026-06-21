import { supabase } from '../config/supabaseClient.js';

/**
 * Middleware para proteger rutas usando autenticación JWT de Supabase.
 * Extrae el token de la cabecera 'Authorization: Bearer <token>', lo valida
 * con Supabase Auth y restringe el acceso a correos específicos (@upc.edu.pe).
 */
export const authMiddleware = async (req, res, next) => {
  // Extrae el token del formato "Bearer <JWT_TOKEN>"
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: 'No se proporcionó un token' });

  try {
    // Valida el token directamente con el servicio de autenticación de Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido o usuario no encontrado' });
    }

    // Regla de negocio: Restricción académica exclusiva para la universidad (con excepciones de prueba)
    const isUpcEmail = user.email.endsWith('@upc.edu.pe');
    const isTestEmail = user.email.endsWith('@hotmail.com') || 
                        user.email.endsWith('@hotmail.es') || 
                        user.email.endsWith('@outlook.com') || 
                        user.email.endsWith('@outlook.es') || 
                        user.email.endsWith('@gmail.com') || 
                        user.email.endsWith('@live.com') || 
                        user.email.endsWith('@live.com.pe');

    if (!isUpcEmail && !isTestEmail) {
      console.warn(`[authMiddleware] Acceso denegado para el correo: ${user.email}`);
      return res.status(403).json({ error: 'Acceso exclusivo para la comunidad UPC o cuentas de prueba autorizadas' });
    }

    // Adjunta los datos del usuario autenticado a la petición para usar en controladores
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Error de autenticación' });
  }
};