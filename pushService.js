import webpush from 'web-push';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

// ==================== CONFIGURACIÓN VAPID MEJORADA ====================
const configureVAPID = () => {
  console.log('\n=== 🔔 CONFIGURANDO VAPID ===');
  
  // Verificar existencia de claves
  const hasPublicKey = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PUBLIC_KEY.length > 0;
  const hasPrivateKey = process.env.VAPID_PRIVATE_KEY && process.env.VAPID_PRIVATE_KEY.length > 0;
  const hasEmail = process.env.VAPID_EMAIL && process.env.VAPID_EMAIL.length > 0;
  
  console.log(`✅ Clave pública: ${hasPublicKey ? 'PRESENTE' : 'FALTANTE'}`);
  console.log(`✅ Clave privada: ${hasPrivateKey ? 'PRESENTE' : 'FALTANTE'}`);
  console.log(`✅ Email VAPID: ${hasEmail ? process.env.VAPID_EMAIL : 'FALTANTE'}`);
  
  if (!hasPublicKey || !hasPrivateKey) {
    console.error('\n❌ ERROR CRÍTICO: Faltan claves VAPID en .env');
    console.error('💡 Solución: Agrega VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY a tu archivo .env');
    console.error('📌 Ejecuta: npx web-push generate-vapid-keys');
    return false;
  }
  
  if (!hasEmail) {
    console.warn('⚠️  VAPID_EMAIL no configurada, usando default');
    process.env.VAPID_EMAIL = 'notifications@example.com';
  }
  
  try {
    // Configurar web-push con detalles VAPID
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL}`,
      process.env.VAPID_PUBLIC_KEY.trim(),
      process.env.VAPID_PRIVATE_KEY.trim()
    );
    
    console.log('✅ Web Push configurado correctamente');
    console.log(`📌 Clave pública (primeros 50 chars): ${process.env.VAPID_PUBLIC_KEY.substring(0, 50)}...`);
    console.log('=== 🔔 VAPID CONFIGURADO ===\n');
    return true;
  } catch (error) {
    console.error('❌ Error configurando VAPID:', error.message);
    console.error('💡 Verifica que las claves sean válidas y tengan formato correcto');
    return false;
  }
};

// Configurar VAPID al inicio
const vapidConfigured = configureVAPID();

class PushService {
  constructor() {
    if (!vapidConfigured) {
      console.warn('⚠️  Servicio push iniciado SIN configuración VAPID');
    } else {
      console.log('🔔 Servicio de notificaciones push inicializado');
    }
  }

  // ==================== GUARDAR SUSCRIPCIÓN MEJORADO ====================
  async saveSubscription(userId, subscription) {
    try {
      console.log('\n📱 RECIBIENDO SUSCRIPCIÓN PUSH:');
      console.log('Usuario ID:', userId);
      console.log('Endpoint:', subscription?.endpoint?.substring(0, 80) + '...');
      console.log('Tiene keys.p256dh:', !!subscription?.keys?.p256dh);
      console.log('Tiene keys.auth:', !!subscription?.keys?.auth);
      
      if (!vapidConfigured) {
        throw new Error('Servicio push no configurado. Faltan claves VAPID.');
      }

      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Validar estructura de la suscripción
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        throw new Error('Estructura de suscripción inválida');
      }

      if (!subscription.keys.p256dh || !subscription.keys.auth) {
        throw new Error('Faltan claves p256dh o auth en la suscripción');
      }

      // Crear objeto de suscripción con estructura correcta
      const subscriptionToSave = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        },
        createdAt: new Date()
      };

      console.log('💾 Guardando suscripción en base de datos...');

      // Verificar si ya existe
      const existingIndex = user.pushSubscriptions.findIndex(
        sub => sub.endpoint === subscriptionToSave.endpoint
      );

      if (existingIndex !== -1) {
        // Actualizar existente
        user.pushSubscriptions[existingIndex] = subscriptionToSave;
        console.log('🔄 Actualizando suscripción existente');
      } else {
        // Agregar nueva
        user.pushSubscriptions.push(subscriptionToSave);
        console.log('➕ Nueva suscripción agregada');
      }

      await user.save();
      
      console.log(`✅ Suscripción guardada para ${user.username}`);
      console.log(`📊 Total suscripciones: ${user.pushSubscriptions.length}`);
      
      return { 
        success: true, 
        message: 'Suscripción guardada correctamente',
        vapidPublicKey: process.env.VAPID_PUBLIC_KEY
      };
    } catch (error) {
      console.error('❌ Error guardando suscripción:', error);
      throw error;
    }
  }

  // ==================== ENVIAR NOTIFICACIÓN MEJORADO ====================
  async sendNotification(subscription, title, options = {}) {
    try {
      console.log('\n📤 ENVIANDO NOTIFICACIÓN:');
      console.log('Título:', title);
      console.log('Endpoint:', subscription?.endpoint?.substring(0, 60) + '...');
      
      if (!vapidConfigured) {
        throw new Error('VAPID no configurado');
      }

      if (!subscription || !subscription.endpoint) {
        throw new Error('Suscripción inválida: falta endpoint');
      }

      if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
        throw new Error('Suscripción inválida: faltan claves de encriptación');
      }

      const payload = JSON.stringify({
        title: title,
        body: options.body || 'Tienes una nueva notificación',
        icon: options.icon || '/icons/icon-192x192.png',
        image: options.image,
        badge: '/icons/icon-72x72.png',
        data: options.data || { 
          url: '/',
          timestamp: new Date().toISOString()
        },
        tag: options.tag || 'general',
        timestamp: Date.now(),
        vibrate: [200, 100, 200]
      });

      console.log('📦 Payload preparado');
      
      // ¡CORRECCIÓN AQUÍ! - SIN HEADERS DUPLICADOS
      const sendOptions = {
        TTL: options.TTL || 86400,
        urgency: options.urgency || 'normal'
        // NO agregues 'headers' aquí a menos que sea necesario
      };
      
      // Si necesitas headers personalizados (sin TTL duplicado)
      if (options.customHeaders) {
        sendOptions.headers = options.customHeaders;
      }
      
      const result = await webpush.sendNotification(subscription, payload, sendOptions);
      
      console.log('✅ Notificación enviada exitosamente');
      console.log('📊 Status:', result?.statusCode);
      
      return { 
        success: true,
        statusCode: result?.statusCode,
        headers: result?.headers,
        message: 'Notificación enviada'
      };
      
    } catch (error) {
      console.error('❌ ERROR ENVIANDO NOTIFICACIÓN:');
      console.error('Mensaje:', error.message);
      console.error('Status Code:', error.statusCode);
      console.error('Body:', error.body);
      console.error('Endpoint:', subscription?.endpoint?.substring(0, 80));
      
      // Re-lanzar error con más contexto
      const enhancedError = new Error(`Error enviando notificación: ${error.message}`);
      enhancedError.statusCode = error.statusCode;
      enhancedError.body = error.body;
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }

  // ==================== ENVIAR A USUARIO ESPECÍFICO ====================
  async sendNotificationToUser(userId, title, options = {}) {
    try {
      console.log(`\n🎯 ENVIANDO NOTIFICACIÓN A USUARIO: ${userId}`);
      console.log('Título:', title);
      
      if (!vapidConfigured) {
        return {
          success: false,
          message: 'Notificaciones push no configuradas (VAPID faltante)'
        };
      }

      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error(`Usuario ${userId} no encontrado`);
      }

      if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
        console.log(`ℹ️ Usuario ${user.username} no tiene suscripciones activas`);
        return {
          success: false,
          message: 'El usuario no tiene suscripciones push activas',
          username: user.username
        };
      }

      console.log(`📊 Usuario: ${user.username}, Suscripciones: ${user.pushSubscriptions.length}`);

      let sent = 0;
      let failed = 0;
      const errors = [];

      for (const subscription of user.pushSubscriptions) {
        try {
          await this.sendNotification(subscription, title, options);
          sent++;
          console.log(`✅ Enviado a suscripción ${sent}`);
        } catch (error) {
          failed++;
          errors.push({
            endpoint: subscription.endpoint?.substring(0, 50) + '...',
            error: error.message,
            statusCode: error.statusCode
          });
          
          console.error(`❌ Error en suscripción ${failed}:`, error.message);
          
          // Si la suscripción es inválida (410: Gone, 404: Not found), eliminarla
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`🗑️  Eliminando suscripción expirada/inválida`);
            await user.removePushSubscription(subscription.endpoint);
          }
        }
      }

      const result = {
        success: sent > 0,
        message: `Notificaciones a ${user.username}: ${sent} exitosas, ${failed} fallidas`,
        details: {
          username: user.username,
          userId: user._id,
          sent,
          failed,
          totalSubscriptions: user.pushSubscriptions.length
        }
      };

      if (errors.length > 0) {
        result.errors = errors;
      }

      console.log(`📊 Resultado: ${sent} ✓, ${failed} ✗`);
      return result;

    } catch (error) {
      console.error('❌ Error en sendNotificationToUser:', error);
      throw error;
    }
  }

  // ==================== ENVIAR A TODOS ====================
  async sendNotificationToAll(title, options = {}) {
    try {
      console.log(`\n📢 ENVIANDO NOTIFICACIÓN A TODOS LOS USUARIOS`);
      console.log('Título:', title);
      
      if (!vapidConfigured) {
        return {
          success: false,
          message: 'Notificaciones push no configuradas'
        };
      }

      const users = await User.find({ isActive: true });
      let totalSent = 0;
      let totalFailed = 0;
      const userResults = [];

      console.log(`👥 Total usuarios: ${users.length}`);

      for (const user of users) {
        if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
          const userResult = await this.sendNotificationToUser(user._id, title, options);
          userResults.push(userResult);
          
          if (userResult.success) {
            totalSent += userResult.details?.sent || 0;
            totalFailed += userResult.details?.failed || 0;
          }
        }
      }

      return {
        success: totalSent > 0,
        message: `Notificaciones enviadas: ${totalSent} exitosas, ${totalFailed} fallidas`,
        results: {
          totalSent,
          totalFailed,
          totalUsers: users.length,
          userResults
        }
      };
    } catch (error) {
      console.error('❌ Error en sendNotificationToAll:', error);
      throw error;
    }
  }

  // ==================== ENVIAR A MÚLTIPLES USUARIOS ====================
  async sendNotificationToUsers(userIds, title, options = {}) {
    try {
      if (!vapidConfigured) {
        return {
          success: false,
          message: 'Notificaciones push no configuradas'
        };
      }

      const users = await User.find({ 
        _id: { $in: userIds },
        isActive: true 
      });

      let totalSent = 0;
      let totalFailed = 0;
      const results = [];

      for (const user of users) {
        const result = await this.sendNotificationToUser(user._id, title, options);
        results.push(result);
        
        if (result.success) {
          totalSent += result.details?.sent || 0;
          totalFailed += result.details?.failed || 0;
        }
      }

      return {
        success: totalSent > 0,
        message: `Notificaciones enviadas: ${totalSent} exitosas, ${totalFailed} fallidas`,
        results: {
          totalSent,
          totalFailed,
          userResults: results
        }
      };
    } catch (error) {
      console.error('❌ Error en sendNotificationToUsers:', error);
      throw error;
    }
  }

  // ==================== ELIMINAR SUSCRIPCIÓN ====================
  async removeSubscription(userId, endpoint) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const initialCount = user.pushSubscriptions.length;
      await user.removePushSubscription(endpoint);
      const finalCount = user.pushSubscriptions.length;
      
      console.log(`🗑️  Suscripción eliminada. De ${initialCount} a ${finalCount} suscripciones`);
      
      return {
        success: true,
        message: 'Suscripción eliminada correctamente',
        removed: initialCount > finalCount
      };
    } catch (error) {
      console.error('❌ Error eliminando suscripción:', error);
      throw error;
    }
  }

  // ==================== ESTADÍSTICAS ====================
  async getStats() {
    try {
      const totalUsers = await User.countDocuments({ isActive: true });
      const usersWithSubscriptions = await User.countDocuments({
        'pushSubscriptions.0': { $exists: true }
      });
      
      const allUsers = await User.find({ isActive: true });
      let totalSubscriptions = 0;
      
      allUsers.forEach(user => {
        totalSubscriptions += user.pushSubscriptions.length;
      });

      return {
        totalUsers,
        usersWithSubscriptions,
        totalSubscriptions,
        vapidConfigured: vapidConfigured,
        vapidPublicKey: process.env.VAPID_PUBLIC_KEY ? 
          process.env.VAPID_PUBLIC_KEY.substring(0, 30) + '...' : 
          'No configurada',
        environment: process.env.NODE_ENV || 'development'
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // ==================== ENVIAR POR EMAIL ====================
  async sendNotificationToUserByEmail(userEmail, title, options = {}) {
    try {
      if (!vapidConfigured) {
        return {
          success: false,
          message: 'Notificaciones push no configuradas'
        };
      }

      const user = await User.findOne({ 
        email: userEmail.toLowerCase().trim(),
        isActive: true 
      });
      
      if (!user) {
        throw new Error(`Usuario con email ${userEmail} no encontrado`);
      }

      return await this.sendNotificationToUser(user._id, title, options);
    } catch (error) {
      console.error('❌ Error en sendNotificationToUserByEmail:', error);
      throw error;
    }
  }
}

export const pushService = new PushService();