import { supabase } from '../config/supabaseClient.js';
import { TABLES } from '../constants/entities.js';

export const getCategories = async (req, res) => {
  const { data, error } = await supabase
    .from(TABLES.CATEGORIES)
    .select('*');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};
