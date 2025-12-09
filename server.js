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

// ==================== CONFIGURACIÓN CORS CORREGIDA ====================
// ¡IMPORTANTE! Solo permitir FRONTENDS, no el backend mismo
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de orígenes PERMITIDOS (solo frontends)
    const allowedOrigins = [
      // Desarrollo local
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      
      // Producción Vercel
      'https://pwa-front-nuevo.vercel.app',
      'https://pwa-front-nuevo-*.vercel.app',
      'https://pwa-front-nuevo-git-main-*.vercel.app',
      'https://pwa-front-nuevo-git-*.vercel.app',
      
      // Dominios específicos de Vercel (todos los que has usado)
      'https://pwa-front-nuevo-rockbonsai2004.vercel.app',
      'https://pwa-front-nuevo-rnorx37gf-bruno-fixs-projects.vercel.app',
      'https://pwa-front-nuevo-rnorx37gf-bruno-felixs-projects.vercel.app',
      'https://pwa-front-nuevo-6w5g.vercel.app',
      'https://pwa-front-nuevo-a0ozr9az6-bruno-felixs-projects.vercel.app'
    ];
    
    // Permitir peticiones sin origen (Postman, curl, servidor a servidor)
    if (!origin) {
      console.log('🌐 Petición sin origen (Postman/curl/servidor) - PERMITIDA');
      return callback(null, true);
    }
    
    // Verificar si el origen está permitido
    let isAllowed = false;
    
    for (const allowed of allowedOrigins) {
      // Si tiene wildcard (*)
      if (allowed.includes('*')) {
        const pattern = '^' + allowed.replace(/\*/g, '.*') + '$';
        const regex = new RegExp(pattern);
        if (regex.test(origin)) {
          isAllowed = true;
          break;
        }
      }
      // Comparación exacta
      else if (origin === allowed) {
        isAllowed = true;
        break;
      }
    }
    
    if (isAllowed) {
      console.log(`✅ Origen CORS permitido: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ Origen CORS BLOQUEADO: ${origin}`);
      console.log(`   Orígenes permitidos: ${allowedOrigins.join(', ')}`);
      callback(new Error(`Origen ${origin} no permitido por CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-Auth-Token'
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  maxAge: 86400, // 24 horas
  preflightContinue: false,
  optionsSuccessStatus: 200
};

// Aplicar CORS
app.use(cors(corsOptions));

// Middleware adicional para headers CORS (seguridad extra)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Solo agregar headers si el origen está en nuestra lista
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://pwa-front-nuevo.vercel.app',
    'https://pwa-front-nuevo-*.vercel.app'
  ];
  
  let originAllowed = false;
  
  for (const allowed of allowedOrigins) {
    if (allowed.includes('*')) {
      const pattern = '^' + allowed.replace(/\*/g, '.*') + '$';
      const regex = new RegExp(pattern);
      if (origin && regex.test(origin)) {
        originAllowed = true;
        break;
      }
    } else if (origin === allowed) {
      originAllowed = true;
      break;
    }
  }
  
  if (originAllowed && origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  // Manejar preflight OPTIONS inmediatamente
  if (req.method === 'OPTIONS') {
    console.log(`⏱️  OPTIONS preflight para: ${req.path}`);
    return res.status(200).end();
  }
  
  next();
});

// ==================== MIDDLEWARE DE LOGGING ====================
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`🌐 ${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  console.log(`   Origin: ${req.headers.origin || 'No origin'}`);
  console.log(`   User-Agent: ${req.headers['user-agent']?.substring(0, 50)}...`);
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

// ==================== RUTAS ====================
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);

// ==================== RUTAS DEL SISTEMA ====================

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
    cors: {
      allowed: true,
      origin: req.headers.origin || 'No origin header'
    },
    version: '2.0.1',
    endpoints: [
      '/api/auth/*',
      '/api/images/*',
      '/api/push/*',
      '/api/notifications/*',
      '/api/posts/*',
      '/api/users/*'
    ]
  };

  // Verificar salud de la base de datos
  try {
    await mongoose.connection.db.admin().ping();
    healthCheck.databaseStatus = 'healthy';
    healthCheck.databasePing = 'success';
  } catch (error) {
    healthCheck.databaseStatus = 'unhealthy';
    healthCheck.databaseError = error.message;
    healthCheck.databasePing = 'failed';
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
      uptime: process.uptime(),
      pid: process.pid
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT || 5000,
      database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      vapidConfigured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
    },
    cors: {
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://pwa-front-nuevo.vercel.app',
        'https://pwa-front-nuevo-*.vercel.app'
      ],
      currentOrigin: req.headers.origin || 'No origin'
    },
    features: {
      notifications: true,
      offlineSupport: true,
      userMessaging: true,
      backgroundSync: true,
      pushNotifications: true,
      imageUpload: true
    }
  });
});

