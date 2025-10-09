import { Expo } from 'expo-server-sdk';
import PushToken from '../models/PushToken.js';

class PushNotificationService {
  constructor() {
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
    });
    console.log('✅ Expo Push Notification Service inicializado');
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

      // Preparar mensajes para Expo Push Notifications
      const messages = [];
      for (const pt of validTokens) {
        if (!Expo.isExpoPushToken(pt.token)) {
          console.error(`Token inválido: ${pt.token}`);
          continue;
        }

        messages.push({
          to: pt.token,
          sound: 'default',
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          priority: 'high',
          channelId: 'default'
        });
      }

      // Dividir mensajes en chunks (Expo limita a 100 por request)
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      console.log(`📦 Enviando ${messages.length} mensajes en ${chunks.length} chunk(s) via Expo Push Service`);

      // Enviar cada chunk
      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
          console.log(`✅ Chunk enviado: ${ticketChunk.length} tickets recibidos`);
        } catch (error) {
          console.error('❌ Error enviando chunk:', error);
        }
      }

      // Verificar si hubo errores en los tickets
      const errors = tickets.filter(ticket => ticket.status === 'error');
      if (errors.length > 0) {
        console.warn(`⚠️ ${errors.length} notificaciones fallaron:`, errors);
      }

      console.log(`✅ Notificaciones enviadas exitosamente: ${tickets.length - errors.length}/${tickets.length}`);
      
      return { success: true, tickets, errors: errors.length };
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
