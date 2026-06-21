import { supabase } from '../config/supabaseClient.js';
import { TABLES } from '../constants/entities.js';
import cloudinary from '../config/cloudinary.js';

/**
 * Extracts Cloudinary public ID from a secure URL.
 */
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    let publicIdWithExt = parts[1];
    if (publicIdWithExt.startsWith('v')) {
      const slashIndex = publicIdWithExt.indexOf('/');
      if (slashIndex !== -1) {
        publicIdWithExt = publicIdWithExt.substring(slashIndex + 1);
      }
    }

    const dotIndex = publicIdWithExt.lastIndexOf('.');
    if (dotIndex !== -1) {
      return publicIdWithExt.substring(0, dotIndex);
    }
    return publicIdWithExt;
  } catch (error) {
    console.error('Error parsing public ID from Cloudinary URL:', error);
    return null;
  }
};

/**
 * Formats a user row from database to match client expectations (mapping image_url to avatar).
 */
const formatUserResponse = (user) => {
  if (!user) return null;
  const formatted = { ...user };
  formatted.avatar = user.image_url;
  formatted.createdAt = user.created_at;
  return formatted;
};

/**
 * Sincroniza o crea el perfil público del usuario.
 * Solo permite correos institucionales de la UPC (@upc.edu.pe) y guarda o actualiza
 * el registro correspondiente en la tabla 'users' utilizando 'upsert'.
 */
export const syncProfile = async (req, res) => {
  const { name, career, cycle, avatar } = req.body;
  const { id, email } = req.user; // Datos extraídos previamente por el authMiddleware

  console.log(`[syncProfile] Sincronizando perfil para el correo: ${email}`);

  // Verificación de seguridad para dominio de correo (permite UPC y dominios personales comunes para pruebas/MVP)
  const isUpcEmail = email.endsWith('@upc.edu.pe');
  const isTestEmail = email.endsWith('@hotmail.com') || 
                      email.endsWith('@hotmail.es') || 
                      email.endsWith('@outlook.com') || 
                      email.endsWith('@outlook.es') || 
                      email.endsWith('@gmail.com') || 
                      email.endsWith('@live.com') || 
                      email.endsWith('@live.com.pe');

  if (!isUpcEmail && !isTestEmail) {
    console.warn(`[syncProfile] Dominio de correo no permitido para: ${email}`);
    return res.status(403).json({ error: 'Solo se permiten correos de la UPC o cuentas personales autorizadas de Microsoft/Google' });
  }

  // Verificar si el usuario ya existe y obtener su avatar actual
  const { data: existingUser } = await supabase
    .from(TABLES.USERS)
    .select('image_url')
    .eq('id', id)
    .maybeSingle();

  let avatarUrl = existingUser?.image_url || null;

  // Si no tiene avatar en la BD, pero recibimos un avatar Base64, subirlo a Cloudinary
  if (!avatarUrl && avatar && avatar.startsWith('data:image/')) {
    try {
      const uploadResult = await cloudinary.uploader.upload(avatar, {
        folder: 'ecoswap-app/users',
        transformation: [
          { width: 400, height: 400, crop: "fill" },
          { quality: 70 },
          { fetch_format: "auto" }
        ]
      });
      avatarUrl = uploadResult.secure_url;
    } catch (uploadError) {
      console.error('Error uploading avatar to Cloudinary during sync:', uploadError);
    }
  }

  // Inserta el registro o actualiza los campos si el usuario ya existe (upsert basado en la clave primaria 'id')
  // Se omite el campo 'reputation' para que la base de datos aplique su valor por defecto (5.0) en nuevos usuarios
  // y preserve la reputación existente al actualizar perfiles.
  const upsertData = {
    id,
    name,
    email,
    career,
    cycle,
    verified: true
  };
  if (avatarUrl) {
    upsertData.image_url = avatarUrl;
  }

  const { data, error } = await supabase
    .from(TABLES.USERS)
    .upsert(upsertData)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(formatUserResponse(data[0]));
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
  res.json(formatUserResponse(data));
};

export const updateProfile = async (req, res) => {
  const { name, career, cycle, avatar, verified } = req.body;
  const userId = req.user.id;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (career !== undefined) updateData.career = career;
  if (cycle !== undefined) updateData.cycle = cycle;
  if (verified !== undefined) updateData.verified = verified;

  if (avatar !== undefined) {
    if (avatar === '' || avatar === null) {
      // Eliminar foto antigua de Cloudinary si existe
      const { data: user } = await supabase
        .from(TABLES.USERS)
        .select('image_url')
        .eq('id', userId)
        .maybeSingle();

      if (user?.image_url) {
        const publicId = getPublicIdFromUrl(user.image_url);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (destroyError) {
            console.error('Error deleting old avatar from Cloudinary:', destroyError);
          }
        }
      }
      updateData.image_url = null;
    } else if (avatar.startsWith('data:image/')) {
      // Eliminar foto antigua de Cloudinary si existe
      const { data: user } = await supabase
        .from(TABLES.USERS)
        .select('image_url')
        .eq('id', userId)
        .maybeSingle();

      if (user?.image_url) {
        const publicId = getPublicIdFromUrl(user.image_url);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (destroyError) {
            console.error('Error deleting old avatar from Cloudinary:', destroyError);
          }
        }
      }

      // Subir nueva foto a Cloudinary
      try {
        const uploadResult = await cloudinary.uploader.upload(avatar, {
          folder: 'ecoswap-app/users',
          transformation: [
            { width: 400, height: 400, crop: "fill" },
            { quality: 70 },
            { fetch_format: "auto" }
          ]
        });
        updateData.image_url = uploadResult.secure_url;
      } catch (uploadError) {
        return res.status(400).json({ error: `Error subiendo avatar a Cloudinary: ${uploadError.message}` });
      }
    } else {
      updateData.image_url = avatar;
    }
  }

  const { data, error } = await supabase
    .from(TABLES.USERS)
    .update(updateData)
    .eq('id', userId)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(formatUserResponse(data[0]));
};
