const TRIPO_API_BASE = process.env.TRIPO_API_BASE || 'https://api.tripo3d.ai/v2/openapi';

// Mapa en memoria para simular el progreso de las tareas mockeadas
const mockTasksProgress = new Map();

/**
 * Verifica si el sistema está operando en modo Mock / Sandbox
 */
const isMockMode = () => {
  return process.env.MOCK_3D_GENERATION === 'true' || process.env.TRIPO_API_KEY === 'mock';
};

/**
 * Convierte una imagen en Base64 a un Blob compatible con FormData.
 */
function base64ToBlob(base64Image) {
  const parts = base64Image.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const b64Data = parts[1];
  const buffer = Buffer.from(b64Data, 'base64');
  return new Blob([buffer], { type: mime });
}

/**
 * Sube una imagen en formato Base64 a Tripo3D para obtener un file/image token.
 */
export const uploadImageToTripo = async (base64Image) => {
  if (isMockMode()) {
    console.log('⚡ [Tripo3D Mock] Simulando subida de imagen...');
    return `mock-file-token-${Math.random().toString(36).substring(7)}`;
  }

  const apiKey = process.env.TRIPO_API_KEY;
  if (!apiKey) {
    throw new Error('TRIPO_API_KEY no está configurada en las variables de entorno.');
  }

  const blob = base64ToBlob(base64Image);
  const formData = new FormData();
  formData.append('file', blob, 'image.png');

  const response = await fetch(`${TRIPO_API_BASE}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  });

  const result = await response.json();
  if (!response.ok || result.code !== 0) {
    throw new Error(result.message || 'Error al subir la imagen a Tripo3D');
  }

  const token = result.data?.image_token || result.data?.file_token;
  if (!token) {
    throw new Error('No se recibió un token de archivo de Tripo3D');
  }

  return token;
};

/**
 * Crea una tarea de generación 3D con múltiples imágenes (multiview_to_model).
 */
export const createMultiviewTask = async (fileTokens) => {
  if (isMockMode()) {
    const mockTaskId = `mock-task-${Date.now()}`;
    console.log(`⚡ [Tripo3D Mock] Creando tarea simulada con ID: ${mockTaskId}`);
    // Inicializamos el progreso de la tarea simulada en 0%
    mockTasksProgress.set(mockTaskId, {
      status: 'pending',
      progress: 0,
      startedAt: Date.now()
    });
    return mockTaskId;
  }

  const apiKey = process.env.TRIPO_API_KEY;
  if (!apiKey) {
    throw new Error('TRIPO_API_KEY no está configurada en las variables de entorno.');
  }

  const response = await fetch(`${TRIPO_API_BASE}/task`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'multiview_to_model',
      files: fileTokens,
      model_version: 'v3.0',
      texture: true,
      pbr: true
    })
  });

  const result = await response.json();
  if (!response.ok || result.code !== 0) {
    throw new Error(result.message || 'Error al crear la tarea de generación 3D en Tripo3D');
  }

  const taskId = result.data?.task_id;
  if (!taskId) {
    throw new Error('No se recibió un task_id para la tarea de modelado 3D');
  }

  return taskId;
};

/**
 * Consulta el estado y progreso de una tarea específica en Tripo3D.
 */
export const getTaskStatus = async (taskId) => {
  if (isMockMode() || taskId.startsWith('mock-')) {
    const task = mockTasksProgress.get(taskId) || {
      status: 'pending',
      progress: 0,
      startedAt: Date.now()
    };

    const elapsedSeconds = (Date.now() - task.startedAt) / 1000;
    
    // Simular incremento de progreso: 20% por segundo
    let currentProgress = Math.min(100, Math.floor(elapsedSeconds * 20));
    let currentStatus = 'running';

    if (currentProgress >= 100) {
      currentStatus = 'success';
      currentProgress = 100;
    } else if (currentProgress === 0) {
      currentStatus = 'pending';
    }

    // Actualizamos el progreso en nuestro mapa en memoria
    mockTasksProgress.set(taskId, {
      ...task,
      status: currentStatus,
      progress: currentProgress
    });

    console.log(`⚡ [Tripo3D Mock] Tarea ${taskId} - Estado: ${currentStatus} (${currentProgress}%)`);

    if (currentStatus === 'success') {
      return {
        task_id: taskId,
        status: 'success',
        progress: 100,
        output: {
          // Retornamos un modelo 3D GLB público y de libre uso para probar el visor del frontend
          model: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'
        }
      };
    }

    return {
      task_id: taskId,
      status: currentStatus,
      progress: currentProgress
    };
  }

  const apiKey = process.env.TRIPO_API_KEY;
  if (!apiKey) {
    throw new Error('TRIPO_API_KEY no está configurada en las variables de entorno.');
  }

  const response = await fetch(`${TRIPO_API_BASE}/task/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  const result = await response.json();
  if (!response.ok || result.code !== 0) {
    throw new Error(result.message || 'Error al consultar la tarea de Tripo3D');
  }

  return result.data;
};
