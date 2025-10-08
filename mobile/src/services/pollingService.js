import { activitiesAPI, tasksAPI, notesAPI } from '../config/api';
import notificationService from './notificationService';
import * as SecureStore from 'expo-secure-store';

class PollingService {
  constructor() {
    this.intervalId = null;
    this.isPolling = false;
    this.lastCheck = {
      activities: new Date().toISOString(),
      tasks: new Date().toISOString(),
      notes: new Date().toISOString()
    };
  }

  /**
   * Iniciar polling en primer plano (cada 2 minutos)
   */
  async startForegroundPolling() {
    if (this.isPolling) {
      console.log('⚠️ Polling ya está activo');
      return;
    }

    console.log('🔄 Iniciando polling de notificaciones (cada 2 minutos)...');
    
    // Cargar última verificación guardada
    await this.loadLastCheck();
    
    // Verificar inmediatamente
    await this.checkForUpdates();
    
    // Configurar intervalo de 2 minutos
    this.intervalId = setInterval(async () => {
      await this.checkForUpdates();
    }, 2 * 60 * 1000); // 2 minutos
    
    this.isPolling = true;
    console.log('✅ Polling activado');
  }

  /**
   * Detener polling
   */
  stopForegroundPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isPolling = false;
      console.log('🛑 Polling detenido');
    }
  }

  /**
   * Cargar última verificación guardada
   */
  async loadLastCheck() {
    try {
      const saved = await SecureStore.getItemAsync('lastNotificationCheck');
      if (saved) {
        this.lastCheck = JSON.parse(saved);
        console.log('📅 Última verificación cargada:', this.lastCheck);
      }
    } catch (error) {
      console.error('Error cargando última verificación:', error);
    }
  }

  /**
   * Guardar última verificación
   */
  async saveLastCheck() {
    try {
      await SecureStore.setItemAsync('lastNotificationCheck', JSON.stringify(this.lastCheck));
    } catch (error) {
      console.error('Error guardando última verificación:', error);
    }
  }

  /**
   * Verificar actualizaciones
   */
  async checkForUpdates() {
    try {
      console.log('🔍 Verificando actualizaciones...', new Date().toLocaleTimeString());
      
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.log('⚠️ Usuario no autenticado, saltando verificación');
        return;
      }

      await Promise.all([
        this.checkNewActivities(userId),
        this.checkNewTasks(userId),
        this.checkNewNotes(userId)
      ]);

      await this.saveLastCheck();
    } catch (error) {
      console.error('❌ Error verificando actualizaciones:', error);
    }
  }

  /**
   * Obtener ID del usuario actual
   */
  async getCurrentUserId() {
    try {
      const userStr = await SecureStore.getItemAsync('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user._id;
      }
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
    }
    return null;
  }

  /**
   * Verificar nuevas actividades
   */
  async checkNewActivities(userId) {
    try {
      const response = await activitiesAPI.getAll();
      const activities = response.data || [];
      
      // Filtrar actividades compartidas conmigo y nuevas
      const newActivities = activities.filter(activity => {
        const isSharedWithMe = activity.sharedWith?.some(u => u._id === userId);
        const isNotMine = activity.createdBy?._id !== userId;
        
        // Usar updatedAt O createdAt (lo que sea más reciente)
        const activityDate = activity.updatedAt || activity.createdAt;
        const isNew = new Date(activityDate) > new Date(this.lastCheck.activities);
        
        return isSharedWithMe && isNotMine && isNew;
      });

      if (newActivities.length > 0) {
        console.log(`📅 ${newActivities.length} nueva(s) actividad(es) compartida(s)`);
        
        for (const activity of newActivities) {
          await notificationService.notifySharedActivity(
            activity,
            activity.createdBy?.username || 'Alguien'
          );
        }
        
        this.lastCheck.activities = new Date().toISOString();
      }
    } catch (error) {
      console.error('Error verificando actividades:', error);
    }
  }

  /**
   * Verificar nuevas tareas
   */
  async checkNewTasks(userId) {
    try {
      const response = await tasksAPI.getAll();
      const tasks = response.data || [];
      
      const newTasks = tasks.filter(task => {
        const isSharedWithMe = task.sharedWith?.some(u => u._id === userId);
        const isNotMine = task.createdBy?._id !== userId;
        
        // Usar updatedAt O createdAt (lo que sea más reciente)
        const taskDate = task.updatedAt || task.createdAt;
        const isNew = new Date(taskDate) > new Date(this.lastCheck.tasks);
        
        return isSharedWithMe && isNotMine && isNew;
      });

      if (newTasks.length > 0) {
        console.log(`✅ ${newTasks.length} nueva(s) tarea(s) compartida(s)`);
        
        for (const task of newTasks) {
          await notificationService.notifySharedTask(
            task,
            task.createdBy?.username || 'Alguien'
          );
        }
        
        this.lastCheck.tasks = new Date().toISOString();
      }
    } catch (error) {
      console.error('Error verificando tareas:', error);
    }
  }

  /**
   * Verificar nuevas notas
   */
  async checkNewNotes(userId) {
    try {
      const response = await notesAPI.getAll();
      const notes = response.data || [];
      
      const newNotes = notes.filter(note => {
        const isSharedWithMe = note.sharedWith?.some(u => u._id === userId);
        const isNotMine = note.createdBy?._id !== userId;
        
        // Usar updatedAt O createdAt (lo que sea más reciente)
        const noteDate = note.updatedAt || note.createdAt;
        const isNew = new Date(noteDate) > new Date(this.lastCheck.notes);
        
        return isSharedWithMe && isNotMine && isNew;
      });

      if (newNotes.length > 0) {
        console.log(`📝 ${newNotes.length} nueva(s) nota(s) compartida(s)`);
        
        for (const note of newNotes) {
          await notificationService.sendLocalNotification(
            '📝 Nueva nota compartida',
            `${note.createdBy?.username || 'Alguien'} compartió: "${note.subject}"`,
            { type: 'note', id: note._id }
          );
        }
        
        this.lastCheck.notes = new Date().toISOString();
      }
    } catch (error) {
      console.error('Error verificando notas:', error);
    }
  }

}

export default new PollingService();
