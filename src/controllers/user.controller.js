import { supabase } from '../config/supabaseClient.js';
import { TABLES } from '../constants/entities.js';

/**
 * Sincroniza o crea el perfil público del usuario.
 * Solo permite correos institucionales de la UPC (@upc.edu.pe) y guarda o actualiza
 * el registro correspondiente en la tabla 'users' utilizando 'upsert'.
 */
export const syncProfile = async (req, res) => {
  const { name, career, cycle } = req.body;
  const { id, email } = req.user; // Datos extraídos previamente por el authMiddleware

  // Verificación redundante de seguridad para dominio de correo
  if (!email.endsWith('@upc.edu.pe')) {
    return res.status(403).json({ error: 'Solo se permiten correos de la UPC' });
  }

  // Inserta el registro o actualiza los campos si el usuario ya existe (upsert basado en la clave primaria 'id')
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .upsert({
      id,
      name,
      email,
      career,
      cycle,
      reputation: 5.0, // Reputación base por defecto para nuevos perfiles
      verified: true
    })
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
};

/**
 * Obtiene estadísticas generales del usuario autenticado.
 * Retorna datos de perfil (reputación, carrera) junto con el conteo de productos
 * que ha intercambiado/donado exitosamente (donde 'available' es false).
 */
export const getUserStats = async (req, res) => {
  const userId = req.user.id;

  // 1. Obtener datos básicos de reputación y perfil del usuario
  const { data: user, error: userError } = await supabase
    .from(TABLES.USERS)
    .select('name, reputation, career')
    .eq('id', userId)
    .single();

  if (userError) return res.status(400).json({ error: userError.message });

  // 2. Contar productos que han sido donados/intercambiados (no disponibles) por este usuario
  const { count, error: countError } = await supabase
    .from(TABLES.PRODUCTS)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('available', false);

  if (countError) return res.status(400).json({ error: countError.message });

  // 3. Responder con la estructura que consume la aplicación cliente
  res.json({
    name: user.name,
    reputation: user.reputation,
    career: user.career,
    products: [{ count: count || 0 }]
  });
};