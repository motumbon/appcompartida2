import express from 'express';
import Note from '../models/Note.js';
import { authenticateToken } from '../middleware/auth.js';
import pushNotificationService from '../services/pushNotificationService.js';

const router = express.Router();

// Obtener todas las notas del usuario actual
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Obtener notas creadas por el usuario o compartidas con él
    const notes = await Note.find({
      $or: [
        { createdBy: req.user._id },
        { sharedWith: req.user._id }
      ]
    })
      .populate('createdBy', 'username email')
      .populate('sharedWith', 'username email')
      .populate('institution', 'name')
      .sort({ createdAt: -1 });
    
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener notas', error: error.message });
  }
});

// Crear nueva nota
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { subject, comment, sharedWith, institution } = req.body;

    const note = new Note({
      subject,
      comment,
      createdBy: req.user._id,
      sharedWith: sharedWith || [],
      institution: institution || null
    });

    await note.save();
    await note.populate('createdBy', 'username email');
    await note.populate('sharedWith', 'username email');
    await note.populate('institution', 'name');

    // Enviar notificaciones push inmediatamente si se compartió
    if (note.sharedWith && note.sharedWith.length > 0) {
      const sharedUserIds = note.sharedWith
        .filter(u => u._id.toString() !== req.user._id.toString())
        .map(u => u._id);
      
      if (sharedUserIds.length > 0) {
        console.log(`📝 Enviando notificación inmediata: nota "${note.subject}" compartida con ${sharedUserIds.length} usuario(s)`);
        pushNotificationService.notifySharedNote(note, sharedUserIds)
          .catch(err => console.error('Error enviando notificación:', err));
      }
    }

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear nota', error: error.message });
  }
});

// Actualizar nota
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { subject, comment, sharedWith, institution } = req.body;

    // Buscar nota donde el usuario es creador O está en sharedWith
    const note = await Note.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user._id },
        { sharedWith: req.user._id }
      ]
    });
    
    if (!note) {
      return res.status(404).json({ message: 'Nota no encontrada o sin permisos' });
    }

    // Guardar sharedWith anterior para detectar nuevos shares
    const previousSharedWith = note.sharedWith.map(u => u.toString());
    const isCreator = note.createdBy.toString() === req.user._id.toString();

    note.subject = subject;
    note.comment = comment;
    note.sharedWith = sharedWith || [];
    note.institution = institution || null;
    note.updatedAt = Date.now();

    await note.save();
    await note.populate('createdBy', 'username email');
    await note.populate('sharedWith', 'username email');
    await note.populate('institution', 'name');

    // Detectar nuevos usuarios compartidos y enviar notificaciones
    if (isCreator) {
      const newSharedUserIds = note.sharedWith
        .filter(u => !previousSharedWith.includes(u._id.toString()))
        .filter(u => u._id.toString() !== req.user._id.toString())
        .map(u => u._id);
      
      if (newSharedUserIds.length > 0) {
        console.log(`📝 Enviando notificación inmediata: nota "${note.subject}" compartida con ${newSharedUserIds.length} nuevo(s) usuario(s)`);
        pushNotificationService.notifySharedNote(note, newSharedUserIds)
          .catch(err => console.error('Error enviando notificación:', err));
      }
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar nota', error: error.message });
  }
});

// Eliminar nota
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Eliminar nota donde el usuario es creador O está en sharedWith
    const note = await Note.findOneAndDelete({ 
      _id: req.params.id,
      $or: [
        { createdBy: req.user._id },
        { sharedWith: req.user._id }
      ]
    });

    if (!note) {
      return res.status(404).json({ message: 'Nota no encontrada o sin permisos' });
    }

    res.json({ message: 'Nota eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar nota', error: error.message });
  }
});

export default router;
