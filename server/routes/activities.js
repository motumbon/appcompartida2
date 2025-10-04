import express from 'express';
import Activity from '../models/Activity.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadActivityFiles } from '../middleware/upload.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
router.post('/', authenticateToken, uploadActivityFiles, async (req, res) => {
  try {
    const { subject, comment, institution, registerInCalendar, scheduledDate } = req.body;
    
    // Manejar sharedWith como array (viene como sharedWith[] desde FormData)
    let sharedWith = req.body['sharedWith[]'] || req.body.sharedWith || [];
    if (!Array.isArray(sharedWith)) {
      sharedWith = [sharedWith];
    }

    if (!subject) {
      return res.status(400).json({ message: 'El asunto es requerido' });
    }

    // Procesar archivos adjuntos
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    })) : [];

    const activity = new Activity({
      subject,
      comment,
      createdBy: req.user._id,
      sharedWith: sharedWith.filter(id => id), // Filtrar valores vacíos
      institution: institution || null,
      registerInCalendar: registerInCalendar === 'true',
      scheduledDate: scheduledDate || null,
      status: 'pendiente',
      attachments
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

    // Eliminar archivos adjuntos
    if (activity.attachments && activity.attachments.length > 0) {
      activity.attachments.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
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

// Descargar archivo adjunto
router.get('/:id/attachments/:filename', authenticateToken, async (req, res) => {
  try {
    const { id, filename } = req.params;
    
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

    const attachment = activity.attachments.find(a => a.filename === filename);
    
    if (!attachment) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({ message: 'Archivo no existe en el servidor' });
    }

    res.download(attachment.path, attachment.originalName);
  } catch (error) {
    res.status(500).json({ message: 'Error al descargar archivo', error: error.message });
  }
});

export default router;
