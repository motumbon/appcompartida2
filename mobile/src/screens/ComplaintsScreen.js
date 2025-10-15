import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { complaintsAPI, contactsAPI, usersAPI } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { getTimeElapsed, getTimeElapsedColor, getTimeElapsedBgColor } from '../utils/timeCounter';

export default function ComplaintsScreen() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [lastTap, setLastTap] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'recibido', 'en_revision', 'resuelto'
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    clientName: '', 
    priority: 'media', 
    status: 'recibido',
    institution: '',
    sharedWith: []
  });
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    loadComplaints();
    loadContacts();
    loadInstitutions();
  }, []);

  const loadComplaints = async () => {
    try {
      const response = await complaintsAPI.getAll();
      setComplaints(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los reclamos');
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
    await loadComplaints();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.clientName) {
      Alert.alert('Error', 'Todos los campos son requeridos');
      return;
    }
    try {
      const dataToSend = {
        ...formData,
        sharedWith: selectedUsers
      };

      if (editingComplaint) {
        await complaintsAPI.update(editingComplaint._id, dataToSend);
        Alert.alert('Éxito', 'Reclamo actualizado correctamente');
      } else {
        await complaintsAPI.create(dataToSend);
        Alert.alert('Éxito', 'Reclamo creado correctamente');
      }
      handleCloseModal();
      loadComplaints();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar el reclamo');
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingComplaint(null);
    setSelectedUsers([]);
    setFormData({ title: '', description: '', clientName: '', priority: 'media', status: 'recibido', institution: '', sharedWith: [] });
  };

  const handleEdit = (complaint) => {
    setEditingComplaint(complaint);
    setFormData({
      title: complaint.title,
      description: complaint.description,
      clientName: complaint.clientName,
      priority: complaint.priority,
      status: complaint.status,
      institution: complaint.institution?._id || '',
      sharedWith: complaint.sharedWith?.map(u => u._id) || []
    });
    setSelectedUsers(complaint.sharedWith?.map(u => u._id) || []);
    setModalVisible(true);
  };

  const handleDoubleTap = (complaint) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      handleEdit(complaint);
    } else {
      setLastTap(now);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Eliminar Reclamo',
      '¿Estás seguro de eliminar este reclamo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await complaintsAPI.delete(id);
              handleCloseModal();
              loadComplaints();
              Alert.alert('Éxito', 'Reclamo eliminado');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          }
        }
      ]
    );
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getFilteredComplaints = () => {
    if (viewMode === 'all') return complaints;
    if (viewMode === 'recibido') return complaints.filter(c => c.status === 'recibido');
    if (viewMode === 'en_revision') return complaints.filter(c => c.status === 'en_revision');
    if (viewMode === 'resuelto') return complaints.filter(c => c.status === 'resuelto');
    return complaints;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      baja: '#10b981',
      media: '#f59e0b',
      alta: '#f97316',
      critica: '#ef4444'
    };
    return colors[priority] || '#6b7280';
  };

  const getStatusColor = (status) => {
    const colors = {
      recibido: '#3b82f6',
      en_revision: '#f59e0b',
      en_proceso: '#8b5cf6',
      resuelto: '#10b981',
      cerrado: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const renderComplaint = ({ item }) => (
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
        </View>
      </View>
      
      <Text style={styles.description}>{item.description}</Text>

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

      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color="#6b7280" />
          <Text style={styles.infoText}>{item.clientName}</Text>
        </View>
        {item.institution && (
          <View style={styles.infoRow}>
            <Ionicons name="business" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{item.institution.name}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Ionicons name="time" size={16} color="#6b7280" />
          <Text style={styles.infoText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const filteredComplaints = getFilteredComplaints();

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterButton, viewMode === 'all' && styles.filterButtonActive]}
            onPress={() => setViewMode('all')}
          >
            <Text style={[styles.filterText, viewMode === 'all' && styles.filterTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, viewMode === 'recibido' && styles.filterButtonActive]}
            onPress={() => setViewMode('recibido')}
          >
            <Text style={[styles.filterText, viewMode === 'recibido' && styles.filterTextActive]}>
              Recibidos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, viewMode === 'en_revision' && styles.filterButtonActive]}
            onPress={() => setViewMode('en_revision')}
          >
            <Text style={[styles.filterText, viewMode === 'en_revision' && styles.filterTextActive]}>
              En Revisión
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, viewMode === 'resuelto' && styles.filterButtonActive]}
            onPress={() => setViewMode('resuelto')}
          >
            <Text style={[styles.filterText, viewMode === 'resuelto' && styles.filterTextActive]}>
              Resueltos
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <FlatList 
        data={filteredComplaints} 
        renderItem={renderComplaint} 
        keyExtractor={(item) => item._id} 
        contentContainerStyle={styles.list} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} 
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No hay reclamos</Text>
          </View>
        } 
      />
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={handleCloseModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingComplaint ? 'Editar Reclamo' : 'Nuevo Reclamo'}</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Título *</Text>
              <TextInput 
                style={styles.input} 
                value={formData.title} 
                onChangeText={(text) => setFormData({ ...formData, title: text })} 
                placeholder="Título del reclamo" 
              />
              
              <Text style={styles.label}>Descripción *</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                value={formData.description} 
                onChangeText={(text) => setFormData({ ...formData, description: text })} 
                placeholder="Descripción detallada" 
                multiline 
                numberOfLines={4} 
              />
              
              <Text style={styles.label}>Nombre del Cliente *</Text>
              <TextInput 
                style={styles.input} 
                value={formData.clientName} 
                onChangeText={(text) => setFormData({ ...formData, clientName: text })} 
                placeholder="Nombre completo" 
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
                {['baja', 'media', 'alta', 'critica'].map((priority) => (
                  <TouchableOpacity 
                    key={priority} 
                    style={[styles.priorityButton, formData.priority === priority && styles.priorityButtonActive]} 
                    onPress={() => setFormData({ ...formData, priority })}
                  >
                    <Text style={[styles.priorityButtonText, formData.priority === priority && styles.priorityButtonTextActive]}>
                      {priority}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.button, styles.buttonCancel]} 
                  onPress={handleCloseModal}
                >
                  <Text style={styles.buttonCancelText}>Cancelar</Text>
                </TouchableOpacity>
                {editingComplaint && (
                  <TouchableOpacity 
                    style={[styles.button, styles.buttonDelete]} 
                    onPress={() => handleDelete(editingComplaint._id)}
                  >
                    <Text style={styles.buttonDeleteText}>Eliminar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[styles.button, styles.buttonSubmit]} 
                  onPress={handleSubmit}
                >
                  <Text style={styles.buttonSubmitText}>{editingComplaint ? 'Actualizar' : 'Crear'}</Text>
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
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
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
  emptyText: { fontSize: 16, color: '#9ca3af', marginTop: 10 },
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
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  button: { flex: 1, padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonCancel: { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' },
  buttonCancelText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  buttonSubmit: { backgroundColor: '#3b82f6' },
  buttonSubmitText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  buttonDelete: { backgroundColor: '#ef4444' },
  buttonDeleteText: { fontSize: 16, fontWeight: '600', color: '#fff' },
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
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    height: 50,
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
});
