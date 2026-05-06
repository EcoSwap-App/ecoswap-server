import { supabase } from '../config/supabaseClient.js';

export const syncProfile = async (req, res) => {
  const { name, career, cycle } = req.body;
  const { id, email } = req.user;

  if (!email.endsWith('@upc.edu.pe')) {
    return res.status(403).json({ error: 'Solo se permiten correos de la UPC' });
  }

  const { data, error } = await supabase
    .from('users')
    .upsert({
      id,
      name,
      email,
      career,
      cycle,
      reputation: 5.0, // Reputación inicial base
      verified: true
    })
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
};

export const getUserStats = async (req, res) => {
  const userId = req.user.id;

  // Obtenemos datos del usuario y sumamos puntos de impacto de sus productos vendidos
  const { data, error } = await supabase
    .from('users')
    .select(`
      name, reputation, career,
      products!inner(count)
    `)
    .eq('id', userId)
    .eq('products.available', false); // Contamos solo lo ya vendido/donado

  if (error) return res.status(400).json(error);
  res.json(data[0]);
};