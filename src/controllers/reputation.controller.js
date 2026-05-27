import { supabase } from '../config/supabaseClient.js';
import { TABLES } from '../constants/entities.js';

export const rateUser = async (req, res) => {
  const { targetUserId, points, meetingId, reason } = req.body;
  const reviewerId = req.user.id;

  try {
    const { error: rateError } = await supabase
      .from(TABLES.REPUTATIONS)
      .insert([{ 
        user_id: targetUserId, 
        points, 
        reason,
        meeting_id: meetingId,
        reviewer_id: reviewerId 
      }]);

    if (rateError) throw rateError;

    const { data: allRates, error: selectError } = await supabase
      .from(TABLES.REPUTATIONS)
      .select('points')
      .eq('user_id', targetUserId);

    if (selectError) throw selectError;

    let average = points;
    if (allRates && allRates.length > 0) {
      average = allRates.reduce((acc, curr) => acc + curr.points, 0) / allRates.length;
    }

    const { error: updateError } = await supabase
      .from(TABLES.USERS)
      .update({ reputation: average })
      .eq('id', targetUserId);

    if (updateError) throw updateError;

    res.status(201).json({ message: 'Calificación registrada', newReputation: average });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};