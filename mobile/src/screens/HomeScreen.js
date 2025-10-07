import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../contexts/AuthContext';
import { activitiesAPI, tasksAPI, complaintsAPI, contractsAPI, stockAPI } from '../config/api';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [stats, setStats] = useState({ activities: 0, tasks: 0, complaints: 0, contracts: 0 });
  const [notifications, setNotifications] = useState([]);
  const [dismissedNotifications, setDismissedNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [allActivities, setAllActivities] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [todayActivities, setTodayActivities] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);

  useEffect(() => {
    loadDismissedNotifications();
    loadStats();
    loadNotifications();
  }, []);

  const loadDismissedNotifications = async () => {
    try {
      const dismissed = await SecureStore.getItemAsync('dismissedNotifications');
      if (dismissed) {
        setDismissedNotifications(JSON.parse(dismissed));
      }
    } catch (error) {
      console.error('Error loading dismissed notifications:', error);
    }
  };

  const dismissNotification = async (notifId) => {
    const newDismissed = [...dismissedNotifications, notifId];
    setDismissedNotifications(newDismissed);
    await SecureStore.setItemAsync('dismissedNotifications', JSON.stringify(newDismissed));
    setNotifications(notifications.filter(n => n.id !== notifId));
  };

  const loadStats = async () => {
    try {
      const [activitiesRes, tasksRes, complaintsRes, contractsRes] = await Promise.all([
        activitiesAPI.getAll(),
        tasksAPI.getAll(),
        complaintsAPI.getAll(),
        contractsAPI.getAll()
      ]);

      const activities = activitiesRes.data;
      const tasks = tasksRes.data;
      
      setAllActivities(activities);
      setAllTasks(tasks);

      // Filtrar actividades de hoy
      const today = new Date().toISOString().split('T')[0];
      const todayActs = activities.filter(a => 
        a.scheduledDate && a.scheduledDate.split('T')[0] === today
      );
      setTodayActivities(todayActs);

      // Filtrar tareas pendientes (máximo 5)
      const pending = tasks.filter(t => t.status !== 'completada').slice(0, 5);
      setPendingTasks(pending);

      setStats({
        activities: activities.length,
        tasks: tasks.filter(t => t.status !== 'completada').length,
        complaints: complaintsRes.data.filter(c => c.status !== 'cerrado').length,
        contracts: contractsRes.data.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const notifs = [];
      
      // Actividades compartidas conmigo
      const activitiesRes = await activitiesAPI.getAll();
      const sharedActivities = activitiesRes.data.filter(activity => 
        activity.sharedWith?.some(u => u._id === user?._id || u === user?._id) &&
        activity.createdBy?._id !== user?._id
      );
      sharedActivities.slice(0, 3).forEach(activity => {
        notifs.push({
          id: `activity-${activity._id}`,
          type: 'activity',
          icon: 'calendar',
          color: '#10b981',
          title: 'Actividad compartida',
          message: `${activity.createdBy?.username || 'Alguien'} compartió: "${activity.subject}"`,
          time: activity.createdAt
        });
      });

      // Tareas compartidas conmigo
      const tasksRes = await tasksAPI.getAll();
      const sharedTasks = tasksRes.data.filter(task => 
        task.sharedWith?.some(u => u._id === user?._id || u === user?._id) &&
        task.createdBy?._id !== user?._id
      );
      sharedTasks.slice(0, 3).forEach(task => {
        notifs.push({
          id: `task-${task._id}`,
          type: 'task',
          icon: 'checkmark-circle',
          color: '#8b5cf6',
          title: 'Tarea compartida',
          message: `${task.createdBy?.username || 'Alguien'} compartió: "${task.title}"`,
          time: task.createdAt
        });
      });

      // Reclamos compartidos conmigo
      const complaintsRes = await complaintsAPI.getAll();
      const sharedComplaints = complaintsRes.data.filter(complaint => 
        complaint.sharedWith?.some(u => u._id === user?._id || u === user?._id) &&
        complaint.createdBy?._id !== user?._id
      );
      sharedComplaints.slice(0, 2).forEach(complaint => {
        notifs.push({
          id: `complaint-${complaint._id}`,
          type: 'complaint',
          icon: 'alert-circle',
          color: '#f59e0b',
          title: 'Reclamo compartido',
          message: `${complaint.createdBy?.username || 'Alguien'} compartió: "${complaint.title}"`,
          time: complaint.createdAt
        });
      });

      // Contratos nuevos (últimos 7 días)
      const contractsRes = await contractsAPI.getAll();
      if (contractsRes.data.uploadedAt) {
        const uploadDate = new Date(contractsRes.data.uploadedAt);
        const daysSinceUpload = Math.floor((new Date() - uploadDate) / (1000 * 60 * 60 * 24));
        if (daysSinceUpload <= 7) {
          notifs.push({
            id: 'contracts-new',
            type: 'contracts',
            icon: 'document-text',
            color: '#6366f1',
            title: 'Contratos actualizados',
            message: `${contractsRes.data.uploadedBy?.username || 'Administrador'} cargó nuevos contratos`,
            time: contractsRes.data.uploadedAt
          });
        }
      }

      // Stock actualizado
      try {
        const stockRes = await stockAPI.getAll();
        if (stockRes.data.uploadedAt) {
          const uploadDate = new Date(stockRes.data.uploadedAt);
          const daysSinceUpload = Math.floor((new Date() - uploadDate) / (1000 * 60 * 60 * 24));
          if (daysSinceUpload <= 7) {
            notifs.push({
              id: 'stock-new',
              type: 'stock',
              icon: 'cube',
              color: '#3b82f6',
              title: 'Stock actualizado',
              message: `${stockRes.data.uploadedBy?.username || 'Administrador'} actualizó el inventario`,
              time: stockRes.data.uploadedAt
            });
          }
        }
      } catch (error) {
        console.log('No hay stock disponible');
      }

      // Ordenar por fecha más reciente y filtrar desestimadas
      notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
      const filtered = notifs.filter(n => !dismissedNotifications.includes(n.id));
      setNotifications(filtered.slice(0, 5)); // Máximo 5 notificaciones
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    await loadNotifications();
    setRefreshing(false);
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return past.toLocaleDateString('es');
  };

  // Marcar fechas en el calendario
  const getMarkedDates = () => {
    const marked = {};
    
    // Marcar día seleccionado
    marked[selectedDate] = {
      selected: true,
      selectedColor: '#3b82f6'
    };
    
    // Marcar días con actividades
    allActivities.forEach(activity => {
      if (activity.scheduledDate) {
        const date = activity.scheduledDate.split('T')[0];
        if (date !== selectedDate) {
          marked[date] = {
            ...marked[date],
            marked: true,
            dotColor: '#10b981'
          };
        } else {
          marked[date] = {
            ...marked[date],
            selected: true,
            selectedColor: '#3b82f6',
            marked: true,
            dotColor: '#fff'
          };
        }
      }
    });
    
    return marked;
  };

  // Toggle tarea completada
  const toggleTaskStatus = async (task) => {
    try {
      const newStatus = task.status === 'completada' ? 'pendiente' : 'completada';
      await tasksAPI.update(task._id, { status: newStatus });
      
      // Actualizar localmente
      const updated = pendingTasks.map(t => 
        t._id === task._id ? { ...t, status: newStatus } : t
      );
      setPendingTasks(updated.filter(t => t.status !== 'completada'));
      
      // Recargar stats
      await loadStats();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la tarea');
    }
  };

  // Navegar a crear actividad
  const createNewActivity = () => {
    navigation.navigate('Activities', { openModal: true, date: selectedDate });
  };

  // Navegar a crear tarea
  const createNewTask = () => {
    navigation.navigate('Tasks', { openModal: true });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>¡Hola, {user?.username}!</Text>
        {user?.isAdmin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminText}>Administrador</Text>
          </View>
        )}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
          <Ionicons name="calendar" size={32} color="#fff" />
          <Text style={styles.statNumber}>{stats.activities}</Text>
          <Text style={styles.statLabel}>Actividades</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#8b5cf6' }]}>
          <Ionicons name="checkmark-circle" size={32} color="#fff" />
          <Text style={styles.statNumber}>{stats.tasks}</Text>
          <Text style={styles.statLabel}>Tareas Pendientes</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
          <Ionicons name="alert-circle" size={32} color="#fff" />
          <Text style={styles.statNumber}>{stats.complaints}</Text>
          <Text style={styles.statLabel}>Reclamos Activos</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#6366f1' }]}>
          <Ionicons name="document-text" size={32} color="#fff" />
          <Text style={styles.statNumber}>{stats.contracts}</Text>
          <Text style={styles.statLabel}>Contratos</Text>
        </View>
      </View>

      {/* Dashboard de Calendario */}
      <View style={styles.dashboardSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar" size={22} color="#1f2937" />
          <Text style={styles.sectionTitle2}>Calendario</Text>
        </View>
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={getMarkedDates()}
            theme={{
              todayTextColor: '#3b82f6',
              selectedDayBackgroundColor: '#3b82f6',
              selectedDayTextColor: '#ffffff',
              arrowColor: '#3b82f6',
              monthTextColor: '#1f2937',
              textMonthFontWeight: 'bold',
              textDayFontSize: 14,
              textMonthFontSize: 16,
            }}
          />
        </View>
        
        {/* Actividades del día seleccionado */}
        <View style={styles.activitiesOfDay}>
          <Text style={styles.dayTitle}>
            {selectedDate === new Date().toISOString().split('T')[0] 
              ? 'Actividades de Hoy' 
              : `Actividades del ${new Date(selectedDate).toLocaleDateString('es')}`}
          </Text>
          {allActivities.filter(a => a.scheduledDate?.split('T')[0] === selectedDate).length === 0 ? (
            <Text style={styles.emptyText}>No hay actividades programadas</Text>
          ) : (
            allActivities
              .filter(a => a.scheduledDate?.split('T')[0] === selectedDate)
              .map((activity) => (
                <TouchableOpacity 
                  key={activity._id} 
                  style={styles.activityItem}
                  onPress={() => navigation.navigate('Activities')}
                >
                  <View style={styles.activityTime}>
                    <Ionicons name="time" size={16} color="#6b7280" />
                    <Text style={styles.timeText}>
                      {activity.scheduledDate?.split('T')[1]?.substring(0, 5) || '--:--'}
                    </Text>
                  </View>
                  <Text style={styles.activityTitle}>{activity.subject}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                </TouchableOpacity>
              ))
          )}
          <TouchableOpacity style={styles.addButton} onPress={createNewActivity}>
            <Ionicons name="add-circle" size={20} color="#3b82f6" />
            <Text style={styles.addButtonText}>Nueva Actividad</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dashboard de Tareas */}
      <View style={styles.dashboardSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="checkmark-circle" size={22} color="#1f2937" />
          <Text style={styles.sectionTitle2}>Tareas Pendientes</Text>
        </View>
        {pendingTasks.length === 0 ? (
          <Text style={styles.emptyText}>No tienes tareas pendientes</Text>
        ) : (
          pendingTasks.map((task) => (
            <TouchableOpacity
              key={task._id}
              style={styles.taskItem}
              onPress={() => navigation.navigate('Tasks')}
            >
              <TouchableOpacity
                style={styles.checkbox}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleTaskStatus(task);
                }}
              >
                {task.status === 'completada' ? (
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                ) : (
                  <Ionicons name="ellipse-outline" size={24} color="#9ca3af" />
                )}
              </TouchableOpacity>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                {task.dueDate && (
                  <Text style={styles.taskDue}>
                    Vence: {new Date(task.dueDate).toLocaleDateString('es')}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity style={styles.addButton} onPress={createNewTask}>
          <Ionicons name="add-circle" size={20} color="#8b5cf6" />
          <Text style={[styles.addButtonText, { color: '#8b5cf6' }]}>Nueva Tarea</Text>
        </TouchableOpacity>
      </View>

      {/* Sección de Notificaciones */}
      {notifications.length > 0 && (
        <View style={styles.notificationsSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="notifications" size={20} color="#1f2937" /> Notificaciones
          </Text>
          {notifications.map((notif) => (
            <View key={notif.id} style={styles.notificationCard}>
              <View style={[styles.notifIcon, { backgroundColor: notif.color }]}>
                <Ionicons name={notif.icon} size={20} color="#fff" />
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>{notif.title}</Text>
                <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
                <Text style={styles.notifTime}>{getTimeAgo(notif.time)}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => dismissNotification(notif.id)}
                style={styles.dismissButton}
              >
                <Ionicons name="close" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Bienvenido a App Trabajo en Terreno</Text>
        <Text style={styles.infoText}>
          Gestiona tus actividades, tareas, reclamos y contratos desde tu dispositivo móvil.
        </Text>
        <Text style={styles.infoText}>
          Utiliza el menú inferior para navegar entre las diferentes secciones.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  adminBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
  },
  adminText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 10,
  },
  notificationsSection: {
    margin: 10,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    paddingLeft: 5,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  notifMessage: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  dashboardSection: {
    margin: 10,
    marginTop: 0,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle2: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  calendarContainer: {
    marginBottom: 15,
  },
  activitiesOfDay: {
    marginTop: 10,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 15,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  activityTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  timeText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  activityTitle: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  checkbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    marginBottom: 2,
  },
  taskDue: {
    fontSize: 12,
    color: '#6b7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 6,
  },
});
