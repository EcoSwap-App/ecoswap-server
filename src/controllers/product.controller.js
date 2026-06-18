import { supabase } from '../config/supabaseClient.js';
import cloudinary from '../config/cloudinary.js';
import { TABLES } from '../constants/entities.js';

/**
 * Registra un nuevo producto.
 * Primero sube la imagen (Base64) a Cloudinary para optimización
 * y luego guarda la URL resultante en la base de datos de Supabase.
 */
export const createProduct = async (req, res) => {
  const { title, price, imagesBase64, category, description, type } = req.body;
  let uploadUrls = [];

  try {
    if (imagesBase64 && imagesBase64.length > 0) {
      // Sube las imágenes a Cloudinary en formato Base64 optimizándolas en paralelo
      const uploadPromises = imagesBase64.map(base64 =>
        cloudinary.uploader.upload(base64, {
          folder: 'ecoswap-app/products',
          transformation: [
            { width: 800, height: 800, crop: "limit" }, // Limita tamaño máximo
            { quality: 35 },                            // Comprime calidad para ahorrar ancho de banda
            { fetch_format: "auto" }                    // Convierte a formatos modernos como WebP automáticamente
          ]
        })
      );
      const uploadResults = await Promise.all(uploadPromises);
      uploadUrls = uploadResults.map(result => result.secure_url);
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  // Inserta el producto en Supabase vinculándolo al usuario autenticado (req.user.id)
  const { data, error } = await supabase
    .from(TABLES.PRODUCTS)
    .insert([{
      title,
      price,
      description,
      category_id: category,
      image_url: uploadUrls,
      user_id: req.user.id,
      status: req.body.status || 'used',
      available: true,
      model_3d: req.body.model3d,
      type: type || 'sale'
    }]).select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from(TABLES.PRODUCTS)
    .select('*')
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  res.json(data[0]);
};

/**
 * Actualiza un producto existente.
 * Valida previamente que el producto exista y que el usuario solicitante sea el propietario.
 */
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Paso 1: Verificar existencia y obtener propietario del producto
  const { data: existingProduct, error: checkError } = await supabase
    .from(TABLES.PRODUCTS)
    .select('user_id')
    .eq('id', id);

  if (checkError) return res.status(400).json({ error: checkError.message });
  if (!existingProduct || existingProduct.length === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  // Paso 2: Validar propiedad (solo el creador puede editar)
  if (existingProduct[0].user_id !== userId) {
    return res.status(403).json({ error: 'No tienes permisos para modificar este producto' });
  }

  // Paso 3: Realizar la actualización
  const { title, price, model3d, status, available, description, type } = req.body;
  const { data, error } = await supabase
    .from(TABLES.PRODUCTS)
    .update({ title, price, model_3d: model3d, status, available, description, type })
    .eq( 'id', id )
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
};

/**
 * Elimina un producto.
 * Valida previamente propiedad del producto.
 */
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Paso 1: Verificar existencia y propiedad
  const { data: existingProduct, error: checkError } = await supabase
    .from(TABLES.PRODUCTS)
    .select('user_id')
    .eq('id', id);

  if (checkError) return res.status(400).json({ error: checkError.message });
  if (!existingProduct || existingProduct.length === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  if (existingProduct[0].user_id !== userId) {
    return res.status(403).json({ error: 'No tienes permisos para eliminar este producto' });
  }

  // Paso 2: Eliminar físicamente el producto de la base de datos
  const { error } = await supabase
    .from(TABLES.PRODUCTS)
    .delete()
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json({ message: 'Producto eliminado correctamente' });
};

/**
 * Obtiene todos los productos que sigan marcados como disponibles.
 */
export const getAllProducts = async (req, res) => {
  const { userId, excludeUserId } = req.query;
  let query = supabase
    .from(TABLES.PRODUCTS)
    .select('*')
    .eq('available', true);

  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (excludeUserId) {
    query = query.neq('user_id', excludeUserId);
  }

  const { data, error } = await query;

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};
