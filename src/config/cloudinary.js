import { v2 as cloudinary } from 'cloudinary';

// Configura el cliente de Cloudinary utilizando las credenciales cargadas desde el archivo .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// logger.info('📦 Cloudinary configurado:', {
//     cloud_name: cloudinary.config().cloud_name,
//     api_key: cloudinary.config().api_key ? '✅ Presente' : '❌ Falta',
//     api_secret: cloudinary.config().api_secret ? '✅ Presente' : '❌ Falta',
// });

try {
    const result = await cloudinary.api.ping();
    console.log("✅ ¡Conexión exitosa!", result);
} catch (error) {
    console.log("❌ Error de autenticación:", error.message);
}

export default cloudinary;

