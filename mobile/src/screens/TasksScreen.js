import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tasksAPI } from '../config/api';

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [lastTap, setLastTap] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    status: 'pendiente',
    dueDate: '',
    checklist: []
  });
  const [newCheckItem, setNewCheckItem] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getAll();
      setTasks(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las tareas');
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
      if (editingTask) {
        await tasksAPI.update(editingTask._id, formData);
        Alert.alert('Éxito', 'Tarea actualizada correctamente');
      } else {
        await tasksAPI.create(formData);
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
    setFormData({ title: '', description: '', priority: 'media', status: 'pendiente', dueDate: '', checklist: [] });
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate || '',
      checklist: task.checklist || []
    });
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
      <FlatList
        data={tasks}
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
});
