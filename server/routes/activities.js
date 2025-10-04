import express from 'express';
import Activity from '../models/Activity.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Obtener actividades del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Obtener actividades creadas por el usuario o compartidas con él
    const activities = await Activity.find({
      $or: [
        { createdBy: req.user._id },
        { sharedWith: req.user._id }
      ]
    })
      .populate('createdBy', 'username email')
      .populate('sharedWith', 'username email')
      .populate('institution', 'name')
      .sort({ createdAt: -1 });
    
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener actividades', error: error.message });
  }
});

// Crear actividad
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { subject, comment, sharedWith, institution, registerInCalendar, scheduledDate } = req.body;

    if (!subject) {
      return res.status(400).json({ message: 'El asunto es requerido' });
    }

    const activity = new Activity({
      subject,
      comment,
      createdBy: req.user._id,
      sharedWith: sharedWith || [],
      institution,
      registerInCalendar,
      scheduledDate,
      status: 'pendiente'
    });

    // TODO: Implementar integración con Google Calendar si registerInCalendar es true
    // if (registerInCalendar && scheduledDate) {
    //   const calendarEventId = await createGoogleCalendarEvent(activity);
    //   activity.calendarEventId = calendarEventId;
    // }

    await activity.save();
    await activity.populate(['createdBy', 'sharedWith', 'institution']);

    res.status(201).json({ message: 'Actividad creada exitosamente', activity });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear actividad', error: error.message });
  }
});

// Actualizar actividad
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, comment, sharedWith, institution, status, scheduledDate } = req.body;

    const activity = await Activity.findOne({
      _id: id,
      $or: [
        { createdBy: req.user._id },
        { sharedWith: req.user._id }
      ]
    });

    if (!activity) {
      return res.status(404).json({ message: 'Actividad no encontrada' });
    }

    // Solo el creador puede editar ciertos campos
    if (activity.createdBy.toString() === req.user._id.toString()) {
      activity.subject = subject || activity.subject;
      activity.comment = comment || activity.comment;
      activity.sharedWith = sharedWith !== undefined ? sharedWith : activity.sharedWith;
      activity.institution = institution !== undefined ? institution : activity.institution;
      activity.scheduledDate = scheduledDate !== undefined ? scheduledDate : activity.scheduledDate;
    }

    // Cualquier participante puede actualizar el estado
    if (status) {
      activity.status = status;
    }

    await activity.save();
    await activity.populate(['createdBy', 'sharedWith', 'institution']);

    res.json({ message: 'Actividad actualizada exitosamente', activity });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar actividad', error: error.message });
  }
});

// Eliminar actividad
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const activity = await Activity.findOneAndDelete({ _id: id, createdBy: req.user._id });

    if (!activity) {
      return res.status(404).json({ message: 'Actividad no encontrada' });
    }

    // TODO: Eliminar evento de Google Calendar si existe
    // if (activity.calendarEventId) {
    //   await deleteGoogleCalendarEvent(activity.calendarEventId);
    // }

    res.json({ message: 'Actividad eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar actividad', error: error.message });
  }
});

export default router;
