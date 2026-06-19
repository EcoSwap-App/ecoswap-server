import { supabase } from '../config/supabaseClient.js';
import { TABLES } from '../constants/entities.js';

export const createMeeting = async (req, res) => {
  const { chatId, locationId, date, time, notes } = req.body;
  const creatorId = req.user.id; // Obtenido del authMiddleware

  try {
    // 1. Validar si el chat existe y obtener participantes
    const { data: chat, error: chatError } = await supabase
      .from(TABLES.CHATS)
      .select('buyer_id, seller_id')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Chat no encontrado.' });
    }

    // 2. Validar que el creador de la reunión sea participante del chat
    if (creatorId !== chat.buyer_id && creatorId !== chat.seller_id) {
      return res.status(403).json({ error: 'No tienes permiso para crear una reunión en este chat.' });
    }

    const { data, error } = await supabase
      .from(TABLES.MEETINGS)
      .insert([{
        chat_id: chatId,
        location_id: locationId,
        meeting_date: date,
        meeting_time: time,
        status: 'pending',
        notes
      }])
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const confirmMeeting = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Paso 1: Consultar la reunión para validar participantes
    const { data: meeting, error: selectError } = await supabase
      .from(TABLES.MEETINGS)
      .select('*, chats:chat_id(buyer_id, seller_id)')
      .eq('id', id)
      .single();

    if (selectError) return res.status(400).json({ error: selectError.message });
    if (!meeting) return res.status(404).json({ error: 'Reunión no encontrada' });

    const chat = meeting.chats;
    if (!chat) return res.status(400).json({ error: 'Chat asociado no encontrado' });

    // Paso 2: Validar que el usuario sea participante del chat
    if (userId !== chat.buyer_id && userId !== chat.seller_id) {
      return res.status(403).json({ error: 'No tienes permisos para confirmar esta reunión' });
    }

    // Paso 3: Realizar la actualización
    const { data, error } = await supabase
      .from(TABLES.MEETINGS)
      .update({ status: 'confirmed' })
      .eq('id', id)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const cancelMeeting = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Paso 1: Consultar la reunión para validar participantes
    const { data: meeting, error: selectError } = await supabase
      .from(TABLES.MEETINGS)
      .select('*, chats:chat_id(buyer_id, seller_id)')
      .eq('id', id)
      .single();

    if (selectError) return res.status(400).json({ error: selectError.message });
    if (!meeting) return res.status(404).json({ error: 'Reunión no encontrada' });

    const chat = meeting.chats;
    if (!chat) return res.status(400).json({ error: 'Chat asociado no encontrado' });

    // Paso 2: Validar que el usuario sea participante
    if (userId !== chat.buyer_id && userId !== chat.seller_id) {
      return res.status(403).json({ error: 'No tienes permisos para cancelar esta reunión' });
    }

    // Paso 3: Realizar la actualización del estado
    const { data, error } = await supabase
      .from(TABLES.MEETINGS)
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};