import express from 'express';
import Contact from '../models/Contact.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Obtener contactos del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const contacts = await Contact.find({ addedBy: req.user._id })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener contactos', error: error.message });
  }
});

// Agregar contacto
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, notes } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Nombre y email son requeridos' });
    }

    // Verificar si el email corresponde a un usuario registrado
    const registeredUser = await User.findOne({ email });

    const contact = new Contact({
      name,
      email,
      phone,
      notes,
      isRegisteredUser: !!registeredUser,
      userId: registeredUser ? registeredUser._id : null,
      addedBy: req.user._id
    });

    await contact.save();
    
    // Popular userId si existe
    await contact.populate('userId', 'username email');

    res.status(201).json({ message: 'Contacto agregado exitosamente', contact });
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar contacto', error: error.message });
  }
});

// Actualizar contacto
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, notes } = req.body;

    const contact = await Contact.findOne({ _id: id, addedBy: req.user._id });

    if (!contact) {
      return res.status(404).json({ message: 'Contacto no encontrado' });
    }

    contact.name = name || contact.name;
    contact.email = email || contact.email;
    contact.phone = phone || contact.phone;
    contact.notes = notes || contact.notes;

    // Verificar si el nuevo email corresponde a un usuario registrado
    if (email && email !== contact.email) {
      const registeredUser = await User.findOne({ email });
      contact.isRegisteredUser = !!registeredUser;
      contact.userId = registeredUser ? registeredUser._id : null;
    }

    await contact.save();
    await contact.populate('userId', 'username email');

    res.json({ message: 'Contacto actualizado exitosamente', contact });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar contacto', error: error.message });
  }
});

// Eliminar contacto
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const contact = await Contact.findOneAndDelete({ _id: id, addedBy: req.user._id });

    if (!contact) {
      return res.status(404).json({ message: 'Contacto no encontrado' });
    }

    res.json({ message: 'Contacto eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar contacto', error: error.message });
  }
});

export default router;
