import { supabase } from '../config/supabaseClient.js';

export const createReport = async (req, res) => {
  const { reportedUserId, productId, reason } = req.body;
  const reporterId = req.user.id;

  const { data, error } = await supabase
    .from('reports')
    .insert([{
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      product_id: productId,
      reason,
      status: 'pending'
    }])
    .select();

  if (error) return res.status(400).json({ error: error.message });

  res.status(201).json({
    message: 'Reporte enviado correctamente. El equipo de EcoSwap lo revisará.',
    report: data[0]
  });
};

export const getReports = async (req, res) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('status', 'pending');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};


export const getReportById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
};