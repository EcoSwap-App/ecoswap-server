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
    }]).select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  res.json(data[0]);
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { data: existingProduct, error: checkError } = await supabase
    .from('products')
    .select('user_id')
    .eq('id', id);

  if (checkError) return res.status(400).json({ error: checkError.message });
  if (!existingProduct || existingProduct.length === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  if (existingProduct[0].user_id !== userId) {
    return res.status(403).json({ error: 'No tienes permisos para modificar este producto' });
  }

  const { data, error } = await supabase
    .from('products')
    .update(req.body)
    .eq('id', id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { data: existingProduct, error: checkError } = await supabase
    .from('products')
    .select('user_id')
    .eq('id', id);

  if (checkError) return res.status(400).json({ error: checkError.message });
  if (!existingProduct || existingProduct.length === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  if (existingProduct[0].user_id !== userId) {
    return res.status(403).json({ error: 'No tienes permisos para eliminar este producto' });
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json({ message: 'Producto eliminado correctamente' });
};

export const getAllProducts = async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('available', true);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};