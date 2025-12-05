import webpush from 'web-push';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

// VERIFICAR CLAVES VAPID ANTES DE CONFIGURAR
const checkVapidKeys = () => {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.error('❌ ERROR: Claves VAPID no configuradas');
    console.error('💡 Agrega en Render: VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY');
    return false;
  }
  
  if (!process.env.VAPID_EMAIL) {
    console.warn('⚠️  VAPID_EMAIL no configurada, usando default');
    process.env.VAPID_EMAIL = 'notifications@example.com';
  }
  
  return true;
};

// Configurar web-push solo si hay claves
if (checkVapidKeys()) {
  try {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    console.log('✅ Web Push configurado con claves VAPID');
  } catch (error) {
    console.error('❌ Error configurando VAPID:', error.message);
  }
} else {
  console.warn('⚠️  Notificaciones push DESACTIVADAS (falta configuración VAPID)');
}

class PushService {
  constructor() {
    console.log('🔔 Servicio de notificaciones push inicializado');
  }

  // Guardar suscripción para un usuario
  async saveSubscription(userId, subscription) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      await user.addPushSubscription(subscription);
      
      console.log('📱 Nueva suscripción push guardada para usuario:', user.username);
      return { 
        success: true, 
        message: 'Suscripción guardada correctamente'
      };
    } catch (error) {
      console.error('❌ Error guardando suscripción:', error);
      throw error;
    }
  }

  // Enviar notificación a todos los usuarios
  async sendNotificationToAll(title, options = {}) {
    try {
      // Verificar si hay claves VAPID configuradas
      if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        return {
          success: false,
          message: 'Notificaciones push no configuradas. Faltan claves VAPID.'
        };
      }

      const users = await User.find({ isActive: true }).populate('pushSubscriptions');
      let totalSent = 0;
      let totalFailed = 0;

      console.log(`📤 Enviando notificación a ${users.length} usuarios:`, title);

      for (const user of users) {
        if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
          for (const subscription of user.pushSubscriptions) {
            try {
              await this.sendNotification(subscription, title, options);
              totalSent++;
            } catch (error) {
              totalFailed++;
              console.error(`❌ Error enviando a ${user.username}:`, error.message);
              
              // Si la suscripción es inválida, eliminarla
              if (error.statusCode === 410 || error.statusCode === 404) {
                console.log(`🗑️  Eliminando suscripción expirada de ${user.username}`);
                await user.removePushSubscription(subscription.endpoint);
              }
            }
          }
        }
      }

      console.log(`✅ Notificaciones enviadas: ${totalSent} exitosas, ${totalFailed} fallidas`);
      return {
        success: true,
        message: `Notificaciones enviadas: ${totalSent} exitosas, ${totalFailed} fallidas`,
        results: {
          sent: totalSent,
          failed: totalFailed,
          totalUsers: users.length
        }
      };
    } catch (error) {
      console.error('❌ Error enviando notificaciones a todos:', error);
      throw error;
    }
  }

  // Enviar notificación a un usuario específico
  async sendNotificationToUser(userId, title, options = {}) {
    try {
      // Verificar claves VAPID
      if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        return {
          success: false,
          message: 'Notificaciones push no configuradas'
        };
      }

      const user = await User.findById(userId).populate('pushSubscriptions');
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
        return {
          success: false,
          message: 'El usuario no tiene suscripciones push activas'
        };
      }

      let sent = 0;
      let failed = 0;

      for (const subscription of user.pushSubscriptions) {
        try {
          await this.sendNotification(subscription, title, options);
          sent++;
        } catch (error) {
          failed++;
          console.error(`❌ Error enviando a ${user.username}:`, error.message);
          
          if (error.statusCode === 410 || error.statusCode === 404) {
            await user.removePushSubscription(subscription.endpoint);
          }
        }
      }

      return {
        success: sent > 0,
        message: `Notificaciones enviadas a ${user.username}: ${sent} exitosas, ${failed} fallidas`,
        results: { sent, failed }
      };
    } catch (error) {
      console.error('❌ Error enviando notificación a usuario:', error);
      throw error;
    }
  }

  // Enviar notificación a múltiples usuarios específicos
  async sendNotificationToUsers(userIds, title, options = {}) {
    try {
      // Verificar claves VAPID
      if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        return {
          success: false,
          message: 'Notificaciones push no configuradas'
        };
      }

      const users = await User.find({ 
        _id: { $in: userIds },
        isActive: true 
      }).populate('pushSubscriptions');

      let totalSent = 0;
      let totalFailed = 0;
      const results = [];

      console.log(`📤 Enviando notificación a ${users.length} usuarios específicos:`, title);

      for (const user of users) {
        let userSent = 0;
        let userFailed = 0;

        if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
          for (const subscription of user.pushSubscriptions) {
            try {
              await this.sendNotification(subscription, title, options);
              userSent++;
              totalSent++;
            } catch (error) {
              userFailed++;
              totalFailed++;
              console.error(`❌ Error enviando a ${user.username}:`, error.message);
              
              if (error.statusCode === 410 || error.statusCode === 404) {
                await user.removePushSubscription(subscription.endpoint);
              }
            }
          }
        }

        results.push({
          userId: user._id,
          username: user.username,
          sent: userSent,
          failed: userFailed,
          totalSubscriptions: user.pushSubscriptions?.length || 0
        });
      }

      console.log(`✅ Notificaciones enviadas a usuarios específicos: ${totalSent} exitosas, ${totalFailed} fallidas`);
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
      console.error('❌ Error enviando notificaciones a usuarios específicos:', error);
      throw error;
    }
  }

  // Enviar notificación a usuario por email
  async sendNotificationToUserByEmail(userEmail, title, options = {}) {
    try {
      // Verificar claves VAPID
      if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        return {
          success: false,
          message: 'Notificaciones push no configuradas'
        };
      }

      // Validar email
      if (!userEmail || typeof userEmail !== 'string') {
        throw new Error('Email inválido');
      }

      // Buscar usuario por email
      const user = await User.findOne({ 
        email: userEmail.toLowerCase().trim(),
        isActive: true 
      }).populate('pushSubscriptions');
      
      if (!user) {
        throw new Error(`Usuario con email ${userEmail} no encontrado`);
      }

      return await this.sendNotificationToUser(user._id, title, options);
    } catch (error) {
      console.error('❌ Error enviando notificación por email:', error);
      throw error;
    }
  }

  // Enviar notificación a múltiples usuarios por emails
  async sendNotificationToUsersByEmails(userEmails, title, options = {}) {
    try {
      // Verificar claves VAPID
      if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        return {
          success: false,
          message: 'Notificaciones push no configuradas'
        };
      }

      // Validar emails
      if (!userEmails || !Array.isArray(userEmails)) {
        throw new Error('Se requiere un array de emails');
      }

      if (userEmails.length === 0) {
        throw new Error('Se requiere al menos un email');
      }

      const users = await User.find({ 
        email: { $in: userEmails.map(email => email.toLowerCase().trim()) },
        isActive: true 
      }).populate('pushSubscriptions');

      if (users.length === 0) {
        throw new Error('No se encontraron usuarios con los emails proporcionados');
      }

      const userIds = users.map(user => user._id);
      return await this.sendNotificationToUsers(userIds, title, options);
    } catch (error) {
      console.error('❌ Error enviando notificaciones por emails:', error);
      throw error;
    }
  }

  // Enviar notificación individual - VERSIÓN MEJORADA
  async sendNotification(subscription, title, options = {}) {
    // Verificar que hay una suscripción válida
    if (!subscription || !subscription.endpoint) {
      throw new Error('Suscripción inválida');
    }

    const payload = JSON.stringify({
      title: title,
      body: options.body || 'Tienes una nueva notificación',
      icon: options.icon || '/icons/icon-192x192.png',
      image: options.image,
      badge: '/icons/icon-72x72.png',
      data: options.data || { url: '/' },
      tag: options.tag || 'general',
      timestamp: Date.now(),
      requireInteraction: options.requireInteraction || false,
      vibrate: options.vibrate || [200, 100, 200]
    });

    try {
      console.log(`📤 Enviando notificación a: ${subscription.endpoint.substring(0, 50)}...`);
      
      const result = await webpush.sendNotification(subscription, payload, {
        TTL: options.TTL || 86400, // 24 horas por defecto
        urgency: options.urgency || 'normal'
      });
      
      console.log('✅ Notificación enviada exitosamente');
      return { 
        success: true,
        headers: result?.headers,
        statusCode: result?.statusCode 
      };
      
    } catch (error) {
      console.error('❌ Error enviando notificación:', error.message);
      console.error('🔍 Detalles:', {
        endpoint: subscription.endpoint?.substring(0, 100),
        statusCode: error.statusCode,
        body: error.body
      });
      
      // Re-lanzar el error con más información
      error.details = {
        endpoint: subscription.endpoint,
        statusCode: error.statusCode
      };
      throw error;
    }
  }

  // Eliminar suscripción de un usuario
  async removeSubscription(userId, endpoint) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      await user.removePushSubscription(endpoint);
      console.log('🗑️ Suscripción eliminada para usuario:', user.username);
      
      return {
        success: true,
        message: 'Suscripción eliminada correctamente'
      };
    } catch (error) {
      console.error('❌ Error eliminando suscripción:', error);
      throw error;
    }
  }

  // Obtener estadísticas
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
        vapidConfigured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
        vapidPublicKey: process.env.VAPID_PUBLIC_KEY?.substring(0, 20) + '...' || 'No configurada'
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}

export const pushService = new PushService();