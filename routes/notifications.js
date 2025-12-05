// routes/notifications.js 
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { pushService } from '../pushService.js';
import User from '../models/User.js';

const router = express.Router();

// Enviar notificación a usuario específico
router.post('/send-to-user', authenticateToken, async (req, res) => {
  try {
    const { targetUserId, title, message, type = 'message', data = {} } = req.body;
    
    if (!targetUserId || !title) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId y title son requeridos'
      });
    }

    // Verificar que el usuario objetivo existe
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario objetivo no encontrado'
      });
    }

    // Enviar notificación
    const result = await pushService.sendNotificationToUser(targetUserId, title, {
      body: message,
      icon: '/icons/icon-192x192.png',
      data: {
        ...data,
        type: type,
        fromUser: {
          id: req.user._id,
          username: req.user.username
        },
        timestamp: new Date().toISOString()
      },
      tag: type
    });

    res.json({
      success: true,
      message: 'Notificación enviada exitosamente',
      ...result
    });

  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando notificación'
    });
  }
});

// Obtener usuarios disponibles para notificar
router.get('/available-users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({ 
      _id: { $ne: req.user._id }, // Excluir al usuario actual
      isActive: true 
    }).select('username email role pushSubscriptions');

    const availableUsers = users.filter(user => 
      user.pushSubscriptions && user.pushSubscriptions.length > 0
    ).map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      hasSubscriptions: user.pushSubscriptions.length > 0
    }));

    res.json({
      success: true,
      users: availableUsers
    });

  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo usuarios'
    });
  }
});

// Obtener historial de notificaciones enviadas
router.get('/sent-history', authenticateToken, async (req, res) => {
  try {
    // Aquí podrías guardar el historial en tu base de datos
    // Por ahora retornamos un array vacío
    res.json({
      success: true,
      history: []
    });
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial'
    });
  }
});

export default router;