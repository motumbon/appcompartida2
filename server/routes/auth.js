import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Registro de usuario
router.post('/register', [
  body('username').trim().notEmpty().withMessage('El nombre de usuario es requerido'),
  body('email').isEmail().withMessage('Email inválido').matches(/@gmail\.com$/).withMessage('El email debe ser de Gmail'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Las contraseñas no coinciden');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario o email ya existe' });
    }

    // Crear nuevo usuario
    const user = new User({
      username,
      email,
      password,
      isAdmin: false
    });

    await user.save();

    res.status(201).json({
      message: 'Solicitud de registro enviada. Un administrador debe aprobar tu cuenta antes de que puedas iniciar sesión.',
      pending: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
});

// Login
router.post('/login', [
  body('usernameOrEmail').trim().notEmpty().withMessage('Usuario o email es requerido'),
  body('password').notEmpty().withMessage('Contraseña es requerida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { usernameOrEmail, password } = req.body;

    // Buscar usuario por username o email
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar si el usuario está aprobado (excepto admin)
    if (!user.approved && !user.isAdmin) {
      return res.status(403).json({ 
        message: 'Tu cuenta está pendiente de aprobación por un administrador',
        pending: true
      });
    }

    // Generar token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        permissions: user.permissions || {
          activities: true,
          tasks: true,
          complaints: true,
          contracts: true,
          stock: true,
          notes: true
        }
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
});

// Obtener usuario actual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      name: req.user.name,
      profileImage: req.user.profileImage,
      isAdmin: req.user.isAdmin,
      permissions: req.user.permissions || {
        activities: true,
        tasks: true,
        complaints: true,
        contracts: true,
        stock: true,
        notes: true
      },
      quickAccessItems: req.user.quickAccessItems || ['contacts', 'activities', 'tasks', 'complaints', 'contracts']
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
});

// Obtener solicitudes de registro pendientes (solo admin)
router.get('/pending-users', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'No tienes permisos para ver solicitudes pendientes' });
    }

    const pendingUsers = await User.find({ approved: false, isAdmin: false })
      .select('username email createdAt')
      .sort({ createdAt: -1 });

    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener solicitudes pendientes', error: error.message });
  }
});

// Aprobar usuario (solo admin)
router.post('/approve-user/:userId', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'No tienes permisos para aprobar usuarios' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.approved = true;
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    await user.save();

    res.json({ message: 'Usuario aprobado exitosamente', user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Error al aprobar usuario', error: error.message });
  }
});

// Rechazar/eliminar usuario (solo admin)
router.delete('/reject-user/:userId', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'No tienes permisos para rechazar usuarios' });
    }

    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario rechazado y eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al rechazar usuario', error: error.message });
  }
});

// Actualizar accesos rápidos del usuario
router.put('/quick-access', authenticateToken, async (req, res) => {
  try {
    const { quickAccessItems } = req.body;

    if (!Array.isArray(quickAccessItems)) {
      return res.status(400).json({ message: 'quickAccessItems debe ser un array' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { quickAccessItems },
      { new: true }
    );

    res.json({ 
      message: 'Accesos rápidos actualizados exitosamente',
      quickAccessItems: user.quickAccessItems
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar accesos rápidos', error: error.message });
  }
});

export default router;
