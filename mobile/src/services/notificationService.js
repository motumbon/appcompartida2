import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configurar cómo se manejan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
  }

  // Registrar el dispositivo para notificaciones
  async registerForPushNotifications() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
        sound: 'default',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      // Para notificaciones locales no necesitamos token de push
      token = 'local-notifications';
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  // Enviar notificación local
  async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null, // null significa que se muestra inmediatamente
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Notificación para actividad compartida
  async notifySharedActivity(activity, sharedBy) {
    await this.sendLocalNotification(
      '📅 Nueva actividad compartida',
      `${sharedBy} te compartió: "${activity.subject}"`,
      { type: 'activity', id: activity._id }
    );
  }

  // Notificación para tarea compartida
  async notifySharedTask(task, sharedBy) {
    await this.sendLocalNotification(
      '✅ Nueva tarea compartida',
      `${sharedBy} te compartió: "${task.title}"`,
      { type: 'task', id: task._id }
    );
  }

  // Notificación para contratos actualizados
  async notifyContractsUpdate(uploadedBy) {
    await this.sendLocalNotification(
      '📄 Contratos actualizados',
      `${uploadedBy} ha cargado nuevos contratos`,
      { type: 'contracts' }
    );
  }

  // Notificación para stock actualizado
  async notifyStockUpdate(uploadedBy) {
    await this.sendLocalNotification(
      '📦 Stock actualizado',
      `${uploadedBy} ha actualizado el inventario`,
      { type: 'stock' }
    );
  }

  // Notificación para reclamo compartido
  async notifySharedComplaint(complaint, sharedBy) {
    await this.sendLocalNotification(
      '⚠️ Nuevo reclamo compartido',
      `${sharedBy} te compartió: "${complaint.title}"`,
      { type: 'complaint', id: complaint._id }
    );
  }

  // Configurar listeners para respuestas a notificaciones
  setupNotificationListeners(onNotificationReceived, onNotificationResponse) {
    // Listener cuando se recibe una notificación
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listener cuando el usuario toca una notificación
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    });
  }

  // Limpiar listeners
  removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Cancelar todas las notificaciones
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Obtener permisos actuales
  async getPermissions() {
    return await Notifications.getPermissionsAsync();
  }
}

export default new NotificationService();
