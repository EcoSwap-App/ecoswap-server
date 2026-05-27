import { app, server } from './src/server.js';
import { supabase } from './src/config/supabaseClient.js';
import cloudinary from './src/config/cloudinary.js';
import { TABLES } from './src/constants/entities.js';

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Verificación de Servicios
    const cloudRes = await cloudinary.api.ping();
    console.log('✅ Cloudinary listo');

    try {
      const { error } = await supabase.from(TABLES.PRODUCTS).select('*').limit(1);
      if (error) throw error;
      console.log('✅ Supabase listo');
    } catch (sbError) {
      console.warn('⚠️ Advertencia: No se pudo verificar la conexión con Supabase:', sbError.message);
    }

    server.listen(PORT, () => {
      console.log(`🚀 Servidor en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el sistema:', error.message);
    process.exit(1);
  }
}

start();