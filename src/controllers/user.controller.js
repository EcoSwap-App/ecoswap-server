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

  // Verificación de seguridad para dominio de correo (permite UPC y dominios personales comunes para pruebas/MVP)
  const isUpcEmail = email.endsWith('@upc.edu.pe');
  const isTestEmail = email.endsWith('@hotmail.com') || email.endsWith('@outlook.com') || email.endsWith('@gmail.com');

  if (!isUpcEmail && !isTestEmail) {
    return res.status(403).json({ error: 'Solo se permiten correos de la UPC o cuentas personales autorizadas de Microsoft/Google' });
  }

  // Inserta el registro o actualiza los campos si el usuario ya existe (upsert basado en la clave primaria 'id')
  // Se omite el campo 'reputation' para que la base de datos aplique su valor por defecto (5.0) en nuevos usuarios
  // y preserve la reputación existente al actualizar perfiles.
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .upsert({
      id,
      name,
      email,
      career,
      cycle,
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

export const getUserById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(data);
};

export const updateProfile = async (req, res) => {
  const { name, career, cycle, avatar, verified } = req.body;
  const userId = req.user.id;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (career !== undefined) updateData.career = career;
  if (cycle !== undefined) updateData.cycle = cycle;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (verified !== undefined) updateData.verified = verified;

  const { data, error } = await supabase
    .from(TABLES.USERS)
    .update(updateData)
    .eq('id', userId)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(data[0]);
};
