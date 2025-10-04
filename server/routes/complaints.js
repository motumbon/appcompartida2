import express from 'express';
import Complaint from '../models/Complaint.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Obtener reclamos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .populate('institution', 'name')
      .populate('updates.updatedBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener reclamos', error: error.message });
  }
});

// Crear reclamo
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, clientName, clientEmail, clientPhone, institution, priority } = req.body;

    if (!title || !description || !clientName) {
      return res.status(400).json({ message: 'Título, descripción y nombre del cliente son requeridos' });
    }

    const complaint = new Complaint({
      title,
      description,
      clientName,
      clientEmail,
      clientPhone,
      institution,
      priority: priority || 'media',
      createdBy: req.user._id,
      status: 'recibido'
    });

    await complaint.save();
    await complaint.populate(['createdBy', 'institution']);

    res.status(201).json({ message: 'Reclamo creado exitosamente', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear reclamo', error: error.message });
  }
});

// Actualizar reclamo
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, clientName, clientEmail, clientPhone, institution, priority, assignedTo, status } = req.body;

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: 'Reclamo no encontrado' });
    }

    complaint.title = title || complaint.title;
    complaint.description = description || complaint.description;
    complaint.clientName = clientName || complaint.clientName;
    complaint.clientEmail = clientEmail !== undefined ? clientEmail : complaint.clientEmail;
    complaint.clientPhone = clientPhone !== undefined ? clientPhone : complaint.clientPhone;
    complaint.institution = institution !== undefined ? institution : complaint.institution;
    complaint.priority = priority || complaint.priority;
    complaint.assignedTo = assignedTo !== undefined ? assignedTo : complaint.assignedTo;

    if (status && status !== complaint.status) {
      complaint.status = status;
      if (status === 'resuelto' && !complaint.resolvedAt) {
        complaint.resolvedAt = new Date();
      }
    }

    await complaint.save();
    await complaint.populate(['createdBy', 'assignedTo', 'institution', 'updates.updatedBy']);

    res.json({ message: 'Reclamo actualizado exitosamente', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar reclamo', error: error.message });
  }
});

// Agregar actualización a reclamo
router.post('/:id/updates', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, status } = req.body;

    if (!comment) {
      return res.status(400).json({ message: 'El comentario es requerido' });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: 'Reclamo no encontrado' });
    }

    complaint.updates.push({
      comment,
      status: status || complaint.status,
      updatedBy: req.user._id
    });

    if (status && status !== complaint.status) {
      complaint.status = status;
      if (status === 'resuelto' && !complaint.resolvedAt) {
        complaint.resolvedAt = new Date();
      }
    }

    await complaint.save();
    await complaint.populate(['createdBy', 'assignedTo', 'institution', 'updates.updatedBy']);

    res.json({ message: 'Actualización agregada exitosamente', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar actualización', error: error.message });
  }
});

// Eliminar reclamo
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await Complaint.findByIdAndDelete(id);
    res.json({ message: 'Reclamo eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar reclamo', error: error.message });
  }
});

export default router;
