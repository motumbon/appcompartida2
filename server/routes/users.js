import express from 'express';
import User from '../models/User.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Obtener todos los usuarios (solo admin)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
});

// Eliminar usuario (solo admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar al administrador principal
    const user = await User.findById(id);
    if (user && user.username === 'administrador') {
      return res.status(403).json({ message: 'No se puede eliminar al administrador principal' });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
});

// Buscar usuarios por email (para sugerencias en contactos)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email es requerido' });
    }

    const user = await User.findOne({ email }).select('username email');
    
    if (user) {
      res.json({ found: true, user });
    } else {
      res.json({ found: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar usuario', error: error.message });
  }
});

// Vincular institución a usuario
router.post('/institutions/link', authenticateToken, async (req, res) => {
  try {
    const { institutionId } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user.institutions.includes(institutionId)) {
      user.institutions.push(institutionId);
      await user.save();
    }
    
    res.json({ message: 'Institución vinculada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al vincular institución', error: error.message });
  }
});

// Desvincular institución de usuario
router.delete('/institutions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(req.user._id);
    user.institutions = user.institutions.filter(inst => inst.toString() !== id);
    await user.save();
    
    res.json({ message: 'Institución desvinculada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al desvincular institución', error: error.message });
  }
});

// Obtener instituciones del usuario
router.get('/institutions', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('institutions');
    res.json(user.institutions);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener instituciones', error: error.message });
  }
});

export default router;
