import express from 'express';
import cors from 'cors';
import http from 'http';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import productRoutes from './routes/product.routes.js';
import userRoutes from './routes/user.routes.js';
import meetingRoutes from './routes/meeting.routes.js';
import reputationRoutes from './routes/reputation.routes.js';
import reportRoutes from './routes/report.routes.js';
import categoryRoutes from './routes/category.routes.js';
import chatRoutes from './routes/chat.routes.js';
import favoriteRoutes from './routes/favorite.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);

// MIDDLEWARES GENERALES
// Habilita el intercambio de recursos de origen cruzado (CORS) para cualquier dominio
app.use(cors({ origin: '*', credentials: true }));
// Middleware para parsear cuerpos JSON. Se establece el límite a 50MB para permitir la recepción de imágenes en Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Servidor de archivos estáticos local para la carpeta 'uploads' (uso alternativo o de fallback para almacenamiento)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// REGISTRO DE RUTAS DEL API
app.use('/products', productRoutes);
app.use('/meetings', meetingRoutes);
app.use('/reputation', reputationRoutes);
app.use('/reports', reportRoutes);
app.use('/users', userRoutes);
app.use('/categories', categoryRoutes);
app.use('/chats', chatRoutes);
app.use('/favorites', favoriteRoutes);
app.use('/notifications', notificationRoutes);

export { app, server };


