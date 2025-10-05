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
    
    // Convertir a JSON con headers detectados automáticamente
    // Intentamos leer con diferentes configuraciones
    let data = [];
    let headers = [];
    
    // Primero intentamos leer normalmente
    data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    if (data.length > 0 && Object.keys(data[0])[0].includes('__EMPTY')) {
      console.log('Detectadas columnas vacías, buscando encabezados...');
      
      // Si los headers son __EMPTY, significa que la primera fila está vacía
      // Intentamos leer todo como array y buscar la fila de encabezados
      const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      console.log('Total de filas:', allRows.length);
      
      // Buscar la fila que contiene los encabezados
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(10, allRows.length); i++) {
        const row = allRows[i];
        if (row && row.length > 0) {
          // Buscar si esta fila contiene palabras clave como "codigo", "material", etc.
          const rowString = row.join('|').toLowerCase();
          if (rowString.includes('codigo') || rowString.includes('material') || rowString.includes('linea')) {
            headerRowIndex = i;
            headers = row.map(h => String(h || '').trim());
            console.log('Encabezados encontrados en fila', i + 1, ':', headers);
            break;
          }
        }
      }
      
      if (headerRowIndex >= 0) {
        // Leer desde la fila de encabezados
        data = XLSX.utils.sheet_to_json(sheet, { 
          range: headerRowIndex,
          defval: '' 
        });
        console.log('Datos leídos desde fila de encabezados:', data.length);
      }
    }

    console.log('Filas leídas:', data.length);
    if (data.length > 0) {
      console.log('Primera fila (ejemplo):', data[0]);
      console.log('Columnas disponibles:', Object.keys(data[0]));
    }

    if (!data || data.length === 0) {
      return res.status(400).json({ message: 'La hoja de Excel está vacía o no tiene datos' });
    }

    // Mapear los datos a nuestro esquema
    // Las columnas pueden venir con diferentes nombres, intentamos detectarlas
    const items = data.map(row => {
      // Buscar las columnas por nombre (case insensitive y parcial)
      const getColumn = (possibleNames) => {
        for (const key in row) {
          const keyLower = key.toLowerCase().trim();
          for (const name of possibleNames) {
            if (keyLower === name.toLowerCase() || keyLower.includes(name.toLowerCase())) {
              const value = row[key];
              return value !== null && value !== undefined ? String(value).trim() : '';
            }
          }
        }
        return '';
      };

      const mappedRow = {
        linea: getColumn(['linea', 'línea', 'line']), // Removido 'sociedad'
        codigo: getColumn(['codigo', 'código', 'code']),
        material: getColumn(['material', 'producto', 'product']),
        observacion: getColumn(['observacion', 'observación', 'obs']),
        status: getColumn(['status', 'estado'])
      };

      return mappedRow;
    });

    console.log('Items mapeados:', items.length);
    if (items.length > 0) {
      console.log('Primer item mapeado:', items[0]);
    }

    // Filtrar solo filas que tengan al menos algún dato significativo
    const filteredItems = items.filter(item => 
      item.codigo || item.material || item.linea || item.status
    );

    console.log('Items después de filtrar:', filteredItems.length);

    if (filteredItems.length === 0) {
      return res.status(400).json({ 
        message: 'No se pudo detectar datos válidos en el Excel. Verifica que la hoja tenga las columnas: Linea, codigo, Material, Observacion, status',
        columnas: data.length > 0 ? Object.keys(data[0]) : []
      });
    }

    // Eliminar el stock anterior
    await Stock.deleteMany({});

    // Crear nuevo stock
    const newStock = new Stock({
      items: filteredItems,
      uploadedBy: req.user._id,
      fileName: req.file.originalname
    });

    console.log('Stock guardado con', filteredItems.length, 'items');

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
