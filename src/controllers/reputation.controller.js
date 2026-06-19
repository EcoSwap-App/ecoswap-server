import { supabase } from '../config/supabaseClient.js';
import { TABLES } from '../constants/entities.js';

export const rateUser = async (req, res) => {
  const { targetUserId, points, meetingId, reason } = req.body;
  const reviewerId = req.user.id;

  if (!meetingId) {
    return res.status(400).json({ error: 'El ID de la reunión es obligatorio para calificar a un usuario.' });
  }

  try {
    // 1. Obtener la reunión y los participantes de la conversación asociada
    const { data: meeting, error: meetingError } = await supabase
      .from(TABLES.MEETINGS)
      .select('status, chats:chat_id(buyer_id, seller_id)')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return res.status(404).json({ error: 'Reunión no encontrada o inválida.' });
    }

    const chat = meeting.chats;
    if (!chat) {
      return res.status(400).json({ error: 'Conversación asociada no encontrada.' });
    }

    // 2. Validar que la reunión esté confirmada/completada
    if (meeting.status !== 'confirmed') {
      return res.status(400).json({ 
        error: 'Solo puedes calificar a un usuario si el encuentro ha sido confirmado.' 
      });
    }

    // 3. Validar que el calificador y el calificado pertenezcan al encuentro
    const isReviewerInChat = reviewerId === chat.buyer_id || reviewerId === chat.seller_id;
    const isTargetInChat = targetUserId === chat.buyer_id || targetUserId === chat.seller_id;

    if (!isReviewerInChat || !isTargetInChat || reviewerId === targetUserId) {
      return res.status(403).json({ 
        error: 'No tienes permiso para calificar a este usuario para este encuentro.' 
      });
    }

    // 4. Validar que no se haya calificado antes esta misma reunión
    const { data: existingRate, error: rateCheckError } = await supabase
      .from(TABLES.REPUTATIONS)
      .select('id')
      .eq('meeting_id', meetingId)
      .eq('reviewer_id', reviewerId)
      .maybeSingle();

    if (rateCheckError) throw rateCheckError;
    if (existingRate) {
      return res.status(400).json({ error: 'Ya has calificado este encuentro anteriormente.' });
    }

    // 5. Insertar la calificación
    const { data: insertedData, error: rateError } = await supabase
      .from(TABLES.REPUTATIONS)
      .insert([{ 
        user_id: targetUserId, 
        points, 
        reason,
        meeting_id: meetingId,
        reviewer_id: reviewerId 
      }])
      .select()
      .single();

    if (rateError) throw rateError;

    // 6. Recalcular promedio de reputación
    const { data: allRates, error: selectError } = await supabase
      .from(TABLES.REPUTATIONS)
      .select('points')
      .eq('user_id', targetUserId);

    if (selectError) throw selectError;

    let average = points;
    if (allRates && allRates.length > 0) {
      average = allRates.reduce((acc, curr) => acc + curr.points, 0) / allRates.length;
    }

    // 7. Actualizar el perfil del usuario
    const { error: updateError } = await supabase
      .from(TABLES.USERS)
      .update({ reputation: average })
      .eq('id', targetUserId);

    if (updateError) throw updateError;

    res.status(201).json({ 
      message: 'Calificación registrada', 
      newReputation: average,
      review: insertedData 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};