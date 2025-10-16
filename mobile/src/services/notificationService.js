import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';

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
    this.channelCreated = false;
  }

  // Registrar el dispositivo para notificaciones
  async registerForPushNotifications() {
    let token = null;

    try {
      // Crear canal de notificaciones para Android
      if (Platform.OS === 'android') {
        console.log('🔔 Creando canal de notificaciones para Android...');
        
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Notificaciones Generales',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3b82f6',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });

        // Canal de alta prioridad
        await Notifications.setNotificationChannelAsync('high_priority', {
          name: 'Notificaciones Importantes',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#ef4444',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });

        this.channelCreated = true;
        console.log('✅ Canales de notificaciones creados correctamente');
      }

      if (Device.isDevice) {
        // Verificar permisos existentes
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        console.log('📱 Estado de permisos actual:', existingStatus);
        
        // Solicitar permisos si no están otorgados
        if (existingStatus !== 'granted') {
          console.log('⚠️ Solicitando permisos de notificación...');
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
          console.log('📱 Nuevo estado de permisos:', finalStatus);
        }
        
        if (finalStatus !== 'granted') {
          console.error('❌ Permisos de notificación denegados');
          Alert.alert(
            'Permisos Requeridos',
            'Esta app necesita permisos de notificación para funcionar correctamente. Por favor, habilítalos en la configuración.',
            [{ text: 'OK' }]
          );
          return null;
        }
        
        console.log('✅ Permisos de notificación otorgados');
        
        // Intentar obtener token de Expo Push Notifications
        // Si falla, simplemente continuar sin push remoto
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: '00a515c1-6a8f-4c94-9637-f2ca52cf16ca'
          });
          token = tokenData.data;
          console.log('🎫 Token de push obtenido:', token);
          
          // Registrar token en el backend solo si es válido
          if (token && token.startsWith('ExponentPushToken[')) {
            await this.registerTokenWithBackend(token);
          }
        } catch (tokenError) {
          console.warn('⚠️ Push notifications no disponibles (Firebase no configurado)');
          console.log('📲 La app funcionará con notificaciones locales únicamente');
          // No generar token fake - simplemente no usar push remoto
          token = null;
        }
      } else {
        console.warn('⚠️ Las notificaciones push requieren un dispositivo físico');
      }
    } catch (error) {
      console.error('❌ Error al configurar notificaciones:', error);
      Alert.alert('Error', 'No se pudieron configurar las notificaciones: ' + error.message);
    }

    return token;
  }

  // Registrar token en el backend
  async registerTokenWithBackend(token) {
    try {
      const { pushTokensAPI } = await import('../config/api.js');
      const deviceInfo = `${Device.brand} ${Device.modelName} - ${Platform.OS} ${Platform.Version}`;
      
      await pushTokensAPI.register({
        token,
        deviceInfo
      });
      
      console.log('✅ Token registrado en el backend correctamente');
    } catch (error) {
      console.error('❌ Error registrando token en backend:', error);
    }
  }

  // Enviar notificación local
  async sendLocalNotification(title, body, data = {}, priority = 'default') {
    try {
      console.log('📤 Enviando notificación:', title);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
          badge: 1,
          ...(Platform.OS === 'android' && {
            channelId: priority === 'high' ? 'high_priority' : 'default',
          }),
        },
        trigger: null, // null significa que se muestra inmediatamente
      });
      
      console.log('✅ Notificación enviada con ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('❌ Error enviando notificación:', error);
      Alert.alert('Error', 'No se pudo enviar la notificación: ' + error.message);
      return null;
    }
  }
  
  // Método de prueba para verificar que las notificaciones funcionan
  async sendTestNotification() {
    return await this.sendLocalNotification(
      '🧪 Notificación de Prueba',
      'Si ves esto, las notificaciones están funcionando correctamente',
      { type: 'test' },
      'high'
    );
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
