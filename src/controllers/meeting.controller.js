import { supabase } from '../config/supabaseClient.js';
import { TABLES } from '../constants/entities.js';

export const createMeeting = async (req, res) => {
  const { productId, interestedId, locationId, date, time, notes } = req.body;
  const creatorId = req.user.id; // Obtenido del authMiddleware

  const { data, error } = await supabase
    .from(TABLES.MEETINGS)
    .insert([{
      product_id: productId,
      creator_id: creatorId,
      interested_id: interestedId,
      location_id: locationId,
      meeting_date: date,
      meeting_time: time,
      status: 'pending',
      notes
    }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
};

export const confirmMeeting = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Paso 1: Consultar la reunión para validar participantes
  const { data: meeting, error: selectError } = await supabase
    .from(TABLES.MEETINGS)
    .select('creator_id, interested_id')
    .eq('id', id)
    .single();

  if (selectError) return res.status(400).json({ error: selectError.message });
  if (!meeting) return res.status(404).json({ error: 'Reunión no encontrada' });

  // Paso 2: Validar que el usuario sea el creador o el interesado de la reunión
  if (userId !== meeting.creator_id && userId !== meeting.interested_id) {
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
};

export const cancelMeeting = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Paso 1: Consultar la reunión para validar participantes
  const { data: meeting, error: selectError } = await supabase
    .from(TABLES.MEETINGS)
    .select('creator_id, interested_id')
    .eq('id', id)
    .single();

  if (selectError) return res.status(400).json({ error: selectError.message });
  if (!meeting) return res.status(404).json({ error: 'Reunión no encontrada' });

  // Paso 2: Validar que el usuario sea participante de la reunión
  if (userId !== meeting.creator_id && userId !== meeting.interested_id) {
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
};