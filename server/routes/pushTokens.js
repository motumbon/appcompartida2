const express = require('express');
const router = express.Router();
const PushToken = require('../models/PushToken');
const { authenticateToken } = require('../middleware/auth');

// Registrar o actualizar token de push
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { token, deviceInfo } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token es requerido' });
    }

    // Buscar token existente del usuario
    let pushToken = await PushToken.findOne({ user: req.user._id });
    
    if (pushToken) {
      // Actualizar token existente
      pushToken.token = token;
      pushToken.deviceInfo = deviceInfo || pushToken.deviceInfo;
      pushToken.lastUpdated = Date.now();
      await pushToken.save();
    } else {
      // Crear nuevo registro
      pushToken = new PushToken({
        user: req.user._id,
        token,
        deviceInfo
      });
      await pushToken.save();
    }

    res.json({ message: 'Token registrado exitosamente' });
  } catch (error) {
    console.error('Error registrando push token:', error);
    res.status(500).json({ message: 'Error registrando token', error: error.message });
  }
});

// Eliminar token (logout)
router.delete('/unregister', authenticateToken, async (req, res) => {
  try {
    await PushToken.findOneAndDelete({ user: req.user._id });
    res.json({ message: 'Token eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando push token:', error);
    res.status(500).json({ message: 'Error eliminando token', error: error.message });
  }
});

module.exports = router;
