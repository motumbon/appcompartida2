import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import Contract from '../models/Contract.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configurar multer para subir archivos
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Obtener todos los contratos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const contracts = await Contract.find()
      .populate('institution', 'name')
      .populate('uploadedBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener contratos', error: error.message });
  }
});

// Subir archivo Excel con contratos (solo admin)
router.post('/upload', authenticateToken, isAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó archivo' });
    }

    // Leer el archivo Excel
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const contractsCreated = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Mapear columnas del Excel a campos del modelo
        // Ajustar según la estructura del Excel
        const contractData = {
          contractNumber: row['Numero de Contrato'] || row['contractNumber'] || `CONTRACT-${Date.now()}-${i}`,
          clientName: row['Cliente'] || row['clientName'] || row['Nombre Cliente'],
          startDate: row['Fecha Inicio'] || row['startDate'],
          endDate: row['Fecha Fin'] || row['endDate'],
          amount: row['Monto'] || row['amount'] || 0,
          status: row['Estado'] || row['status'] || 'activo',
          description: row['Descripcion'] || row['description'] || '',
          additionalData: row,
          uploadedBy: req.user._id
        };

        // Validar datos requeridos
        if (!contractData.clientName || !contractData.startDate || !contractData.endDate) {
          errors.push({ row: i + 1, message: 'Faltan campos requeridos (Cliente, Fecha Inicio, Fecha Fin)' });
          continue;
        }

        // Verificar si ya existe un contrato con ese número
        const existingContract = await Contract.findOne({ contractNumber: contractData.contractNumber });
        
        if (existingContract) {
          // Actualizar contrato existente
          Object.assign(existingContract, contractData);
          await existingContract.save();
          contractsCreated.push(existingContract);
        } else {
          // Crear nuevo contrato
          const contract = new Contract(contractData);
          await contract.save();
          contractsCreated.push(contract);
        }
      } catch (error) {
        errors.push({ row: i + 1, message: error.message });
      }
    }

    res.json({
      message: `${contractsCreated.length} contratos procesados exitosamente`,
      contractsCreated: contractsCreated.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al procesar archivo Excel', error: error.message });
  }
});

// Crear contrato manualmente (solo admin)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { contractNumber, clientName, institution, startDate, endDate, amount, status, description } = req.body;

    if (!contractNumber || !clientName || !startDate || !endDate) {
      return res.status(400).json({ message: 'Número de contrato, cliente, fecha inicio y fecha fin son requeridos' });
    }

    const existingContract = await Contract.findOne({ contractNumber });
    if (existingContract) {
      return res.status(400).json({ message: 'Ya existe un contrato con ese número' });
    }

    const contract = new Contract({
      contractNumber,
      clientName,
      institution,
      startDate,
      endDate,
      amount,
      status: status || 'activo',
      description,
      uploadedBy: req.user._id
    });

    await contract.save();
    await contract.populate(['institution', 'uploadedBy']);

    res.status(201).json({ message: 'Contrato creado exitosamente', contract });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear contrato', error: error.message });
  }
});

// Actualizar contrato (solo admin)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { contractNumber, clientName, institution, startDate, endDate, amount, status, description } = req.body;

    const contract = await Contract.findById(id);

    if (!contract) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    contract.contractNumber = contractNumber || contract.contractNumber;
    contract.clientName = clientName || contract.clientName;
    contract.institution = institution !== undefined ? institution : contract.institution;
    contract.startDate = startDate || contract.startDate;
    contract.endDate = endDate || contract.endDate;
    contract.amount = amount !== undefined ? amount : contract.amount;
    contract.status = status || contract.status;
    contract.description = description !== undefined ? description : contract.description;

    await contract.save();
    await contract.populate(['institution', 'uploadedBy']);

    res.json({ message: 'Contrato actualizado exitosamente', contract });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar contrato', error: error.message });
  }
});

// Eliminar contrato (solo admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await Contract.findByIdAndDelete(id);
    res.json({ message: 'Contrato eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar contrato', error: error.message });
  }
});

export default router;
