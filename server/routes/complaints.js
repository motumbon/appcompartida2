import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Complaint from '../models/Complaint.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configurar multer para archivos de reclamos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/complaints';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'complaint-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadComplaintFiles = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.includes('officedocument') || file.mimetype.includes('msword') || file.mimetype.includes('ms-excel') || file.mimetype.includes('ms-powerpoint');
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF, Office e imágenes'));
    }
  }
}).array('files', 5);

// Obtener reclamos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      $or: [
        { createdBy: req.user._id },
        { sharedWith: req.user._id }
      ]
    })
      .populate('createdBy', 'username email name')
      .populate('sharedWith', 'username email name')
      .populate('institution', 'name')
      .populate('updates.updatedBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener reclamos', error: error.message });
  }
});

// Crear reclamo
router.post('/', authenticateToken, uploadComplaintFiles, async (req, res) => {
  try {
    const { title, description, clientName, institution, priority } = req.body;

    if (!title || !description || !clientName) {
      return res.status(400).json({ message: 'Título, descripción y nombre del cliente son requeridos' });
    }

    // Manejar sharedWith como array
    let sharedWith = req.body['sharedWith[]'] || req.body.sharedWith || [];
    if (!Array.isArray(sharedWith)) {
      sharedWith = [sharedWith];
    }
    sharedWith = sharedWith.filter(id => id);

    // Procesar archivos adjuntos
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    const complaint = new Complaint({
      title,
      description,
      clientName,
      institution: institution || null,
      priority: priority || 'media',
      createdBy: req.user._id,
      sharedWith,
      attachments,
      status: 'recibido'
    });

    await complaint.save();
    await complaint.populate(['createdBy', 'sharedWith', 'institution']);

    res.status(201).json({ message: 'Reclamo creado exitosamente', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear reclamo', error: error.message });
  }
});

// Descargar archivo adjunto
router.get('/:id/attachments/:filename', authenticateToken, async (req, res) => {
  try {
    const { id, filename } = req.params;
    
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Reclamo no encontrado' });
    }

    const attachment = complaint.attachments.find(att => att.filename === filename);
    if (!attachment) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    const filePath = path.resolve(attachment.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no existe en el servidor' });
    }

    res.download(filePath, attachment.originalName);
  } catch (error) {
    res.status(500).json({ message: 'Error al descargar archivo', error: error.message });
  }
});

// Actualizar reclamo
router.put('/:id', authenticateToken, uploadComplaintFiles, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, clientName, institution, priority, status } = req.body;

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: 'Reclamo no encontrado' });
    }

    complaint.title = title || complaint.title;
    complaint.description = description || complaint.description;
    complaint.clientName = clientName || complaint.clientName;
    complaint.institution = institution !== undefined ? institution : complaint.institution;
    complaint.priority = priority || complaint.priority;

    // Actualizar sharedWith
    let sharedWith = req.body['sharedWith[]'] || req.body.sharedWith;
    if (sharedWith !== undefined) {
      if (!Array.isArray(sharedWith)) {
        sharedWith = [sharedWith];
      }
      complaint.sharedWith = sharedWith.filter(id => id);
    }

    // Manejar archivos existentes
    let existingAttachments = req.body['existingAttachments[]'] || [];
    if (!Array.isArray(existingAttachments)) {
      existingAttachments = [existingAttachments];
    }
    const parsedExisting = existingAttachments.map(att => {
      try {
        return typeof att === 'string' ? JSON.parse(att) : att;
      } catch {
        return null;
      }
    }).filter(att => att);

    // Eliminar archivos que ya no están
    complaint.attachments.forEach(att => {
      const stillExists = parsedExisting.some(ex => ex.filename === att.filename);
      if (!stillExists && fs.existsSync(att.path)) {
        fs.unlinkSync(att.path);
      }
    });

    // Agregar nuevos archivos
    const newAttachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    complaint.attachments = [...parsedExisting, ...newAttachments];

    if (status && status !== complaint.status) {
      complaint.status = status;
      if (status === 'resuelto' && !complaint.resolvedAt) {
        complaint.resolvedAt = new Date();
      }
    }

    await complaint.save();
    await complaint.populate(['createdBy', 'sharedWith', 'institution', 'updates.updatedBy']);

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
    
    // Eliminar si es creador O está compartido con el usuario
    const complaint = await Complaint.findOneAndDelete({ 
      _id: id,
      $or: [
        { createdBy: req.user._id },
        { sharedWith: req.user._id }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Reclamo no encontrado o sin permisos' });
    }

    res.json({ message: 'Reclamo eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar reclamo', error: error.message });
  }
});

export default router;
