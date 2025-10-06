import express from 'express';
import Note from '../models/Note.js';
import { authenticateToken } from '../middleware/auth.js';

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
      .sort({ createdAt: -1 });
    
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener notas', error: error.message });
  }
});

// Crear nueva nota
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { subject, comment, sharedWith } = req.body;

    const note = new Note({
      subject,
      comment,
      createdBy: req.user._id,
      sharedWith: sharedWith || []
    });

    await note.save();
    await note.populate('sharedWith', 'username email');

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear nota', error: error.message });
  }
});

// Actualizar nota
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { subject, comment, sharedWith } = req.body;

    const note = await Note.findOne({ _id: req.params.id, createdBy: req.user._id });
    
    if (!note) {
      return res.status(404).json({ message: 'Nota no encontrada' });
    }

    note.subject = subject;
    note.comment = comment;
    note.sharedWith = sharedWith || [];
    note.updatedAt = Date.now();

    await note.save();
    await note.populate('sharedWith', 'username email');

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar nota', error: error.message });
  }
});

// Eliminar nota
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ 
      _id: req.params.id, 
      createdBy: req.user._id 
    });

    if (!note) {
      return res.status(404).json({ message: 'Nota no encontrada' });
    }

    res.json({ message: 'Nota eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar nota', error: error.message });
  }
});

export default router;
