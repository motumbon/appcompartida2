import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import RawMaterial from '../models/RawMaterial.js';
import { createReadStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configurar multer para PDFs
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/raw-materials');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  }
});

// GET todos los documentos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, parentCategory } = req.query;
    
    let query = {};
    if (category) query.category = category;
    if (parentCategory) query.parentCategory = parentCategory;
    
    const documents = await RawMaterial.find(query)
      .populate('uploadedBy', 'username')
      .populate('institution', 'name')
      .sort({ createdAt: -1 });
    
    res.json(documents);
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({ message: 'Error al obtener documentos' });
  }
});

// POST subir documento
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { title, category, parentCategory, institution } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ningún archivo' });
    }
    
    const document = new RawMaterial({
      title,
      category,
      parentCategory: parentCategory || null,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      uploadedBy: req.user._id,
      institution: institution || null
    });
    
    await document.save();
    await document.populate('uploadedBy', 'username');
    
    res.status(201).json(document);
  } catch (error) {
    console.error('Error al subir documento:', error);
    
    // Eliminar archivo si hubo error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo:', unlinkError);
      }
    }
    
    res.status(500).json({ message: 'Error al subir documento' });
  }
});

// DELETE eliminar documento
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const document = await RawMaterial.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }
    
    // Verificar que sea admin o el creador
    if (!req.user.isAdmin && document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este documento' });
    }
    
    // Eliminar archivo físico
    const filePath = path.join(__dirname, '../uploads/raw-materials', document.filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error al eliminar archivo físico:', error);
    }
    
    await RawMaterial.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Documento eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({ message: 'Error al eliminar documento' });
  }
});

// GET descargar documento
router.get('/download/:id', authenticateToken, async (req, res) => {
  try {
    const document = await RawMaterial.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }
    
    const filePath = path.join(__dirname, '../uploads/raw-materials', document.filename);
    
    res.download(filePath, document.originalName, (error) => {
      if (error) {
        console.error('Error al descargar archivo:', error);
        res.status(404).json({ message: 'Archivo no encontrado' });
      }
    });
  } catch (error) {
    console.error('Error al descargar documento:', error);
    res.status(500).json({ message: 'Error al descargar documento' });
  }
});

// GET ver/abrir documento
router.get('/view/:id', authenticateToken, async (req, res) => {
  try {
    const document = await RawMaterial.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }
    
    const filePath = path.join(__dirname, '../uploads/raw-materials', document.filename);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
    
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error al ver documento:', error);
    res.status(500).json({ message: 'Error al ver documento' });
  }
});

export default router;
