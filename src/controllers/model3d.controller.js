import { supabase } from '../config/supabaseClient.js';
import { TABLES } from '../constants/entities.js';
import { uploadImageToTripo, createMultiviewTask, getTaskStatus } from '../service/model3d.service.js';

/**
 * Inicia el proceso de generación de modelo 3D para un producto.
 * Sube las imágenes a Tripo3D y crea la tarea multiview_to_model.
 */
export const generate3DModel = async (req, res) => {
  const { id: productId } = req.params;
  const { images } = req.body; // Array de imágenes en Base64
  const userId = req.user.id;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'Se requiere un arreglo de imágenes en formato Base64' });
  }

  try {
    // 1. Verificar existencia y propiedad del producto
    const { data: product, error: checkError } = await supabase
      .from(TABLES.PRODUCTS)
      .select('user_id')
      .eq('id', productId)
      .single();

    if (checkError || !product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (product.user_id !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para modificar este producto' });
    }

    // 2. Subir imágenes a Tripo3D
    const fileTokens = [];
    for (const imgBase64 of images) {
      const token = await uploadImageToTripo(imgBase64);
      fileTokens.push(token);
    }

    // 3. Crear la tarea multiview en Tripo3D
    const taskId = await createMultiviewTask(fileTokens);

    res.status(202).json({
      message: 'Proceso de modelado 3D iniciado correctamente',
      taskId,
      status: 'queued'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Consulta el estado de la tarea en Tripo3D y, si es exitosa,
 * actualiza el campo model_3d del producto en Supabase.
 */
export const check3DTaskStatus = async (req, res) => {
  const { id: productId, taskId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Verificar existencia y propiedad del producto
    const { data: product, error: checkError } = await supabase
      .from(TABLES.PRODUCTS)
      .select('user_id')
      .eq('id', productId)
      .single();

    if (checkError || !product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (product.user_id !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para consultar esta tarea' });
    }

    // 2. Consultar estado en Tripo3D
    const taskData = await getTaskStatus(taskId);
    const status = taskData.status; // success, running, pending, failed
    const progress = taskData.progress || 0;

    if (status === 'success') {
      const modelUrl = taskData.output?.model || taskData.result?.model || taskData.output?.model_url || taskData.result?.model_url;
      if (modelUrl) {
        // Actualizar el campo model_3d en Supabase
        const { error: updateError } = await supabase
          .from(TABLES.PRODUCTS)
          .update({ model_3d: modelUrl })
          .eq('id', productId);

        if (updateError) {
          throw new Error('Error al actualizar el producto con el modelo 3D: ' + updateError.message);
        }

        return res.json({
          status: 'success',
          progress: 100,
          modelUrl
        });
      }
    }

    res.json({
      status,
      progress
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
