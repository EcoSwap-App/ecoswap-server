import { supabase } from '../config/supabaseClient.js';
import { TABLES } from '../constants/entities.js';

/**
 * Obtiene las notificaciones del usuario autenticado.
 * GET /notifications
 */
export const getMyNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Crea una notificación.
 * POST /notifications
 */
export const createNotification = async (req, res) => {
  const { userId, type, title, message, link_to } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'El ID de usuario destinatario es obligatorio.' });
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .insert([{
        user_id: userId,
        type: type || 'system',
        title: title || 'Nueva notificación',
        message: message || '',
        link_to: link_to ? String(link_to) : null,
        read: false
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Marca una notificación como leída/no leída.
 * PATCH /notifications/:id/read
 */
export const markAsRead = async (req, res) => {
  const { id } = req.params;
  const { read } = req.body;
  const userId = req.user.id;

  try {
    // 1. Validar propiedad
    const { data: notif, error: selectError } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select('user_id')
      .eq('id', id)
      .single();

    if (selectError || !notif) {
      return res.status(404).json({ error: 'Notificación no encontrada.' });
    }

    if (notif.user_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar esta notificación.' });
    }

    // 2. Actualizar estado
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .update({ read: read !== undefined ? read : true })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Elimina una notificación.
 * DELETE /notifications/:id
 */
export const deleteNotification = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // 1. Validar propiedad
    const { data: notif, error: selectError } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select('user_id')
      .eq('id', id)
      .single();

    if (selectError || !notif) {
      return res.status(404).json({ error: 'Notificación no encontrada.' });
    }

    if (notif.user_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta notificación.' });
    }

    // 2. Eliminar
    const { error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .delete()
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json({ message: 'Notificación eliminada con éxito.' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
