import { supabase } from '../config/supabaseClient.js';
import { TABLES } from '../constants/entities.js';

/**
 * Envia un mensaje en el chat de una reunión.
 * POST /meetings/:meetingId/messages
 */
export const sendMessage = async (req, res) => {
  const { meetingId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  try {
    // 1. Validar si la reunión existe y obtener participantes
    const { data: meeting, error: meetingError } = await supabase
      .from(TABLES.MEETINGS)
      .select('creator_id, interested_id')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return res.status(404).json({ error: 'Reunión no encontrada.' });
    }

    // 2. Validar que el emisor sea creador o interesado
    if (userId !== meeting.creator_id && userId !== meeting.interested_id) {
      return res.status(403).json({ error: 'No tienes permiso para enviar mensajes en esta reunión.' });
    }

    // 3. Insertar el mensaje
    const { data: message, error: insertError } = await supabase
      .from(TABLES.MESSAGES)
      .insert([{
        meeting_id: meetingId,
        sender_id: userId,
        content: content
      }])
      .select()
      .single();

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Obtiene el historial de mensajes de una reunión.
 * GET /meetings/:meetingId/messages
 */
export const getMessagesByMeeting = async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Validar si la reunión existe y obtener participantes
    const { data: meeting, error: meetingError } = await supabase
      .from(TABLES.MEETINGS)
      .select('creator_id, interested_id')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return res.status(404).json({ error: 'Reunión no encontrada.' });
    }

    // 2. Validar que el usuario sea creador o interesado de la reunión
    if (userId !== meeting.creator_id && userId !== meeting.interested_id) {
      return res.status(403).json({ error: 'No tienes permiso para ver los mensajes de esta reunión.' });
    }

    // 3. Obtener los mensajes ordenados cronológicamente
    const { data: messages, error: messagesError } = await supabase
      .from(TABLES.MESSAGES)
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return res.status(400).json({ error: messagesError.message });
    }

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
