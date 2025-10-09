import admin from 'firebase-admin';
import { Expo } from 'expo-server-sdk';
import PushToken from '../models/PushToken.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PushNotificationService {
  constructor() {
    this.expo = new Expo();
    this.initializeFirebase();
  }

  initializeFirebase() {
    try {
      // Verificar si Firebase ya está inicializado
      if (!admin.apps.length) {
        const serviceAccountPath = join(__dirname, '../firebase-service-account.json');
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        
        console.log('✅ Firebase Admin SDK inicializado correctamente');
      }
    } catch (error) {
      console.warn('⚠️ Firebase Admin SDK no disponible, usando solo Expo SDK:', error.message);
    }
  }

  /**
   * Enviar notificación push a usuarios específicos
   * @param {Array} userIds - Array de IDs de usuarios
   * @param {Object} notification - {title, body, data}
   */
  async sendToUsers(userIds, notification) {
    try {
      // Obtener tokens de los usuarios
      const pushTokens = await PushToken.find({
        user: { $in: userIds }
      });

      if (pushTokens.length === 0) {
        console.log('⚠️ No hay tokens registrados para estos usuarios');
        return { success: false, message: 'No tokens found' };
      }

      // Filtrar solo tokens válidos
      const validTokens = pushTokens.filter(pt => 
        pt.token && Expo.isExpoPushToken(pt.token)
      );

      if (validTokens.length === 0) {
        console.log('⚠️ No hay tokens válidos de Expo Push. Tokens encontrados:', 
          pushTokens.map(pt => pt.token.substring(0, 20) + '...').join(', ')
        );
        return { success: false, message: 'No valid Expo tokens' };
      }

      console.log(`📤 Enviando notificación a ${validTokens.length} dispositivo(s) con tokens válidos`);

      // Preparar mensajes para FCM usando Firebase Admin SDK
      const messages = validTokens.map(pt => ({
        token: pt.token,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default'
          }
        }
      }));

      console.log(`📦 Enviando ${messages.length} mensajes via Firebase Admin SDK`);

      // Enviar usando Firebase Admin SDK
      const results = [];
      for (const message of messages) {
        try {
          const response = await admin.messaging().send(message);
          results.push({ success: true, messageId: response });
          console.log(`✅ Mensaje enviado: ${response}`);
        } catch (error) {
          console.error(`❌ Error enviando mensaje:`, error.message);
          results.push({ success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      console.log(`✅ Notificaciones enviadas exitosamente: ${successCount}/${messages.length}`);
      if (errorCount > 0) {
        console.warn(`⚠️ ${errorCount} notificaciones fallaron`);
      }
      
      return { success: true, results, successCount, errorCount };
    } catch (error) {
      console.error('❌ Error enviando notificaciones push:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notificar actividad compartida
   */
  async notifySharedActivity(activity, sharedWithUserIds) {
    const creatorName = activity.createdBy?.username || 'Alguien';
    
    return await this.sendToUsers(sharedWithUserIds, {
      title: '📅 Nueva actividad compartida',
      body: `${creatorName} compartió: "${activity.subject}"`,
      data: {
        type: 'activity',
        activityId: activity._id.toString(),
        screen: 'Actividades'
      }
    });
  }

  /**
   * Notificar tarea compartida
   */
  async notifySharedTask(task, sharedWithUserIds) {
    const creatorName = task.createdBy?.username || 'Alguien';
    
    return await this.sendToUsers(sharedWithUserIds, {
      title: '✅ Nueva tarea compartida',
      body: `${creatorName} compartió: "${task.title}"`,
      data: {
        type: 'task',
        taskId: task._id.toString(),
        screen: 'Tareas'
      }
    });
  }

  /**
   * Notificar nota compartida
   */
  async notifySharedNote(note, sharedWithUserIds) {
    const creatorName = note.createdBy?.username || 'Alguien';
    
    return await this.sendToUsers(sharedWithUserIds, {
      title: '📝 Nueva nota compartida',
      body: `${creatorName} compartió: "${note.subject}"`,
      data: {
        type: 'note',
        noteId: note._id.toString(),
        screen: 'Notas'
      }
    });
  }

  /**
   * Notificar reclamo compartido
   */
  async notifySharedComplaint(complaint, sharedWithUserIds) {
    const creatorName = complaint.createdBy?.username || 'Alguien';
    
    return await this.sendToUsers(sharedWithUserIds, {
      title: '⚠️ Nuevo reclamo compartido',
      body: `${creatorName} compartió: "${complaint.title}"`,
      data: {
        type: 'complaint',
        complaintId: complaint._id.toString(),
        screen: 'Reclamos'
      }
    });
  }

  /**
   * Notificar contratos actualizados
   */
  async notifyContractsUpdate(allUserIds, updatedBy) {
    const updaterName = updatedBy?.username || 'Administrador';
    
    return await this.sendToUsers(allUserIds, {
      title: '📄 Contratos actualizados',
      body: `${updaterName} ha cargado nuevos contratos`,
      data: {
        type: 'contracts',
        screen: 'Contratos'
      }
    });
  }

  /**
   * Notificar stock actualizado
   */
  async notifyStockUpdate(allUserIds, updatedBy) {
    const updaterName = updatedBy?.username || 'Administrador';
    
    return await this.sendToUsers(allUserIds, {
      title: '📦 Stock actualizado',
      body: `${updaterName} ha actualizado el inventario`,
      data: {
        type: 'stock',
        screen: 'Stock'
      }
    });
  }
}

export default new PushNotificationService();
