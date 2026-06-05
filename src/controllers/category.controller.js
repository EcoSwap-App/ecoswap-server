import { supabase } from '../config/supabaseClient.js';
import { TABLES } from '../constants/entities.js';

/**
 * Obtiene todas las categorías disponibles en el sistema.
 */
export const getAllCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
