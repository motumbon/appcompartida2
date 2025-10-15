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
import stockRoutes from './routes/stock.js';
import notesRoutes from './routes/notes.js';
import pushTokensRoutes from './routes/pushTokens.js';
import testNotificationsRoutes from './routes/testNotifications.js';
import rawMaterialsRoutes from './routes/rawMaterials.js';

// Importar modelos
import User from './models/User.js';

// Importar servicios
import notificationMonitor from './services/notificationMonitor.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración CORS mejorada para soportar navegadores móviles
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir todas las origins en desarrollo
    // En producción, permitir Railway y localhost
    const allowedOrigins = [
      'https://web-production-10bfc.up.railway.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5000'
    ];
    
    // Permitir peticiones sin origin (ej: aplicaciones móviles, Postman)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(null, true); // Permitir todas en producción también por compatibilidad
    }
  },
  credentials: true, // Permitir cookies y autenticación
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400, // Cache preflight request por 24 horas
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));

// Manejar preflight requests explícitamente
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Headers adicionales para compatibilidad móvil
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Responder inmediatamente a OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

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

// Health check endpoint (debe estar ANTES de las rutas API)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/institutions', institutionsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/push-tokens', pushTokensRoutes);
app.use('/api/test-notifications', testNotificationsRoutes);
app.use('/api/raw-materials', rawMaterialsRoutes);

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));
  
  // Todas las rutas NO-API deben servir el index.html
  app.get('*', (req, res) => {
    // Si es una ruta API que no existe, devolver 404
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint no encontrado' });
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // Ruta de prueba en desarrollo
  app.get('/', (req, res) => {
    res.json({ 
      message: 'API de App Trabajo en Terreno 2.0',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        activities: '/api/activities',
        tasks: '/api/tasks',
        complaints: '/api/complaints',
        contracts: '/api/contracts',
        stock: '/api/stock',
        notes: '/api/notes',
        contacts: '/api/contacts',
        users: '/api/users',
        institutions: '/api/institutions'
      }
    });
  });
}

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor', error: err.message });
});

// Iniciar servidor
connectDB().then(() => {
  const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📍 HOST: ${HOST}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.NODE_ENV === 'production') {
      console.log(`✅ Escuchando en todas las interfaces de red (0.0.0.0:${PORT})`);
    }
    
    // Iniciar monitoreo de notificaciones push
    // DESACTIVADO: Las notificaciones inmediatas ya funcionan correctamente
    // notificationMonitor.start();
  });
  
  // Aumentar timeout para uploads de archivos grandes (5 minutos)
  server.timeout = 300000; // 5 minutos en milisegundos
  server.keepAliveTimeout = 65000; // 65 segundos
  server.headersTimeout = 66000; // 66 segundos
  
  console.log('⏱️ Timeouts configurados: request=300s, keepAlive=65s');
});

export default app;
