import express from 'express';
import Institution from '../models/Institution.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Obtener todas las instituciones
router.get('/', authenticateToken, async (req, res) => {
  try {
    const institutions = await Institution.find().sort({ name: 1 });
    res.json(institutions);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener instituciones', error: error.message });
  }
});

// Crear institución (solo admin)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, address, phone, email } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'El nombre es requerido' });
    }

    const existingInstitution = await Institution.findOne({ name });
    if (existingInstitution) {
      return res.status(400).json({ message: 'La institución ya existe' });
    }

    const institution = new Institution({
      name,
      description,
      address,
      phone,
      email,
      createdBy: req.user._id
    });

    await institution.save();
    res.status(201).json({ message: 'Institución creada exitosamente', institution });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear institución', error: error.message });
  }
});

// Actualizar institución (solo admin)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, address, phone, email } = req.body;

    const institution = await Institution.findByIdAndUpdate(
      id,
      { name, description, address, phone, email },
      { new: true, runValidators: true }
    );

    if (!institution) {
      return res.status(404).json({ message: 'Institución no encontrada' });
    }

    res.json({ message: 'Institución actualizada exitosamente', institution });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar institución', error: error.message });
  }
});

// Eliminar institución (solo admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await Institution.findByIdAndDelete(id);
    res.json({ message: 'Institución eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar institución', error: error.message });
  }
});

export default router;
