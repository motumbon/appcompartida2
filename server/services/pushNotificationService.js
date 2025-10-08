import axios from 'axios';
import PushToken from '../models/PushToken.js';

class PushNotificationService {
  constructor() {
    this.expo_push_url = 'https://exp.host/--/api/v2/push/send';
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

      // Filtrar solo tokens válidos de Expo (que empiecen con "ExponentPushToken")
      const validTokens = pushTokens.filter(pt => 
        pt.token && pt.token.startsWith('ExponentPushToken[')
      );

      if (validTokens.length === 0) {
        console.log('⚠️ No hay tokens válidos de Expo Push. Tokens encontrados:', 
          pushTokens.map(pt => pt.token.substring(0, 20) + '...').join(', ')
        );
        return { success: false, message: 'No valid Expo tokens' };
      }

      console.log(`📤 Enviando notificación a ${validTokens.length} dispositivo(s) con tokens válidos`);

      // Preparar mensajes para Expo Push Notifications
      const messages = validTokens.map(pt => ({
        to: pt.token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        priority: 'high',
        channelId: 'default'
      }));

      // Enviar notificaciones en lotes
      const results = await this.sendBatch(messages);
      
      console.log(`✅ Notificaciones enviadas. Resultados:`, results);
      
      return { success: true, results };
    } catch (error) {
      console.error('❌ Error enviando notificaciones push:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar lote de notificaciones a Expo
   */
  async sendBatch(messages) {
    try {
      const response = await axios.post(this.expo_push_url, messages, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error llamando a Expo Push API:', error.response?.data || error.message);
      throw error;
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
