import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pushNotificationService from '../services/pushNotificationService.js';
import notificationMonitor from '../services/notificationMonitor.js';
import PushToken from '../models/PushToken.js';
import User from '../models/User.js';

const router = express.Router();

// Test: Ver todos los tokens registrados
router.get('/tokens', authenticateToken, async (req, res) => {
  try {
    const tokens = await PushToken.find().populate('user', 'username email');
    
    const tokenInfo = tokens.map(t => ({
      username: t.user?.username || 'Unknown',
      token: t.token,
      isValid: t.token?.startsWith('ExponentPushToken[') ? 'SÍ ✅' : 'NO ❌ (local)',
      deviceInfo: t.deviceInfo,
      lastUpdated: t.lastUpdated
    }));
    
    res.json({
      total: tokens.length,
      validTokens: tokens.filter(t => t.token?.startsWith('ExponentPushToken[')).length,
      localTokens: tokens.filter(t => !t.token?.startsWith('ExponentPushToken[')).length,
      tokens: tokenInfo
    });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo tokens', error: error.message });
  }
});

// Test: Enviar notificación de prueba al usuario actual
router.post('/send-test', authenticateToken, async (req, res) => {
  try {
    const result = await pushNotificationService.sendToUsers(
      [req.user._id],
      {
        title: '🧪 Notificación de Prueba',
        body: 'Si ves esto, las notificaciones push están funcionando correctamente',
        data: { type: 'test', timestamp: new Date().toISOString() }
      }
    );
    
    res.json({
      message: 'Notificación de prueba enviada',
      result
    });
  } catch (error) {
    res.status(500).json({ message: 'Error enviando notificación', error: error.message });
  }
});

// Test: Enviar notificación a un usuario específico
router.post('/send-to-user', authenticateToken, async (req, res) => {
  try {
    const { userId, title, body } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'userId es requerido' });
    }
    
    const result = await pushNotificationService.sendToUsers(
      [userId],
      {
        title: title || '📬 Notificación Manual',
        body: body || 'Esta es una notificación de prueba enviada manualmente',
        data: { type: 'manual-test', timestamp: new Date().toISOString() }
      }
    );
    
    res.json({
      message: 'Notificación enviada',
      result
    });
  } catch (error) {
    res.status(500).json({ message: 'Error enviando notificación', error: error.message });
  }
});

// Test: Forzar verificación manual del monitor
router.post('/force-check', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Verificación manual forzada por:', req.user.username);
    await notificationMonitor.forceCheck();
    
    res.json({
      message: 'Verificación forzada completada',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en verificación forzada', error: error.message });
  }
});

// Test: Ver estado del monitor
router.get('/monitor-status', authenticateToken, async (req, res) => {
  try {
    res.json({
      isRunning: notificationMonitor.isRunning,
      lastCheck: notificationMonitor.lastCheck,
      currentTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo estado', error: error.message });
  }
});

// Test: Listar todos los usuarios
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select('_id username email isAdmin');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo usuarios', error: error.message });
  }
});

export default router;
