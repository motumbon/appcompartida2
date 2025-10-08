import cron from 'node-cron';
import Activity from '../models/Activity.js';
import Task from '../models/Task.js';
import Note from '../models/Note.js';
import User from '../models/User.js';
import pushNotificationService from './pushNotificationService.js';

class NotificationMonitor {
  constructor() {
    // Inicializar con 10 minutos atrás para capturar cambios recientes al arrancar
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    this.lastCheck = {
      activities: tenMinutesAgo,
      tasks: tenMinutesAgo,
      notes: tenMinutesAgo
    };
    this.isRunning = false;
  }

  /**
   * Iniciar el monitoreo periódico
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ El monitoreo de notificaciones ya está activo');
      return;
    }

    console.log('🔔 Iniciando monitoreo de notificaciones push...');
    
    // Ejecutar cada 2 minutos
    this.cronJob = cron.schedule('*/2 * * * *', async () => {
      await this.checkForUpdates();
    });

    this.isRunning = true;
    console.log('✅ Monitoreo de notificaciones activado (cada 2 minutos)');
  }

  /**
   * Detener el monitoreo
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('🛑 Monitoreo de notificaciones detenido');
    }
  }

  /**
   * Verificar actualizaciones y enviar notificaciones
   */
  async checkForUpdates() {
    try {
      const now = new Date().toLocaleTimeString('es-CL', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      console.log(`🔍 [${now}] Verificando actualizaciones...`);
      
      await Promise.all([
        this.checkNewActivities(),
        this.checkNewTasks(),
        this.checkNewNotes()
      ]);

      console.log(`✅ [${now}] Verificación completada`);
    } catch (error) {
      console.error('❌ Error en monitoreo:', error);
    }
  }

  /**
   * Verificar nuevas actividades compartidas
   * Usa updatedAt para detectar también actualizaciones de sharedWith
   */
  async checkNewActivities() {
    try {
      const newActivities = await Activity.find({
        updatedAt: { $gt: this.lastCheck.activities },
        $expr: { $gt: [{ $size: '$sharedWith' }, 0] }
      }).populate('createdBy', 'username').populate('sharedWith', '_id');

      for (const activity of newActivities) {
        if (activity.sharedWith && activity.sharedWith.length > 0) {
          const userIds = activity.sharedWith
            .filter(u => u._id.toString() !== activity.createdBy._id.toString())
            .map(u => u._id);

          if (userIds.length > 0) {
            console.log(`📅 [CRON] Actividad compartida detectada: "${activity.subject}" con ${userIds.length} usuarios`);
            await pushNotificationService.notifySharedActivity(activity, userIds);
          }
        }
      }

      if (newActivities.length > 0) {
        this.lastCheck.activities = new Date();
      }
    } catch (error) {
      console.error('Error verificando actividades:', error);
    }
  }

  /**
   * Verificar nuevas tareas compartidas
   * Usa updatedAt para detectar también actualizaciones de sharedWith
   */
  async checkNewTasks() {
    try {
      const newTasks = await Task.find({
        updatedAt: { $gt: this.lastCheck.tasks },
        $expr: { $gt: [{ $size: '$sharedWith' }, 0] }
      }).populate('createdBy', 'username').populate('sharedWith', '_id');

      for (const task of newTasks) {
        if (task.sharedWith && task.sharedWith.length > 0) {
          const userIds = task.sharedWith
            .filter(u => u._id.toString() !== task.createdBy._id.toString())
            .map(u => u._id);

          if (userIds.length > 0) {
            console.log(`✅ [CRON] Tarea compartida detectada: "${task.title}" con ${userIds.length} usuarios`);
            await pushNotificationService.notifySharedTask(task, userIds);
          }
        }
      }

      if (newTasks.length > 0) {
        this.lastCheck.tasks = new Date();
      }
    } catch (error) {
      console.error('Error verificando tareas:', error);
    }
  }

  /**
   * Verificar nuevas notas compartidas
   * Usa updatedAt para detectar también actualizaciones de sharedWith
   */
  async checkNewNotes() {
    try {
      const newNotes = await Note.find({
        updatedAt: { $gt: this.lastCheck.notes },
        $expr: { $gt: [{ $size: '$sharedWith' }, 0] }
      }).populate('createdBy', 'username').populate('sharedWith', '_id');

      for (const note of newNotes) {
        if (note.sharedWith && note.sharedWith.length > 0) {
          const userIds = note.sharedWith
            .filter(u => u._id.toString() !== note.createdBy._id.toString())
            .map(u => u._id);

          if (userIds.length > 0) {
            console.log(`📝 [CRON] Nota compartida detectada: "${note.subject}" con ${userIds.length} usuarios`);
            await pushNotificationService.notifySharedNote(note, userIds);
          }
        }
      }

      if (newNotes.length > 0) {
        this.lastCheck.notes = new Date();
      }
    } catch (error) {
      console.error('Error verificando notas:', error);
    }
  }

  /**
   * Forzar verificación manual
   */
  async forceCheck() {
    console.log('🔄 Verificación manual forzada');
    await this.checkForUpdates();
  }
}

export default new NotificationMonitor();
