import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import Stock from '../models/Stock.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configurar multer para archivos Excel en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /xls|xlsx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
    const mimetype = file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel');
    if (extname || mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xls, .xlsx)'));
    }
  }
});

// Obtener stock actual
router.get('/', authenticateToken, async (req, res) => {
  try {
    const stock = await Stock.findOne()
      .populate('uploadedBy', 'username email name')
      .sort({ uploadedAt: -1 });
    
    if (!stock) {
      return res.json({ items: [], uploadedBy: null, uploadedAt: null, fileName: null });
    }

    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener stock', error: error.message });
  }
});

// Subir nuevo archivo Excel
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    // Leer el archivo Excel desde el buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    
    // Buscar la hoja "INFORMACION" primero, si no existe usar la primera
    let sheetName = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('informacion') || 
      name.toLowerCase().includes('información')
    );
    
    // Si no se encuentra "INFORMACION", usar la primera hoja
    if (!sheetName) {
      sheetName = workbook.SheetNames[0];
    }
    
    console.log('Leyendo hoja:', sheetName);
    console.log('Hojas disponibles:', workbook.SheetNames);
    
    const sheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    console.log('Filas leídas:', data.length);
    if (data.length > 0) {
      console.log('Primera fila (ejemplo):', data[0]);
    }

    if (!data || data.length === 0) {
      return res.status(400).json({ message: 'La hoja de Excel está vacía o no tiene datos' });
    }

    // Mapear los datos a nuestro esquema
    // Las columnas pueden venir con diferentes nombres, intentamos detectarlas
    const items = data.map(row => {
      // Buscar las columnas por nombre (case insensitive)
      const getColumn = (possibleNames) => {
        for (const key in row) {
          if (possibleNames.some(name => key.toLowerCase().includes(name.toLowerCase()))) {
            return String(row[key] || '').trim();
          }
        }
        return '';
      };

      return {
        linea: getColumn(['linea', 'línea', 'line', 'sociedad']),
        codigo: getColumn(['codigo', 'código', 'code', 'cod']),
        material: getColumn(['material', 'producto', 'product', 'descripcion', 'descripción']),
        observacion: getColumn(['observacion', 'observación', 'obs', 'observation', 'comentario']),
        status: getColumn(['status', 'estado', 'state', 'stock'])
      };
    }).filter(item => item.codigo || item.material); // Filtrar filas vacías

    // Eliminar el stock anterior
    await Stock.deleteMany({});

    // Crear nuevo stock
    const newStock = new Stock({
      items,
      uploadedBy: req.user._id,
      fileName: req.file.originalname
    });

    await newStock.save();
    await newStock.populate('uploadedBy', 'username email name');

    res.status(201).json({ 
      message: 'Stock actualizado exitosamente', 
      stock: newStock 
    });
  } catch (error) {
    console.error('Error al procesar archivo:', error);
    res.status(500).json({ message: 'Error al procesar el archivo Excel', error: error.message });
  }
});

// Eliminar stock
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await Stock.deleteMany({});
    res.json({ message: 'Stock eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar stock', error: error.message });
  }
});

export default router;
