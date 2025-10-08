import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import Contract from '../models/Contract.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configurar multer para archivos Excel en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
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

// Obtener contratos actual
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Buscar el batch más reciente
    const latestContract = await Contract.findOne()
      .populate('uploadedBy', 'username email name')
      .sort({ uploadedAt: -1 });
    
    if (!latestContract) {
      return res.json({ items: [], uploadedBy: null, uploadedAt: null, fileName: null });
    }
    
    // Obtener todos los chunks del mismo batch
    const allChunks = await Contract.find({ batchId: latestContract.batchId })
      .sort({ chunkIndex: 1 });
    
    // Combinar todos los items
    const allItems = allChunks.reduce((acc, chunk) => {
      return acc.concat(chunk.items);
    }, []);
    
    res.json({
      items: allItems,
      uploadedBy: latestContract.uploadedBy,
      uploadedAt: latestContract.uploadedAt,
      fileName: latestContract.fileName
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener contratos', error: error.message });
  }
});

// Subir archivo Excel con contratos
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  console.log(`📄 Iniciando upload de contratos - Archivo: ${req.file?.originalname || 'N/A'}, Tamaño: ${(req.file?.size / 1024 / 1024).toFixed(2)}MB`);
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }
    
    console.log(`⏱️ [${Date.now() - startTime}ms] Archivo recibido, procesando...`);

    // Eliminar índice antiguo si existe
    try {
      await Contract.collection.dropIndex('contractNumber_1');
      console.log('Índice antiguo contractNumber_1 eliminado');
    } catch (error) {
      // Ignorar si el índice no existe
      if (!error.message.includes('index not found')) {
        console.log('No se pudo eliminar índice:', error.message);
      }
    }

    console.log(`⏱️ [${Date.now() - startTime}ms] Leyendo Excel...`);
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    console.log(`⏱️ [${Date.now() - startTime}ms] Excel leído, ${workbook.SheetNames.length} hojas`);
    
    // Buscar la hoja "DDBB"
    let sheetName = workbook.SheetNames.find(name => 
      name.toUpperCase() === 'DDBB'
    );
    
    if (!sheetName) {
      return res.status(400).json({ 
        message: 'No se encontró la hoja "DDBB" en el archivo Excel',
        hojas: workbook.SheetNames 
      });
    }
    
    console.log(`⏱️ [${Date.now() - startTime}ms] Leyendo hoja: ${sheetName}`);
    console.log('Hojas disponibles:', workbook.SheetNames);
    
    const sheet = workbook.Sheets[sheetName];
    
    // Leer datos
    let data = [];
    data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    // Si los headers son __EMPTY, buscar la fila de encabezados
    if (data.length > 0 && Object.keys(data[0])[0].includes('__EMPTY')) {
      console.log('Detectadas columnas vacías, buscando encabezados...');
      
      const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      console.log('Total de filas:', allRows.length);
      
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(10, allRows.length); i++) {
        const row = allRows[i];
        if (row && row.length > 0) {
          const rowString = row.join('|').toLowerCase();
          if (rowString.includes('linea') || rowString.includes('kam') || rowString.includes('cliente')) {
            headerRowIndex = i;
            console.log('Encabezados encontrados en fila', i + 1);
            break;
          }
        }
      }
      
      if (headerRowIndex >= 0) {
        data = XLSX.utils.sheet_to_json(sheet, { 
          range: headerRowIndex,
          defval: '' 
        });
      }
    }

    console.log('Filas leídas:', data.length);
    if (data.length > 0) {
      console.log('Primera fila (ejemplo):', data[0]);
      console.log('Columnas disponibles:', Object.keys(data[0]));
    }

    if (!data || data.length === 0) {
      return res.status(400).json({ message: 'La hoja DDBB está vacía o no tiene datos' });
    }

    // Función para convertir fecha de Excel a formato legible
    const excelDateToJSDate = (serial) => {
      if (!serial || isNaN(serial)) return '';
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      const year = date_info.getFullYear();
      const month = String(date_info.getMonth() + 1).padStart(2, '0');
      const day = String(date_info.getDate()).padStart(2, '0');
      return `${day}-${month}-${year}`;
    };

    // Mapear los datos
    const items = data.map(row => {
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

      const getDateColumn = (possibleNames) => {
        for (const key in row) {
          const keyLower = key.toLowerCase().trim();
          for (const name of possibleNames) {
            if (keyLower === name.toLowerCase() || keyLower.includes(name.toLowerCase())) {
              const value = row[key];
              if (!value) return '';
              
              // Si es un número (fecha de Excel)
              if (typeof value === 'number') {
                return excelDateToJSDate(value);
              }
              
              // Si ya es string, devolverlo tal cual
              return String(value).trim();
            }
          }
        }
        return '';
      };

      return {
        linea: getColumn(['linea', 'línea', 'line']),
        kamRepr: getColumn(['kam / repr', 'kam', 'repr', 'representante']),
        cliente: getColumn(['cliente', 'cod cliente', 'codigo cliente']),
        nomCliente: getColumn(['nom_cliente', 'nom cliente', 'nombre cliente', 'nombre_cliente']),
        numPedido: getColumn(['nº de pedido', 'num pedido', 'numero pedido', 'pedido']),
        material: getColumn(['material', 'codigo material', 'cod material']),
        denominacion: getColumn(['denominación', 'denominacion', 'descripcion', 'descripción']),
        inicioValidez: getDateColumn(['inicio validez', 'inicio', 'fecha inicio']),
        finValidez: getDateColumn(['fin de validez', 'fin validez', 'fin', 'fecha fin']),
        tipoCtto: getColumn(['tipo ctto', 'tipo', 'tipo contrato']),
        tipoPosicion: getColumn(['tipo de posición', 'tipo de posicion', 'tipo posicion', 'tipo posición'])
      };
    });

    console.log(`⏱️ [${Date.now() - startTime}ms] Items mapeados: ${items.length}`);
    if (items.length > 0) {
      console.log('Primer item mapeado:', items[0]);
    }

    // Filtrar filas con datos significativos y excluir ZKE1
    const filteredItems = items.filter(item => {
      // Excluir si tipoPosicion es ZKE1
      if (item.tipoPosicion && item.tipoPosicion.toUpperCase() === 'ZKE1') {
        return false;
      }
      // Incluir solo si tiene datos significativos
      return item.cliente || item.nomCliente || item.numPedido || item.kamRepr;
    });

    console.log(`⏱️ [${Date.now() - startTime}ms] Items filtrados: ${filteredItems.length} (excluidos: ${items.length - filteredItems.length})`);

    if (filteredItems.length === 0) {
      return res.status(400).json({ 
        message: 'No se pudieron detectar datos válidos. Verifica que la hoja DDBB tenga las columnas correctas',
        columnas: data.length > 0 ? Object.keys(data[0]) : []
      });
    }

    // Eliminar contratos anteriores
    console.log(`⏱️ [${Date.now() - startTime}ms] Eliminando contratos anteriores...`);
    await Contract.deleteMany({});
    console.log(`⏱️ [${Date.now() - startTime}ms] Contratos anteriores eliminados`);

    // Dividir items en chunks para evitar límite de 16MB de MongoDB
    const CHUNK_SIZE = 1000; // 1000 items por chunk
    const chunks = [];
    for (let i = 0; i < filteredItems.length; i += CHUNK_SIZE) {
      chunks.push(filteredItems.slice(i, i + CHUNK_SIZE));
    }

    console.log(`⏱️ [${Date.now() - startTime}ms] Dividiendo ${filteredItems.length} items en ${chunks.length} chunks`);

    // Crear un batchId único para este upload
    const batchId = `${Date.now()}-${req.user._id}`;

    // Guardar cada chunk
    const savedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = new Contract({
        items: chunks[i],
        uploadedBy: req.user._id,
        fileName: req.file.originalname,
        batchId: batchId,
        chunkIndex: i,
        totalChunks: chunks.length
      });

      await chunk.save();
      savedChunks.push(chunk);
      console.log(`⏱️ [${Date.now() - startTime}ms] Chunk ${i + 1}/${chunks.length} guardado con ${chunks[i].length} items`);
    }

    console.log(`⏱️ [${Date.now() - startTime}ms] Todos los contratos guardados exitosamente`);

    // Poblar el primer chunk para la respuesta
    await savedChunks[0].populate('uploadedBy', 'username email name');
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Upload completado en ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);

    res.status(201).json({ 
      message: 'Contratos actualizados exitosamente', 
      contract: {
        items: filteredItems,
        uploadedBy: savedChunks[0].uploadedBy,
        uploadedAt: savedChunks[0].uploadedAt,
        fileName: savedChunks[0].fileName
      },
      stats: {
        totalItems: filteredItems.length,
        processingTime: `${(totalTime/1000).toFixed(2)}s`,
        chunks: chunks.length
      }
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Error al procesar archivo (tiempo: ${totalTime}ms):`, error.message);
    console.error('Stack trace:', error.stack);
    
    // Error más específico para el cliente
    const errorMessage = error.message.includes('size') 
      ? 'El archivo es demasiado grande. Intenta con un archivo más pequeño o contacta al administrador.'
      : error.message.includes('timeout')
      ? 'El procesamiento tardó demasiado. Intenta con un archivo más pequeño.'
      : `Error al procesar el archivo Excel: ${error.message}`;
    
    res.status(500).json({ 
      message: errorMessage,
      error: error.message,
      processingTime: `${(totalTime/1000).toFixed(2)}s`
    });
  }
});

// Eliminar todos los contratos
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await Contract.deleteMany({});
    res.json({ message: 'Contratos eliminados exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar contratos', error: error.message });
  }
});

export default router;
