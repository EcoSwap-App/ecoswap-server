import { supabase } from '../config/supabaseClient.js';
import { TABLES } from '../constants/entities.js';

/**
 * Crea una nueva conversación (Chat).
 * POST /chats
 */
export const createChat = async (req, res) => {
  const { productId, sellerId } = req.body;
  const buyerId = req.user.id;

  if (buyerId === sellerId) {
    return res.status(400).json({ error: 'No puedes iniciar un chat contigo mismo.' });
  }

  try {
    // Verificar si ya existe el chat
    const { data: existing, error: findError } = await supabase
      .from(TABLES.CHATS)
      .select('*')
      .eq('product_id', productId)
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .maybeSingle();

    if (findError) return res.status(400).json({ error: findError.message });
    if (existing) return res.status(200).json(existing);

    // Si no existe, crearlo
    const { data: chat, error: insertError } = await supabase
      .from(TABLES.CHATS)
      .insert([{
        product_id: productId,
        buyer_id: buyerId,
        seller_id: sellerId
      }])
      .select()
      .single();

    if (insertError) return res.status(400).json({ error: insertError.message });
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Obtiene las conversaciones del usuario autenticado.
 * GET /chats/my-chats
 */
export const getMyChats = async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: chats, error } = await supabase
      .from(TABLES.CHATS)
      .select('*, products(title)')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Obtiene el historial de mensajes de una conversación.
 * GET /chats/:chatId/messages
 */
export const getChatMessages = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  try {
    // Validar participación
    const { data: chat, error: chatError } = await supabase
      .from(TABLES.CHATS)
      .select('buyer_id, seller_id')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Conversación no encontrada.' });
    }

    if (userId !== chat.buyer_id && userId !== chat.seller_id) {
      return res.status(403).json({ error: 'No tienes permiso para ver los mensajes de esta conversación.' });
    }

    // Obtener mensajes
    const { data: messages, error: msgError } = await supabase
      .from(TABLES.MESSAGES)
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (msgError) return res.status(400).json({ error: msgError.message });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Envia un mensaje en una conversación.
 * POST /chats/:chatId/messages
 */
export const sendChatMessage = async (req, res) => {
  const { chatId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  try {
    // Validar participación
    const { data: chat, error: chatError } = await supabase
      .from(TABLES.CHATS)
      .select('buyer_id, seller_id')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Conversación no encontrada.' });
    }

    if (userId !== chat.buyer_id && userId !== chat.seller_id) {
      return res.status(403).json({ error: 'No tienes permiso para enviar mensajes en esta conversación.' });
    }

    // Insertar mensaje
    const { data: message, error: insertError } = await supabase
      .from(TABLES.MESSAGES)
      .insert([{
        chat_id: chatId,
        sender_id: userId,
        content: content
      }])
      .select()
      .single();

    if (insertError) return res.status(400).json({ error: insertError.message });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Elimina una conversación (Chat) y por cascada sus mensajes y reuniones.
 * DELETE /chats/:chatId
 */
export const deleteChat = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Validar participación en el chat antes de permitir eliminar
    const { data: chat, error: chatError } = await supabase
      .from(TABLES.CHATS)
      .select('buyer_id, seller_id')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Conversación no encontrada.' });
    }

    if (userId !== chat.buyer_id && userId !== chat.seller_id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta conversación.' });
    }

    // 2. Eliminar de la base de datos
    const { error: deleteError } = await supabase
      .from(TABLES.CHATS)
      .delete()
      .eq('id', chatId);

    if (deleteError) return res.status(400).json({ error: deleteError.message });
    res.status(200).json({ message: 'Conversación eliminada con éxito.' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