// Ruta principal actualizada
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Backend PWA Full Stack - Funcionando',
    version: '2.0.1',
    description: 'Aplicación PWA completa con React, MongoDB, JWT y notificaciones push',
    documentation: {
      endpoints: {
        auth: '/api/auth/* (login, register, profile)',
        images: '/api/images/* (upload, get images)',
        push: '/api/push/* (notificaciones push)',
        notifications: '/api/notifications/* (notificaciones entre usuarios)',
        posts: '/api/posts/* (crear, listar posts)',
        users: '/api/users/* (buscar, gestionar usuarios)',
        health: '/api/health (estado del sistema)',
        system: '/api/system-info (información técnica)'
      },
      authentication: 'Bearer Token JWT en header Authorization'
    },
    cors: {
      status: 'Configurado',
      allowedOrigins: [
        'Frontend Vercel: https://pwa-front-nuevo.vercel.app',
        'Local development: http://localhost:3000',
        'Local development: http://localhost:5173'
      ],
      currentRequest: {
        origin: req.headers.origin || 'No origin header',
        method: req.method,
        ip: req.ip
      }
    },
    features: [
      '✅ Autenticación JWT segura',
      '🔔 Notificaciones Push con VAPID',
      '📱 Funcionalidad Offline completa',
      '👥 Notificaciones entre usuarios en tiempo real',
      '💾 Almacenamiento local con IndexedDB',
      '🔄 Background Sync automático',
      '🎯 PWA instalable',
      '🔐 CORS configurado correctamente'
    ],
    status: {
      database: mongoose.connection.readyState === 1 ? '✅ Conectado' : '❌ Desconectado',
      server: '✅ Funcionando',
      cors: '✅ Configurado',
      pushNotifications: process.env.VAPID_PUBLIC_KEY ? '✅ Configurado' : '❌ No configurado'
    }
  });
});

// ==================== MANEJO DE PREFLIGHT OPTIONS ====================
// Handler explícito para OPTIONS (preflight)
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log(`🎯 OPTIONS preflight para ruta: ${req.path}`);
  console.log(`   Origin: ${origin || 'No origin'}`);
  
  // Lista de orígenes que respondemos
  const allowedResponseOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://pwa-front-nuevo.vercel.app'
  ];
  
  // Solo responder con origen si está en la lista
  let responseOrigin = null;
  for (const allowed of allowedResponseOrigins) {
    if (origin && (origin === allowed || origin.includes(allowed.replace('*', '')))) {
      responseOrigin = origin;
      break;
    }
  }
  
  if (responseOrigin) {
    res.header('Access-Control-Allow-Origin', responseOrigin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 horas
  
  res.status(200).json({
    success: true,
    message: 'Preflight OPTIONS aceptado',
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    maxAge: 86400
  });
});

// ==================== MANEJO DE ERRORES ====================

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    requestedUrl: req.originalUrl,
    availableEndpoints: [
      { path: '/', method: 'GET', description: 'Información del API' },
      { path: '/api/health', method: 'GET', description: 'Estado del sistema' },
      { path: '/api/auth/*', method: 'POST,GET', description: 'Autenticación' },
      { path: '/api/push/*', method: 'POST,GET', description: 'Notificaciones push' },
      { path: '/api/users/*', method: 'GET,POST', description: 'Usuarios' },
      { path: '/api/posts/*', method: 'GET,POST', description: 'Publicaciones' }
    ],
    help: 'Verifica la URL o consulta la documentación en /'
  });
});

// Manejo de errores global mejorado
app.use((error, req, res, next) => {
  console.error('❌ Error del servidor:', error);
  
  // Si es error de CORS
  if (error.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'Error CORS',
      message: error.message,
      details: 'El origen no está permitido. Orígenes permitidos: localhost:3000, localhost:5173, pwa-front-nuevo.vercel.app',
      yourOrigin: req.headers.origin || 'No origin header'
    });
  }

  const errorResponse = {
    success: false,
    error: 'Error interno del servidor',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // En desarrollo, incluir más detalles del error
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = error.message;
    errorResponse.stack = error.stack?.split('\n').slice(0, 5);
  }

  res.status(500).json(errorResponse);
});

// ==================== MANEJO DE CIERRE GRACEFUL ====================

process.on('SIGINT', async () => {
  console.log('🛑 Recibido SIGINT. Cerrando servidor...');
  await mongoose.connection.close();
  console.log('✅ Conexión a MongoDB cerrada');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Recibido SIGTERM. Cerrando servidor...');
  await mongoose.connection.close();
  console.log('✅ Conexión a MongoDB cerrada');
  process.exit(0);
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log('=============================================');
  console.log(' 🚀 Servidor backend FULL STACK iniciado');
  console.log(` 📍 URL: http://localhost:${PORT}`);
  console.log(` 🌐 Público: https://pwa-back-nuevo-1.onrender.com`);
  console.log(' ⚙️  Entorno:', process.env.NODE_ENV || 'development');
  console.log(' 🗄️  MongoDB:', mongoose.connection.readyState === 1 ? '✅ Conectado' : '❌ Desconectado');
  console.log(' 🔐 CORS Configurado para:');
  console.log('    - https://pwa-front-nuevo.vercel.app');
  console.log('    - http://localhost:3000');
  console.log('    - http://localhost:5173');
  console.log(' 🔔 Notificaciones push:', 
    process.env.VAPID_PUBLIC_KEY ? '✅ CONFIGURADAS' : '❌ NO CONFIGURADAS');
  if (process.env.VAPID_PUBLIC_KEY) {
    console.log(`    Clave: ${process.env.VAPID_PUBLIC_KEY.substring(0, 20)}...`);
  }
  console.log('=============================================');
});

export default app;