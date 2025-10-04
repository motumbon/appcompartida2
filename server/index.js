import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar rutas
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import institutionsRoutes from './routes/institutions.js';
import contactsRoutes from './routes/contacts.js';
import activitiesRoutes from './routes/activities.js';
import tasksRoutes from './routes/tasks.js';
import complaintsRoutes from './routes/complaints.js';
import contractsRoutes from './routes/contracts.js';

// Importar modelos
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar a MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/app-trabajo-terreno';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB conectado exitosamente');
    
    // Crear usuario administrador si no existe
    await createAdminUser();
  } catch (error) {
    console.error('❌ Error al conectar MongoDB:', error.message);
    process.exit(1);
  }
};

// Función para crear usuario administrador por defecto
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ username: 'administrador' });
    
    if (!adminExists) {
      const admin = new User({
        username: 'administrador',
        email: 'administrador@gmail.com',
        password: '1234567',
        isAdmin: true
      });
      
      await admin.save();
      console.log('✅ Usuario administrador creado exitosamente');
      console.log('   Usuario: administrador');
      console.log('   Contraseña: 1234567');
    }
  } catch (error) {
    console.error('❌ Error al crear usuario administrador:', error.message);
  }
};

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/institutions', institutionsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/contracts', contractsRoutes);

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));
  
  // Todas las rutas no-API deben servir el index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // Ruta de prueba en desarrollo
  app.get('/', (req, res) => {
    res.json({ message: 'API de App Trabajo en Terreno 2.0' });
  });
}

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor', error: err.message });
});

// Iniciar servidor
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
  });
});

export default app;
