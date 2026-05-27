import { supabase } from '../config/supabaseClient.js';
import { TABLES } from '../constants/entities.js';

export const syncProfile = async (req, res) => {
  const { name, career, cycle } = req.body;
  const { id, email } = req.user;

  if (!email.endsWith('@upc.edu.pe')) {
    return res.status(403).json({ error: 'Solo se permiten correos de la UPC' });
  }

  const { data, error } = await supabase
    .from(TABLES.USERS)
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

  // 1. Obtener datos básicos del usuario
  const { data: user, error: userError } = await supabase
    .from(TABLES.USERS)
    .select('name, reputation, career')
    .eq('id', userId)
    .single();

  if (userError) return res.status(400).json({ error: userError.message });

  // 2. Contar productos vendidos/donados
  const { count, error: countError } = await supabase
    .from(TABLES.PRODUCTS)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('available', false);

  if (countError) return res.status(400).json({ error: countError.message });

  // 3. Responder manteniendo la estructura esperada por el cliente
  res.json({
    name: user.name,
    reputation: user.reputation,
    career: user.career,
    products: [{ count: count || 0 }]
  });
};