import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configurar multer para imágenes de perfil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/profiles';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadProfile = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'));
    }
  }
}).single('profileImage');

// Obtener todos los usuarios (solo admin)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
});

// Actualizar permisos de usuario (solo admin)
router.put('/:id/permissions', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isAdmin: makeAdmin, permissions } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // No permitir modificar al administrador principal
    if (user.username === 'administrador') {
      return res.status(403).json({ message: 'No se puede modificar al administrador principal' });
    }

    // Actualizar permisos
    if (permissions) {
      user.permissions = {
        activities: permissions.activities !== undefined ? permissions.activities : user.permissions.activities,
        tasks: permissions.tasks !== undefined ? permissions.tasks : user.permissions.tasks,
        complaints: permissions.complaints !== undefined ? permissions.complaints : user.permissions.complaints,
        contracts: permissions.contracts !== undefined ? permissions.contracts : user.permissions.contracts,
        stock: permissions.stock !== undefined ? permissions.stock : user.permissions.stock
      };
    }

    // Actualizar isAdmin
    if (makeAdmin !== undefined) {
      user.isAdmin = makeAdmin;
    }

    await user.save();
    
    const updatedUser = await User.findById(id).select('-password');
    res.json({ message: 'Permisos actualizados exitosamente', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar permisos', error: error.message });
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

// Buscar usuarios por nombre o email (autocompletado)
router.get('/autocomplete', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    // Buscar usuarios que coincidan con el nombre o email
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username email')
    .limit(10);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar usuarios', error: error.message });
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

// Subir imagen de perfil
router.post('/profile-image', authenticateToken, uploadProfile, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ninguna imagen' });
    }

    const user = await User.findById(req.user._id);
    
    // Eliminar imagen anterior si existe
    if (user.profileImage) {
      const oldImagePath = user.profileImage;
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    user.profileImage = req.file.path;
    await user.save();

    res.json({ message: 'Imagen de perfil actualizada', profileImage: req.file.path });
  } catch (error) {
    res.status(500).json({ message: 'Error al subir imagen', error: error.message });
  }
});

// Cambiar contraseña
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Contraseña actual y nueva son requeridas' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const user = await User.findById(req.user._id);
    
    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }

    // Establecer nueva contraseña en texto plano
    // El pre-save hook del modelo User la hasheará automáticamente
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar contraseña', error: error.message });
  }
});

// Eliminar cuenta propia
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // No permitir eliminar al administrador principal
    if (user.username === 'administrador') {
      return res.status(403).json({ message: 'No se puede eliminar al administrador principal' });
    }

    // Eliminar imagen de perfil si existe
    if (user.profileImage && fs.existsSync(user.profileImage)) {
      fs.unlinkSync(user.profileImage);
    }

    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Cuenta eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar cuenta', error: error.message });
  }
});

// Resetear contraseña de un usuario (solo admin)
router.post('/:id/reset-password', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Establecer contraseña predeterminada en texto plano
    // El pre-save hook del modelo User la hasheará automáticamente
    user.password = '123abc';
    await user.save();

    res.json({ message: 'Contraseña reseteada a "123abc"' });
  } catch (error) {
    res.status(500).json({ message: 'Error al resetear contraseña', error: error.message });
  }
});

export default router;
