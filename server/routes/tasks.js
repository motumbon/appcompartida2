import express from 'express';
import Task from '../models/Task.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Obtener tareas del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ]
    })
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .populate('institution', 'name')
      .sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tareas', error: error.message });
  }
});

// Crear tarea
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, assignedTo, institution, priority, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'El título es requerido' });
    }

    const task = new Task({
      title,
      description,
      createdBy: req.user._id,
      assignedTo: assignedTo || [],
      institution,
      priority: priority || 'media',
      dueDate,
      status: 'pendiente'
    });

    await task.save();
    await task.populate(['createdBy', 'assignedTo', 'institution']);

    res.status(201).json({ message: 'Tarea creada exitosamente', task });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear tarea', error: error.message });
  }
});

// Actualizar tarea
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, institution, priority, status, dueDate } = req.body;

    const task = await Task.findOne({
      _id: id,
      $or: [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // Solo el creador puede editar ciertos campos
    if (task.createdBy.toString() === req.user._id.toString()) {
      task.title = title || task.title;
      task.description = description !== undefined ? description : task.description;
      task.assignedTo = assignedTo !== undefined ? assignedTo : task.assignedTo;
      task.institution = institution !== undefined ? institution : task.institution;
      task.priority = priority || task.priority;
      task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
    }

    // Cualquier participante puede actualizar el estado
    if (status) {
      task.status = status;
      if (status === 'completada' && !task.completedAt) {
        task.completedAt = new Date();
      }
    }

    await task.save();
    await task.populate(['createdBy', 'assignedTo', 'institution']);

    res.json({ message: 'Tarea actualizada exitosamente', task });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar tarea', error: error.message });
  }
});

// Eliminar tarea
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findOneAndDelete({ _id: id, createdBy: req.user._id });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar tarea', error: error.message });
  }
});

export default router;
