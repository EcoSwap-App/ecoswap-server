import { supabase } from '../config/supabaseClient.js';
import cloudinary from '../config/cloudinary.js';
import { TABLES } from '../constants/entities.js';

/**
 * Extracts Cloudinary public ID from a secure URL.
 */
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    let publicIdWithExt = parts[1];
    if (publicIdWithExt.startsWith('v')) {
      const slashIndex = publicIdWithExt.indexOf('/');
      if (slashIndex !== -1) {
        publicIdWithExt = publicIdWithExt.substring(slashIndex + 1);
      }
    }

    const dotIndex = publicIdWithExt.lastIndexOf('.');
    if (dotIndex !== -1) {
      return publicIdWithExt.substring(0, dotIndex);
    }
    return publicIdWithExt;
  } catch (error) {
    console.error('Error parsing public ID from Cloudinary URL:', error);
    return null;
  }
};

/**
 * Registra un nuevo producto.
 * Primero sube la imagen (Base64) a Cloudinary para optimización
 * y luego guarda la URL resultante en la base de datos de Supabase.
 */
export const createProduct = async (req, res) => {
  console.log('createProduct received body:', req.body);
  const { title, price, imagesBase64, category, description, type, subject } = req.body;
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
      type: type || 'sale',
      subject
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
  console.log('updateProduct received body:', req.body);
  const { title, price, model3d, status, available, description, type, subject, imagesBase64, category } = req.body;
  
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (price !== undefined) updateData.price = price;
  if (model3d !== undefined) updateData.model_3d = model3d;
  if (status !== undefined) updateData.status = status;
  if (available !== undefined) updateData.available = available;
  if (description !== undefined) updateData.description = description;
  if (type !== undefined) updateData.type = type;
  if (subject !== undefined) updateData.subject = subject;
  if (category !== undefined) updateData.category_id = category;

  if (imagesBase64 !== undefined) {
    try {
      // 1. Obtener imágenes actuales del producto
      const { data: currentProduct } = await supabase
        .from(TABLES.PRODUCTS)
        .select('image_url')
        .eq('id', id)
        .maybeSingle();

      const currentUrls = currentProduct?.image_url || [];

      // 2. Identificar e interrumpir imágenes eliminadas en Cloudinary
      const deletedUrls = currentUrls.filter(url => !imagesBase64.includes(url));
      const deletePromises = deletedUrls.map(url => {
        const publicId = getPublicIdFromUrl(url);
        if (publicId) {
          return cloudinary.uploader.destroy(publicId).catch(err => {
            console.error(`Error deleting image ${publicId} on update:`, err);
          });
        }
        return Promise.resolve();
      });
      await Promise.all(deletePromises);

      // 3. Subir nuevas imágenes Base64 y mantener las existentes
      const uploadPromises = imagesBase64.map(async (img) => {
        if (img.startsWith('data:image/')) {
          const uploadResult = await cloudinary.uploader.upload(img, {
            folder: 'ecoswap-app/products',
            transformation: [
              { width: 800, height: 800, crop: "limit" },
              { quality: 35 },
              { fetch_format: "auto" }
            ]
          });
          return uploadResult.secure_url;
        }
        return img;
      });

      updateData.image_url = await Promise.all(uploadPromises);
    } catch (uploadError) {
      return res.status(400).json({ error: `Error procesando imágenes: ${uploadError.message}` });
    }
  }

  const { data, error } = await supabase
    .from(TABLES.PRODUCTS)
    .update(updateData)
    .eq('id', id)
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

  // Paso 1: Verificar existencia, propiedad e imágenes asociadas
  const { data: existingProduct, error: checkError } = await supabase
    .from(TABLES.PRODUCTS)
    .select('user_id, image_url')
    .eq('id', id)
    .maybeSingle();

  if (checkError) return res.status(400).json({ error: checkError.message });
  if (!existingProduct) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  if (existingProduct.user_id !== userId) {
    return res.status(403).json({ error: 'No tienes permisos para eliminar este producto' });
  }

  // Paso 1.5: Eliminar imágenes asociadas en Cloudinary
  const imageUrls = existingProduct.image_url;
  if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
    const deletePromises = imageUrls.map(url => {
      const publicId = getPublicIdFromUrl(url);
      if (publicId) {
        return cloudinary.uploader.destroy(publicId).catch(err => {
          console.error(`Error deleting image ${publicId} from Cloudinary:`, err);
        });
      }
      return Promise.resolve();
    });
    await Promise.all(deletePromises);
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
    .select('*');

  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('available', true);
  }

  if (excludeUserId) {
    query = query.neq('user_id', excludeUserId);
  }

  const { data, error } = await query;

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};
