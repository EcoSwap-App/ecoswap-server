# EcoSwap - Backend API

Este es el backend del prototipo de **EcoSwap**, una plataforma para el intercambio y donación de productos enfocada en estudiantes. Permite gestionar usuarios, productos, reputación, reportes y reuniones de intercambio, utilizando Supabase como base de datos y Cloudinary para el almacenamiento de imágenes.

## 🚀 Tecnologías Principales

- **Runtime:** Node.js (con soporte para módulos ES6 `"type": "module"`)
- **Framework Web:** Express.js
- **Base de Datos:** Supabase (PostgreSQL)
- **Almacenamiento de Imágenes:** Cloudinary
- **Validación de Esquemas:** Zod
- **Pruebas:** Jest & Supertest

---

## 📁 Estructura del Proyecto

```text
backend/
├── index.js                  # Punto de entrada de la aplicación (Ping de servicios e inicio de servidor)
├── package.json              # Configuración de dependencias y scripts de ejecución
├── .env                      # Variables de entorno (no versionar en producción)
├── src/
│   ├── server.js             # Configuración del servidor express, middlewares y rutas
│   ├── config/               # Clientes de servicios externos (Supabase, Cloudinary)
│   ├── constants/            # Constantes compartidas (ej. nombres de tablas de la base de datos)
│   ├── controllers/          # Lógica de negocio por entidad (creación, edición, eliminación, consultas)
│   ├── middlewares/          # Middlewares (autenticación JWT y validación Zod)
│   ├── routes/               # Enrutadores Express mapeados a sus respectivos controladores
│   ├── schemas/              # Validaciones de entrada de datos usando Zod
│   └── service/              # Servicios auxiliares (ej. notificaciones y eventos)
└── tests/                    # Pruebas automatizadas de endpoints (Autenticación y Productos)
```

---

## 🔑 Variables de Entorno (.env)

Crea un archivo `.env` en la raíz del proyecto (puedes tomar como referencia los siguientes nombres):

```env
PORT=5001
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_supabase_key
JWT_SECRET=tu_secreto_jwt_para_firmar_tokens
CLOUDINARY_CLOUD_NAME=tu_cloudinary_cloud_name
CLOUDINARY_API_KEY=tu_cloudinary_api_key
CLOUDINARY_API_SECRET=tu_cloudinary_api_secret
```

---

## ⚙️ Instalación y Configuración

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   # o alternativamente:
   node index.js
   ```

3. **Ejecutar pruebas unitarias:**
   ```bash
   npm test
   ```

---

## 📡 Endpoints del API

### 👥 Usuarios (`/users`)
- `POST /users/sync-profile` - Sincroniza el perfil del usuario autenticado (requiere JWT).
- `GET /users/stats` - Obtiene las estadísticas del usuario (productos donados/intercambiados, reputación, etc.).

### 📦 Productos (`/products`)
- `GET /products` - Lista todos los productos disponibles.
- `GET /products/:id` - Obtiene la información detallada de un producto por ID.
- `POST /products` - Registra un nuevo producto (requiere autenticación JWT y base64 de imagen).
- `PUT /products/:id` - Actualiza un producto existente (requiere ser el propietario).
- `DELETE /products/:id` - Elimina un producto (requiere ser el propietario).

### 🤝 Reuniones (`/meetings`)
- `POST /meetings` - Crea una nueva solicitud de reunión/intercambio.
- `POST /meetings/:id/confirm` - Confirma una reunión (cambia estado a `confirmed`).
- `POST /meetings/:id/cancel` - Cancela una reunión (cambia estado a `cancelled`).
- `GET /meetings/my-meetings` - Obtiene las reuniones del usuario autenticado (tanto como creador o interesado).

### ⭐ Reputación (`/reputation`)
- `POST /reputation` - Califica a un usuario tras un intercambio. Actualiza el promedio de reputación del usuario destino.

### 🚨 Reportes (`/reports`)
- `POST /reports` - Crea un reporte de un producto o usuario.
- `GET /reports` - Lista los reportes pendientes (equipo de administración).
- `GET /reports/:id` - Detalle de un reporte específico.
