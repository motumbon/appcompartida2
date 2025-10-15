import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { tasksAPI, contactsAPI, institutionsAPI, usersAPI } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { getTimeElapsed, getTimeElapsedColor, getTimeElapsedBgColor } from '../utils/timeCounter';

export default function TasksScreen({ route }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [lastTap, setLastTap] = useState(null);
  const [viewMode, setViewMode] = useState('pending'); // 'pending', 'completed', 'assigned'
  const [filterInstitution, setFilterInstitution] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [userInstitutions, setUserInstitutions] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    status: 'pendiente',
    dueDate: '',
    checklist: [],
    sharedWith: [],
    institution: null
  });
  const [newCheckItem, setNewCheckItem] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    loadTasks();
    loadContacts();
    loadInstitutions();
    loadUserInstitutions();
  }, []);

  // Manejar parámetros de navegación
  useEffect(() => {
    if (route?.params) {
      const { openModal, editTask } = route.params;
      
      if (openModal) {
        // Abrir modal para crear nueva tarea
        setModalVisible(true);
        // Limpiar parámetro
        route.params.openModal = undefined;
      }
      
      if (editTask) {
        // Abrir modal para editar tarea existente
        handleEdit(editTask);
        // Limpiar parámetro
        route.params.editTask = undefined;
      }
    }
  }, [route?.params]);

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getAll();
      setTasks(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las tareas');
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
      const response = await institutionsAPI.getAll();
      setInstitutions(response.data);
    } catch (error) {
      console.error('Error al cargar instituciones:', error);
    }
  };

  const loadUserInstitutions = async () => {
    try {
      const response = await usersAPI.getUserInstitutions();
      setUserInstitutions(response.data);
    } catch (error) {
      console.error('Error al cargar instituciones del usuario:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        sharedWith: selectedUsers
      };

      if (editingTask) {
        await tasksAPI.update(editingTask._id, dataToSend);
        Alert.alert('Éxito', 'Tarea actualizada correctamente');
      } else {
        await tasksAPI.create(dataToSend);
        Alert.alert('Éxito', 'Tarea creada correctamente');
      }
      handleCloseModal();
      loadTasks();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar la tarea');
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingTask(null);
    setNewCheckItem('');
    setSelectedUsers([]);
    setFormData({ title: '', description: '', priority: 'media', status: 'pendiente', dueDate: '', checklist: [], sharedWith: [], institution: null });
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate || '',
      checklist: task.checklist || [],
      sharedWith: task.sharedWith?.map(u => u._id) || [],
      institution: task.institution?._id || null
    });
    setSelectedUsers(task.sharedWith?.map(u => u._id) || []);
    setModalVisible(true);
  };

  const handleDoubleTap = (task) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      handleEdit(task);
    } else {
      setLastTap(now);
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const newStatus = task.status === 'completada' ? 'pendiente' : 'completada';
      await tasksAPI.update(task._id, { status: newStatus });
      loadTasks();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const handleToggleCheckItem = async (task, itemIndex) => {
    try {
      const updatedChecklist = [...task.checklist];
      updatedChecklist[itemIndex] = {
        ...updatedChecklist[itemIndex],
        completed: !updatedChecklist[itemIndex].completed
      };
      await tasksAPI.update(task._id, { checklist: updatedChecklist });
      loadTasks();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el checklist');
    }
  };

  const addChecklistItem = () => {
    if (newCheckItem.trim()) {
      setFormData({
        ...formData,
        checklist: [...formData.checklist, { text: newCheckItem.trim(), completed: false }]
      });
      setNewCheckItem('');
    }
  };

  const removeChecklistItem = (index) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((_, i) => i !== index)
    });
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Eliminar Tarea',
      '¿Estás seguro de eliminar esta tarea?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await tasksAPI.delete(id);
              handleCloseModal();
              loadTasks();
              Alert.alert('Éxito', 'Tarea eliminada');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          }
        }
      ]
    );
  };

  const getPriorityColor = (priority) => {
    const colors = {
      baja: '#10b981',
      media: '#f59e0b',
      alta: '#f97316',
      urgente: '#ef4444'
    };
    return colors[priority] || '#6b7280';
  };

  const getStatusColor = (status) => {
    const colors = {
      pendiente: '#f59e0b',
      en_progreso: '#3b82f6',
      completada: '#10b981',
      cancelada: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const isSharedWithMe = (task) => {
    if (!task || !task.createdBy || !user) return false;
    const creatorId = String(task.createdBy?._id || task.createdBy);
    const currentUserId = String(user?._id || user?.id);
    return creatorId !== currentUserId &&
      Array.isArray(task.sharedWith) && task.sharedWith.some(u => String(u._id || u) === currentUserId);
  };

  const getInstitutionsWithTasks = () => {
    const institutionIds = new Set();
    const institutionsMap = new Map();
    
    tasks.forEach(task => {
      if (task.institution) {
        const instId = task.institution._id || task.institution;
        const instName = task.institution.name || userInstitutions.find(i => i._id === instId)?.name;
        if (instId && instName) {
          institutionIds.add(instId);
          institutionsMap.set(instId, { _id: instId, name: instName });
        }
      }
    });
    
    return Array.from(institutionsMap.values());
  };

  const getUsersWithSharedTasks = () => {
    const userIds = new Set();
    const usersMap = new Map();
    const currentUserId = (user?._id || user?.id)?.toString();
    
    tasks.forEach(task => {
      const creatorId = (task.createdBy?._id || task.createdBy)?.toString();
      
      if (creatorId !== currentUserId && task.sharedWith?.some(u => (u?._id || u)?.toString() === currentUserId)) {
        const creator = task.createdBy;
        const creatorName = creator.username || creator.name;
        if (creatorId && creatorName) {
          userIds.add(creatorId);
          usersMap.set(creatorId, { _id: creatorId, name: creatorName });
        }
      }
      
      if (creatorId === currentUserId && task.sharedWith && task.sharedWith.length > 0) {
        task.sharedWith.forEach(sharedUser => {
          const sharedUserId = (sharedUser?._id || sharedUser)?.toString();
          const sharedUserName = sharedUser.username || sharedUser.name;
          if (sharedUserId && sharedUserId !== currentUserId && sharedUserName) {
            userIds.add(sharedUserId);
            usersMap.set(sharedUserId, { _id: sharedUserId, name: sharedUserName });
          }
        });
      }
    });
    
    return Array.from(usersMap.values());
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    // Filtro por modo de vista
    if (viewMode === 'pending') {
      filtered = filtered.filter(t => t.status === 'pendiente');
    } else if (viewMode === 'completed') {
      filtered = filtered.filter(t => t.status === 'completada');
    } else if (viewMode === 'assigned') {
      filtered = filtered.filter(t => isSharedWithMe(t));
    }

    // Filtro por institución
    if (filterInstitution !== 'all') {
      filtered = filtered.filter(t => {
        const taskInstitutionId = t.institution?._id || t.institution;
        return taskInstitutionId === filterInstitution;
      });
    }

    // Filtro por usuario compartido
    if (filterUser !== 'all') {
      filtered = filtered.filter(t => {
        const creatorId = (t.createdBy?._id || t.createdBy)?.toString();
        const currentUserId = (user?._id || user?.id)?.toString();
        
        const createdByUserAndSharedWithMe = creatorId === filterUser && 
          t.sharedWith?.some(u => (u?._id || u)?.toString() === currentUserId);
        
        const createdByMeAndSharedWithUser = creatorId === currentUserId && 
          t.sharedWith?.some(u => (u?._id || u)?.toString() === filterUser);
        
        return createdByUserAndSharedWithMe || createdByMeAndSharedWithUser;
      });
    }

    return filtered;
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredTasks = getFilteredTasks();

  const renderTask = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleDoubleTap(item)}
      activeOpacity={0.7}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.badgeText}>{item.priority}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>
      </View>
      
      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
      )}

      {/* Checklist Preview */}
      {item.checklist && item.checklist.length > 0 && (
        <View style={styles.checklistPreview}>
          <View style={styles.checklistHeader}>
            <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
            <Text style={styles.checklistCount}>
              {item.checklist.filter(c => c.completed).length}/{item.checklist.length} completados
            </Text>
          </View>
          {item.checklist.slice(0, 3).map((checkItem, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.checkItemPreview}
              onPress={() => handleToggleCheckItem(item, idx)}
            >
              <View style={styles.checkbox}>
                {checkItem.completed && <Ionicons name="checkmark" size={14} color="#3b82f6" />}
              </View>
              <Text style={[styles.checkItemText, checkItem.completed && styles.checkItemTextCompleted]}>
                {checkItem.text}
              </Text>
            </TouchableOpacity>
          ))}
          {item.checklist.length > 3 && (
            <Text style={styles.moreItems}>+{item.checklist.length - 3} más</Text>
          )}
        </View>
      )}

      {/* Contador de tiempo */}
      {item.createdAt && (() => {
        const { days, hours } = getTimeElapsed(item.createdAt);
        const bgColor = getTimeElapsedBgColor(days);
        const textColor = getTimeElapsedColor(days);
        return (
          <View style={[styles.timeCounter, { backgroundColor: bgColor }]}>
            <Ionicons name="time-outline" size={14} color={textColor} />
            <Text style={[styles.timeCounterText, { color: textColor }]}>
              {days}d {hours}h
            </Text>
          </View>
        );
      })()}

      <View style={styles.cardFooter}>
        {item.dueDate && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color="#6b7280" />
            <Text style={styles.infoText}>
              Vence: {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          </View>
        )}
        {item.institution && (
          <View style={styles.infoRow}>
            <Ionicons name="business" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{item.institution.name}</Text>
          </View>
        )}
      </View>

      {/* Toggle Complete Button */}
      <TouchableOpacity
        style={[styles.completeButton, item.status === 'completada' && styles.completeButtonActive]}
        onPress={() => handleToggleComplete(item)}
      >
        <Ionicons 
          name={item.status === 'completada' ? 'checkmark-circle' : 'ellipse-outline'} 
          size={20} 
          color={item.status === 'completada' ? '#fff' : '#3b82f6'} 
        />
        <Text style={[styles.completeButtonText, item.status === 'completada' && styles.completeButtonTextActive]}>
          {item.status === 'completada' ? 'Completada' : 'Marcar como completada'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterButton, viewMode === 'pending' && styles.filterButtonActive]}
            onPress={() => setViewMode('pending')}
          >
            <Text style={[styles.filterText, viewMode === 'pending' && styles.filterTextActive]}>
              Pendientes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, viewMode === 'completed' && styles.filterButtonActive]}
            onPress={() => setViewMode('completed')}
          >
            <Text style={[styles.filterText, viewMode === 'completed' && styles.filterTextActive]}>
              Completadas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, viewMode === 'assigned' && styles.filterButtonActive]}
            onPress={() => setViewMode('assigned')}
          >
            <Text style={[styles.filterText, viewMode === 'assigned' && styles.filterTextActive]}>
              Asignadas a mí
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Filtros Adicionales */}
      <View style={styles.additionalFiltersContainer}>
        <Text style={styles.filtersTitle}>Filtros</Text>
        
        {/* Filtro por Institución */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Institución:</Text>
          <Picker
            selectedValue={filterInstitution}
            onValueChange={(value) => setFilterInstitution(value)}
            style={styles.picker}
          >
            <Picker.Item label="🏢 Todas las instituciones" value="all" />
            {getInstitutionsWithTasks().map((inst) => (
              <Picker.Item key={inst._id} label={inst.name} value={inst._id} />
            ))}
          </Picker>
        </View>

        {/* Filtro por Usuario */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Usuario Compartido:</Text>
          <Picker
            selectedValue={filterUser}
            onValueChange={(value) => setFilterUser(value)}
            style={styles.picker}
          >
            <Picker.Item label="👥 Todos los usuarios" value="all" />
            {getUsersWithSharedTasks().map((u) => (
              <Picker.Item key={u._id} label={u.name} value={u._id} />
            ))}
          </Picker>
        </View>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No hay tareas</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Título *</Text>
              <TextInput style={styles.input} value={formData.title} onChangeText={(text) => setFormData({ ...formData, title: text })} placeholder="Título de la tarea" />
              <Text style={styles.label}>Descripción</Text>
              <TextInput style={[styles.input, styles.textArea]} value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} placeholder="Descripción" multiline numberOfLines={4} />
              <Text style={styles.label}>Checklist</Text>
              <View style={styles.checklistContainer}>
                <View style={styles.checklistInputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={newCheckItem}
                    onChangeText={setNewCheckItem}
                    placeholder="Agregar ítem..."
                    onSubmitEditing={addChecklistItem}
                  />
                  <TouchableOpacity 
                    style={styles.addCheckButton}
                    onPress={addChecklistItem}
                  >
                    <Ionicons name="add" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                {formData.checklist.map((item, index) => (
                  <View key={index} style={styles.checklistItem}>
                    <TouchableOpacity 
                      style={styles.checkbox}
                      onPress={() => {
                        const updated = [...formData.checklist];
                        updated[index].completed = !updated[index].completed;
                        setFormData({ ...formData, checklist: updated });
                      }}
                    >
                      {item.completed && <Ionicons name="checkmark" size={18} color="#3b82f6" />}
                    </TouchableOpacity>
                    <Text style={[styles.checklistText, item.completed && styles.checklistTextCompleted]}>
                      {item.text}
                    </Text>
                    <TouchableOpacity onPress={() => removeChecklistItem(index)}>
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <Text style={styles.label}>Institución</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.institutionScroll}>
                <TouchableOpacity
                  style={[styles.institutionChip, !formData.institution && styles.institutionChipSelected]}
                  onPress={() => setFormData({ ...formData, institution: null })}
                >
                  <Text style={[styles.institutionChipText, !formData.institution && styles.institutionChipTextSelected]}>
                    Sin institución
                  </Text>
                </TouchableOpacity>
                {institutions.map((inst) => (
                  <TouchableOpacity
                    key={inst._id}
                    style={[styles.institutionChip, formData.institution === inst._id && styles.institutionChipSelected]}
                    onPress={() => setFormData({ ...formData, institution: inst._id })}
                  >
                    <Ionicons 
                      name="business" 
                      size={14} 
                      color={formData.institution === inst._id ? "#fff" : "#6b7280"} 
                    />
                    <Text style={[styles.institutionChipText, formData.institution === inst._id && styles.institutionChipTextSelected]}>
                      {inst.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Compartir con</Text>
              <ScrollView style={styles.sharedWithContainer}>
                {contacts.length === 0 ? (
                  <Text style={styles.noContactsText}>No hay contactos registrados</Text>
                ) : (
                  contacts.map((contact) => (
                    <TouchableOpacity
                      key={contact.userId}
                      style={styles.contactItem}
                      onPress={() => toggleUserSelection(contact.userId)}
                    >
                      <View style={styles.checkbox}>
                        {selectedUsers.includes(contact.userId) && (
                          <Ionicons name="checkmark" size={18} color="#3b82f6" />
                        )}
                      </View>
                      <Text style={styles.userName}>{contact.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              <Text style={styles.label}>Prioridad</Text>
              <View style={styles.priorityButtons}>
                {['baja', 'media', 'alta', 'urgente'].map((priority) => (
                  <TouchableOpacity key={priority} style={[styles.priorityButton, formData.priority === priority && styles.priorityButtonActive]} onPress={() => setFormData({ ...formData, priority })}>
                    <Text style={[styles.priorityButtonText, formData.priority === priority && styles.priorityButtonTextActive]}>{priority}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={handleCloseModal}>
                  <Text style={styles.buttonCancelText}>Cancelar</Text>
                </TouchableOpacity>
                {editingTask && (
                  <TouchableOpacity style={[styles.button, styles.buttonDelete]} onPress={() => handleDelete(editingTask._id)}>
                    <Text style={styles.buttonDeleteText}>Eliminar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.button, styles.buttonSubmit]} onPress={handleSubmit}>
                  <Text style={styles.buttonSubmitText}>{editingTask ? 'Actualizar' : 'Crear'}</Text>
                </TouchableOpacity>
              </View>
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
    flex: 1,
    marginRight: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
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
  fab: { position: 'absolute', right: 16, bottom: 16, width: 56, height: 56, borderRadius: 28, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  modalForm: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  priorityButtons: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  priorityButton: { flex: 1, minWidth: '45%', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  priorityButtonActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  priorityButtonText: { fontSize: 12, color: '#6b7280', textTransform: 'capitalize' },
  priorityButtonTextActive: { color: '#fff', fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  button: { flex: 1, padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonCancel: { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' },
  buttonCancelText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  buttonSubmit: { backgroundColor: '#3b82f6' },
  buttonSubmitText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  buttonDelete: { backgroundColor: '#ef4444' },
  buttonDeleteText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  checklistPreview: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  checklistCount: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },
  checkItemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkItemText: {
    flex: 1,
    fontSize: 13,
    color: '#1f2937',
  },
  checkItemTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  moreItems: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
    gap: 8,
  },
  completeButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  completeButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  completeButtonTextActive: {
    color: '#fff',
  },
  checklistContainer: {
    marginBottom: 16,
  },
  checklistInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addCheckButton: {
    backgroundColor: '#3b82f6',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  checklistText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  sharedWithContainer: {
    maxHeight: 150,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  institutionScroll: {
    marginBottom: 16,
  },
  institutionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
  },
  institutionChipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  institutionChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  institutionChipTextSelected: {
    color: '#fff',
  },
  timeCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  timeCounterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  additionalFiltersContainer: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 6,
  },
  picker: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
});
