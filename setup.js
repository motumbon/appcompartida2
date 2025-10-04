import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Configurando App Trabajo en Terreno 2.0...\n');

// Generar JWT Secret aleatorio
const jwtSecret = crypto.randomBytes(32).toString('hex');

// Contenido del archivo .env
const envContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/app-trabajo-terreno
JWT_SECRET=${jwtSecret}
NODE_ENV=development

# Google Calendar API (Opcional - para integración con calendario)
# GOOGLE_CLIENT_ID=tu_client_id_aqui
# GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
# GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
`;

// Ruta del archivo .env
const envPath = path.join(__dirname, '.env');

// Verificar si ya existe
if (fs.existsSync(envPath)) {
  console.log('⚠️  El archivo .env ya existe.');
  console.log('   Si deseas recrearlo, elimínalo primero y vuelve a ejecutar este script.\n');
} else {
  // Crear archivo .env
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Archivo .env creado exitosamente en la raíz del proyecto');
  console.log('📝 JWT_SECRET generado automáticamente (seguro y único)');
  console.log('🔐 Configuración de seguridad lista\n');
}

// Crear .env para el cliente si no existe
const clientEnvPath = path.join(__dirname, 'client', '.env');
const clientEnvContent = `VITE_API_URL=http://localhost:5000/api
`;

if (!fs.existsSync(clientEnvPath)) {
  fs.writeFileSync(clientEnvPath, clientEnvContent);
  console.log('✅ Archivo client/.env creado exitosamente');
} else {
  console.log('ℹ️  El archivo client/.env ya existe');
}

console.log('\n📋 Configuración completada:');
console.log('   - Backend: http://localhost:5000');
console.log('   - Frontend: http://localhost:5173');
console.log('   - MongoDB: mongodb://localhost:27017/app-trabajo-terreno');
console.log('\n🎯 Próximos pasos:');
console.log('   1. Asegúrate de que MongoDB esté corriendo');
console.log('   2. Ejecuta: npm run install-all');
console.log('   3. Ejecuta: npm run dev');
console.log('\n👤 Usuario administrador predefinido:');
console.log('   Usuario: administrador');
console.log('   Contraseña: 1234567');
console.log('\n✨ ¡Todo listo para comenzar!\n');
