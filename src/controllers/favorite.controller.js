import { supabase } from '../config/supabaseClient.js';
import { TABLES } from '../constants/entities.js';

/**
 * Obtiene los productos favoritos del usuario autenticado.
 * GET /favorites
 */
export const getMyFavorites = async (req, res) => {
  const userId = req.user.id;

  try {
    const { data, error } = await supabase
      .from(TABLES.FAVORITES)
      .select('*, products(*)')
      .eq('user_id', userId);

    if (error) return res.status(400).json({ error: error.message });
    
    // Extraer los productos de la relación
    const products = (data || []).map(item => item.products).filter(p => p !== null);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Agrega un producto a favoritos.
 * POST /favorites
 */
export const addFavorite = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;

  if (!productId) {
    return res.status(400).json({ error: 'El ID del producto es obligatorio.' });
  }

  try {
    // 1. Validar que el producto exista
    const { data: product, error: prodError } = await supabase
      .from(TABLES.PRODUCTS)
      .select('id')
      .eq('id', productId)
      .single();

    if (prodError || !product) {
      return res.status(404).json({ error: 'El producto no existe.' });
    }

    // 2. Insertar favorito
    const { data, error } = await supabase
      .from(TABLES.FAVORITES)
      .insert([{ user_id: userId, product_id: productId }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(200).json({ message: 'El producto ya está en favoritos.' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Elimina un producto de favoritos.
 * DELETE /favorites/:productId
 */
export const removeFavorite = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    const { error } = await supabase
      .from(TABLES.FAVORITES)
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json({ message: 'Producto eliminado de favoritos con éxito.' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
