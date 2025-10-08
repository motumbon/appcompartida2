import express from 'express';
import Task from '../models/Task.js';
import { authenticateToken } from '../middleware/auth.js';
import pushNotificationService from '../services/pushNotificationService.js';

const router = express.Router();

// Obtener tareas del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [
        { createdBy: req.user._id },
        { sharedWith: req.user._id }
      ]
    })
      .populate('createdBy', 'username email name')
      .populate('sharedWith', 'username email name')
      .populate('institution', 'name')
      .sort({ createdAt: -1 });
    
    // Asegurar que todos los campos existan (para tareas antiguas)
    const tasksWithDefaults = tasks.map(task => {
      const taskObj = task.toObject();
      return {
        ...taskObj,
        checklist: taskObj.checklist || [],
        sharedWith: taskObj.sharedWith || [],
        status: taskObj.status || 'pendiente'
      };
    });
    
    res.json(tasksWithDefaults);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tareas', error: error.message });
  }
});

// Crear tarea
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, sharedWith, institution, priority, dueDate, checklist } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'El título es requerido' });
    }

    const task = new Task({
      title,
      description,
      createdBy: req.user._id,
      sharedWith: sharedWith || [],
      institution,
      priority: priority || 'media',
      dueDate,
      checklist: checklist || [],
      status: 'pendiente'
    });

    await task.save();
    await task.populate(['createdBy', 'sharedWith', 'institution']);

    // Enviar notificaciones push inmediatamente si se compartió
    if (task.sharedWith && task.sharedWith.length > 0) {
      const sharedUserIds = task.sharedWith
        .filter(u => u._id.toString() !== req.user._id.toString())
        .map(u => u._id);
      
      if (sharedUserIds.length > 0) {
        console.log(`✅ Enviando notificación inmediata: tarea "${task.title}" compartida con ${sharedUserIds.length} usuario(s)`);
        pushNotificationService.notifySharedTask(task, sharedUserIds)
          .catch(err => console.error('Error enviando notificación:', err));
      }
    }

    res.status(201).json({ message: 'Tarea creada exitosamente', task });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear tarea', error: error.message });
  }
});

// Actualizar tarea
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, sharedWith, institution, priority, status, dueDate, checklist, completedAt } = req.body;

    const task = await Task.findOne({
      _id: id,
      $or: [
        { createdBy: req.user._id },
        { sharedWith: req.user._id }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // Guardar sharedWith anterior para detectar nuevos shares
    const previousSharedWith = task.sharedWith.map(u => u.toString());

    // Creador o usuarios compartidos pueden editar
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isShared = task.sharedWith.some(userId => userId.toString() === req.user._id.toString());

    if (isCreator || isShared) {
      task.title = title || task.title;
      task.description = description !== undefined ? description : task.description;
      task.sharedWith = sharedWith !== undefined ? sharedWith : task.sharedWith;
      task.institution = institution !== undefined ? institution : task.institution;
      task.priority = priority || task.priority;
      task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
      task.checklist = checklist !== undefined ? checklist : task.checklist;
    }

    // Actualizar estado y completedAt
    if (status !== undefined) {
      task.status = status;
      if (status === 'completada') {
        task.completedAt = completedAt || new Date();
      } else {
        task.completedAt = null;
      }
    }

    await task.save();
    await task.populate(['createdBy', 'sharedWith', 'institution']);

    // Detectar nuevos usuarios compartidos y enviar notificaciones
    if (isCreator) {
      const newSharedUserIds = task.sharedWith
        .filter(u => !previousSharedWith.includes(u._id.toString()))
        .filter(u => u._id.toString() !== req.user._id.toString())
        .map(u => u._id);
      
      if (newSharedUserIds.length > 0) {
        console.log(`✅ Enviando notificación inmediata: tarea "${task.title}" compartida con ${newSharedUserIds.length} nuevo(s) usuario(s)`);
        pushNotificationService.notifySharedTask(task, newSharedUserIds)
          .catch(err => console.error('Error enviando notificación:', err));
      }
    }

    res.json({ message: 'Tarea actualizada exitosamente', task });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar tarea', error: error.message });
  }
});

// Eliminar tarea
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Eliminar si es creador O está compartida con el usuario
    const task = await Task.findOneAndDelete({ 
      _id: id,
      $or: [
        { createdBy: req.user._id },
        { sharedWith: req.user._id }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada o sin permisos' });
    }

    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar tarea', error: error.message });
  }
});

export default router;
