// server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Importar rutas
import authRoutes from './routes/auth.js';
import imageRoutes from './routes/images.js';
import pushRoutes from './routes/push.js';
import notificationRoutes from './routes/notifications.js';
import postRoutes from './routes/posts.js';
import userRoutes from './routes/users.js';

// Configurar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pwa_app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

connectDB();

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://frontendxdxd.vercel.app'
  ],
  credentials: true
}));

// Middleware de logging mejorado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`🌐 ${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Middleware para medir performance
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`⏱️  ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);

// Ruta de salud mejorada
app.get('/api/health', async (req, res) => {
  const healthCheck = {
    success: true,
    message: '🚀 Servidor backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '2.0.0'
  };

  // Verificar salud de la base de datos
  try {
    await mongoose.connection.db.admin().ping();
    healthCheck.databaseStatus = 'healthy';
  } catch (error) {
    healthCheck.databaseStatus = 'unhealthy';
    healthCheck.databaseError = error.message;
  }

  res.json(healthCheck);
});

// Ruta de información del sistema
app.get('/api/system-info', (req, res) => {
  res.json({
    success: true,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    },
    features: {
      notifications: true,
      offlineSupport: true,
      userMessaging: true,
      backgroundSync: true
    }
  });
});

// Ruta principal actualizada
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido al backend de la PWA - Full Stack',
    version: '2.0.0',
    description: 'Aplicación PWA completa con React, MongoDB, JWT y notificaciones push',
    endpoints: {
      auth: '/api/auth',
      images: '/api/images',
      push: '/api/push',
      notifications: '/api/notifications',
      posts: '/api/posts',
      users: '/api/users',
      health: '/api/health',
      system: '/api/system-info'
    },
    features: [
      '✅ Autenticación JWT',
      '🔔 Notificaciones Push',
      '📱 Funcionalidad Offline',
      '👥 Notificaciones entre usuarios',
      '💾 Almacenamiento local con IndexedDB',
      '🔄 Background Sync',
      '🎯 PWA completa'
    ]
  });
});

// Middleware para manejar CORS pre-flight
app.options('*', cors());

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    requestedUrl: req.originalUrl,
    availableEndpoints: [
      '/api/auth',
      '/api/images', 
      '/api/push',
      '/api/notifications',
      '/api/posts',
      '/api/users',
      '/api/health',
      '/api/system-info'
    ]
  });
});

// Manejo de errores global mejorado
app.use((error, req, res, next) => {
  console.error('❌ Error del servidor:', error);

  const errorResponse = {
    success: false,
    error: 'Error interno del servidor',
    timestamp: new Date().toISOString()
  };

  // En desarrollo, incluir más detalles del error
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = error.message;
    errorResponse.stack = error.stack;
  }

  res.status(500).json(errorResponse);
});

// Manejar cierre graceful
process.on('SIGINT', async () => {
  console.log('🛑 Recibido SIGINT. Cerrando servidor...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Recibido SIGTERM. Cerrando servidor...');
  await mongoose.connection.close();
  process.exit(0);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('=====================================');
  console.log(' 🚀 Servidor backend FULL STACK iniciado');
  console.log(` 📍 URL: http://localhost:${PORT}`);
  console.log(' ⚙️  Entorno:', process.env.NODE_ENV || 'development');
  console.log(' 🗄️  MongoDB:', process.env.MONGODB_URI ? '✅ Conectado' : '❌ No configurado');
  console.log(' 🔔 Notificaciones push: ✅ CONFIGURADAS');
  console.log(' 👥 Notificaciones entre usuarios: ✅ ACTIVAS');
  console.log(' 💾 Endpoint de posts: ✅ DISPONIBLE');
  console.log(' 👤 Endpoint de usuarios: ✅ DISPONIBLE');
  console.log(` 🔑 VAPID Key: ${process.env.VAPID_PUBLIC_KEY?.substring(0, 20)}...`);
  console.log('=====================================');
});

export default app;