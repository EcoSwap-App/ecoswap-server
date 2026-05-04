import { supabase } from '../config/supabaseClient.js';
import cloudinary from '../config/cloudinary.js';

export const createProduct = async (req, res) => {
  const { title, price, imageBase64, category } = req.body;
  let uploadRes;

  try {
    uploadRes = await cloudinary.uploader.upload(imageBase64, {
      folder: 'ecoswap-app/products',
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: 35 },
        { fetch_format: "auto" }
      ]
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const { data, error } = await supabase
    .from('products')
    .insert([{
      title,
      price,
      category_id: category,
      image_url: uploadRes.secure_url,
      user_id: req.user.id,
      status: req.body.status || 'used',
      available: true,
      model_3d: req.body.model3d
    }]);

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

export const getAllProducts = async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('available', true);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};