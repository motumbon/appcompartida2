import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Calendar } from 'react-native-calendars';
import { activitiesAPI, contactsAPI, usersAPI } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

export default function ActivitiesScreen() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [lastTap, setLastTap] = useState(null);
  
  // Filtros
  const [viewMode, setViewMode] = useState('list'); // 'list', 'pending', 'completed', 'calendar'
  const [filterUser, setFilterUser] = useState('all'); // 'all', 'mine', or userId
  const [filterInstitution, setFilterInstitution] = useState('all'); // 'all' or institutionId
  
  const [formData, setFormData] = useState({
    subject: '',
    comment: '',
    status: 'pendiente',
    institution: '',
    sharedWith: [],
    scheduledDate: '',
    scheduledTime: ''
  });
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    loadActivities();
    loadContacts();
    loadInstitutions();
  }, []);

  const loadActivities = async () => {
    try {
      const response = await activitiesAPI.getAll();
      setActivities(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las actividades');
    }
  };

  const loadContacts = async () => {
    try {
      const response = await contactsAPI.getAll();
      setContacts(response.data.filter(c => c.isRegisteredUser && c.userId));
    } catch (error) {
      console.error('Error al cargar contactos:', error);
    }
  };

  const loadInstitutions = async () => {
    try {
      const response = await usersAPI.getUserInstitutions();
      setInstitutions(response.data);
    } catch (error) {
      console.error('Error al cargar instituciones:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!formData.subject) {
      Alert.alert('Error', 'El asunto es requerido');
      return;
    }

    try {
      const dataToSend = {
        subject: formData.subject,
        comment: formData.comment,
        status: formData.status,
        institution: formData.institution || undefined,
        sharedWith: selectedUsers
      };

      // Agregar fecha y hora si están definidas
      if (formData.scheduledDate && formData.scheduledTime) {
        dataToSend.scheduledDate = `${formData.scheduledDate}T${formData.scheduledTime}`;
      }

      if (editingActivity) {
        await activitiesAPI.update(editingActivity._id, dataToSend);
        Alert.alert('Éxito', 'Actividad actualizada correctamente');
      } else {
        await activitiesAPI.create(dataToSend);
        Alert.alert('Éxito', 'Actividad creada correctamente');
      }
      
      handleCloseModal();
      loadActivities();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar la actividad');
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingActivity(null);
    setFormData({ subject: '', comment: '', status: 'pendiente', institution: '', sharedWith: [], scheduledDate: '', scheduledTime: '' });
    setSelectedUsers([]);
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({
      subject: activity.subject,
      comment: activity.comment || '',
      status: activity.status,
      institution: activity.institution?._id || '',
      sharedWith: activity.sharedWith?.map(u => u._id) || [],
      scheduledDate: activity.scheduledDate ? activity.scheduledDate.split('T')[0] : '',
      scheduledTime: activity.scheduledDate ? activity.scheduledDate.split('T')[1]?.substring(0, 5) : ''
    });
    setSelectedUsers(activity.sharedWith?.map(u => u._id) || []);
    setModalVisible(true);
  };

  const handleDoubleTap = (activity) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      handleEdit(activity);
    } else {
      setLastTap(now);
    }
  };

  const handleStatusChange = async (activity, newStatus) => {
    try {
      await activitiesAPI.update(activity._id, { status: newStatus });
      loadActivities();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pendiente: '#f59e0b',
      completada: '#10b981'
    };
    return colors[status] || '#6b7280';
  };

  const getFilteredActivities = () => {
    let filtered = activities;

    // Aplicar filtro de vista
    if (viewMode === 'completed') {
      filtered = filtered.filter(a => a.status === 'completada');
    } else if (viewMode === 'pending') {
      filtered = filtered.filter(a => a.status === 'pendiente');
    } else if (viewMode === 'list') {
      // Lista muestra todas menos completadas
      filtered = filtered.filter(a => a.status !== 'completada');
    }

    // Aplicar filtro de usuario
    if (filterUser === 'mine') {
      filtered = filtered.filter(a => {
        if (!a || !a.createdBy || !user) return false;
        const activityCreatorId = String(a.createdBy?._id || a.createdBy);
        const currentUserId = String(user?._id || user?.id);
        const isMyActivity = activityCreatorId === currentUserId;
        const isNotShared = !a.sharedWith || a.sharedWith.length === 0;
        return isMyActivity && isNotShared;
      });
    } else if (filterUser !== 'all') {
      filtered = filtered.filter(a =>
        a && Array.isArray(a.sharedWith) && a.sharedWith.some(u => u && u._id === filterUser)
      );
    }

    // Aplicar filtro de institución
    if (filterInstitution !== 'all') {
      filtered = filtered.filter(a =>
        a.institution && a.institution._id === filterInstitution
      );
    }

    return filtered;
  };

  const isSharedWithMe = (activity) => {
    if (!activity || !activity.createdBy || !user) return false;
    const creatorId = String(activity.createdBy?._id || activity.createdBy);
    const currentUserId = String(user?._id || user?.id);
    return creatorId !== currentUserId &&
      Array.isArray(activity.sharedWith) && activity.sharedWith.some(u => String(u._id || u) === currentUserId);
  };

  const filteredActivities = getFilteredActivities();

  const getMarkedDates = () => {
    const marked = {};
    filteredActivities.forEach(activity => {
      if (activity.scheduledDate) {
        const date = activity.scheduledDate.split('T')[0];
        if (!marked[date]) {
          marked[date] = {
            marked: true,
            dots: []
          };
        }
        marked[date].dots.push({
          color: activity.status === 'completada' ? '#10b981' : '#f59e0b',
          selectedDotColor: activity.status === 'completada' ? '#10b981' : '#f59e0b'
        });
      }
    });
    return marked;
  };

  const handleDayPress = (day) => {
    setFormData({ ...formData, scheduledDate: day.dateString, scheduledTime: '09:00' });
    setModalVisible(true);
  };

  const renderActivity = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleDoubleTap(item)}
      activeOpacity={0.7}
      style={[
        styles.card,
        isSharedWithMe(item) && styles.cardShared
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.subject}</Text>
          {isSharedWithMe(item) && (
            <View style={styles.sharedBadge}>
              <Ionicons name="people" size={12} color="#fff" />
              <Text style={styles.sharedBadgeText}>Compartida conmigo</Text>
            </View>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>
            {item.status === 'pendiente' ? 'Pendiente' : 'Completada'}
          </Text>
        </View>
      </View>
      
      {item.comment && (
        <Text style={styles.comment}>{item.comment}</Text>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={14} color="#6b7280" />
          <Text style={styles.infoText}>{item.createdBy?.username || 'Desconocido'}</Text>
        </View>
        {item.institution && (
          <View style={styles.infoRow}>
            <Ionicons name="business" size={14} color="#6b7280" />
            <Text style={styles.infoText}>{item.institution.name}</Text>
          </View>
        )}
        {item.sharedWith && item.sharedWith.length > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={14} color="#6b7280" />
            <Text style={styles.infoText}>{item.sharedWith.length} usuario(s)</Text>
          </View>
        )}
      </View>

      {/* Cambiar estado */}
      <View style={styles.statusChangeContainer}>
        <TouchableOpacity
          style={[styles.statusChangeButton, item.status === 'pendiente' && styles.statusButtonActive]}
          onPress={() => handleStatusChange(item, 'pendiente')}
        >
          <Text style={[styles.statusChangeText, item.status === 'pendiente' && styles.statusChangeTextActive]}>
            Pendiente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusChangeButton, item.status === 'completada' && styles.statusButtonActive]}
          onPress={() => handleStatusChange(item, 'completada')}
        >
          <Text style={[styles.statusChangeText, item.status === 'completada' && styles.statusChangeTextActive]}>
            Completada
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Filtros de Vista */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.viewModeScroll}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
              Lista
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'pending' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('pending')}
          >
            <Text style={[styles.viewModeText, viewMode === 'pending' && styles.viewModeTextActive]}>
              Pendientes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'completed' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('completed')}
          >
            <Text style={[styles.viewModeText, viewMode === 'completed' && styles.viewModeTextActive]}>
              Completadas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'calendar' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('calendar')}
          >
            <Text style={[styles.viewModeText, viewMode === 'calendar' && styles.viewModeTextActive]}>
              Calendario
            </Text>
          </TouchableOpacity>
        </ScrollView>
        
        <TouchableOpacity
          style={styles.filterIconButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={20} color="#3b82f6" />
          {(filterUser !== 'all' || filterInstitution !== 'all') && (
            <View style={styles.filterBadge} />
          )}
        </TouchableOpacity>
      </View>

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <ScrollView style={styles.calendarContainer}>
          <Calendar
            markedDates={getMarkedDates()}
            onDayPress={handleDayPress}
            markingType={'multi-dot'}
            theme={{
              todayTextColor: '#3b82f6',
              selectedDayBackgroundColor: '#3b82f6',
              selectedDayTextColor: '#ffffff',
              arrowColor: '#3b82f6',
              monthTextColor: '#1f2937',
              textMonthFontSize: 18,
              textMonthFontWeight: 'bold',
            }}
          />
          
          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>Pendiente</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>Completada</Text>
            </View>
          </View>

          <View style={styles.calendarActivitiesList}>
            <Text style={styles.calendarListTitle}>Actividades programadas</Text>
            {filteredActivities
              .filter(a => a.scheduledDate)
              .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
              .map((activity) => (
                <TouchableOpacity
                  key={activity._id}
                  onPress={() => handleEdit(activity)}
                  style={[styles.calendarActivityCard, isSharedWithMe(activity) && styles.cardShared]}
                >
                  <View style={styles.calendarActivityHeader}>
                    <Text style={styles.calendarActivityDate}>
                      {new Date(activity.scheduledDate).toLocaleDateString('es', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(activity.status) }]}>
                      <Text style={styles.badgeText}>
                        {activity.status === 'pendiente' ? 'Pendiente' : 'Completada'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.calendarActivityTitle}>{activity.subject}</Text>
                  {activity.comment && (
                    <Text style={styles.calendarActivityComment} numberOfLines={1}>
                      {activity.comment}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            {filteredActivities.filter(a => a.scheduledDate).length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No hay actividades programadas</Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredActivities}
          renderItem={renderActivity}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>
                {viewMode === 'pending' && 'No hay actividades pendientes'}
                {viewMode === 'completed' && 'No hay actividades completadas'}
                {viewMode === 'list' && 'No hay actividades'}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Asunto *</Text>
              <TextInput
                style={styles.input}
                value={formData.subject}
                onChangeText={(text) => setFormData({ ...formData, subject: text })}
                placeholder="Título de la actividad"
              />

              <Text style={styles.label}>Comentario</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.comment}
                onChangeText={(text) => setFormData({ ...formData, comment: text })}
                placeholder="Descripción de la actividad"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Fecha programada</Text>
              <TextInput
                style={styles.input}
                value={formData.scheduledDate}
                onChangeText={(text) => setFormData({ ...formData, scheduledDate: text })}
                placeholder="YYYY-MM-DD"
              />

              <Text style={styles.label}>Hora programada</Text>
              <TextInput
                style={styles.input}
                value={formData.scheduledTime}
                onChangeText={(text) => setFormData({ ...formData, scheduledTime: text })}
                placeholder="HH:MM (ej: 14:30)"
              />

              <Text style={styles.label}>Institución</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.institution}
                  onValueChange={(value) => setFormData({ ...formData, institution: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Ninguna" value="" />
                  {institutions.map((inst) => (
                    <Picker.Item key={inst._id} label={inst.name} value={inst._id} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Compartir con usuarios</Text>
              <ScrollView style={styles.usersList}>
                {contacts.map((contact) => (
                  <TouchableOpacity
                    key={contact.userId._id}
                    style={styles.userItem}
                    onPress={() => toggleUserSelection(contact.userId._id)}
                  >
                    <View style={styles.checkbox}>
                      {selectedUsers.includes(contact.userId._id) && (
                        <Ionicons name="checkmark" size={18} color="#3b82f6" />
                      )}
                    </View>
                    <Text style={styles.userName}>{contact.name}</Text>
                  </TouchableOpacity>
                ))}
                {contacts.length === 0 && (
                  <Text style={styles.noContactsText}>No hay contactos disponibles</Text>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSubmit]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.buttonSubmitText}>Crear</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Filtros */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Filtrar por usuario</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filterUser}
                  onValueChange={(value) => setFilterUser(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="👥 Todos los usuarios" value="all" />
                  <Picker.Item label="👤 Mis actividades" value="mine" />
                  {contacts.map((contact) => (
                    <Picker.Item
                      key={contact.userId._id}
                      label={`🤝 ${contact.name}`}
                      value={contact.userId._id}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Filtrar por institución</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filterInstitution}
                  onValueChange={(value) => setFilterInstitution(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="🏢 Todas las instituciones" value="all" />
                  {institutions.map((inst) => (
                    <Picker.Item key={inst._id} label={inst.name} value={inst._id} />
                  ))}
                </Picker>
              </View>

              <TouchableOpacity
                style={[styles.button, styles.buttonSubmit, { marginTop: 20 }]}
                onPress={() => {
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.buttonSubmitText}>Aplicar Filtros</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonCancel, { marginTop: 10 }]}
                onPress={() => {
                  setFilterUser('all');
                  setFilterInstitution('all');
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.buttonCancelText}>Limpiar Filtros</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  viewModeScroll: {
    flex: 1,
  },
  viewModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  viewModeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  viewModeText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  viewModeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  filterIconButton: {
    padding: 8,
    marginLeft: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardShared: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  sharedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  comment: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  statusChangeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  statusChangeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  statusChangeText: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '600',
  },
  statusChangeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalForm: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  usersList: {
    maxHeight: 200,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3b82f6',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 15,
    color: '#1f2937',
  },
  noContactsText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  buttonSubmit: {
    backgroundColor: '#3b82f6',
  },
  buttonSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: '#6b7280',
  },
  calendarActivitiesList: {
    padding: 16,
  },
  calendarListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  calendarActivityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  calendarActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarActivityDate: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  calendarActivityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  calendarActivityComment: {
    fontSize: 14,
    color: '#6b7280',
  },
});
