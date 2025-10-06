import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { activitiesAPI } from '../config/api';

export default function ActivitiesScreen() {
  const [activities, setActivities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    comment: '',
    status: 'pendiente',
    scheduledDate: ''
  });

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const response = await activitiesAPI.getAll();
      setActivities(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las actividades');
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
      await activitiesAPI.create(formData);
      Alert.alert('Éxito', 'Actividad creada correctamente');
      setModalVisible(false);
      setFormData({ subject: '', comment: '', status: 'pendiente', scheduledDate: '' });
      loadActivities();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear la actividad');
    }
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

  const renderActivity = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.subject}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      
      {item.comment && (
        <Text style={styles.comment}>{item.comment}</Text>
      )}

      <View style={styles.cardFooter}>
        {item.institution && (
          <View style={styles.infoRow}>
            <Ionicons name="business" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{item.institution.name}</Text>
          </View>
        )}
        {item.scheduledDate && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color="#6b7280" />
            <Text style={styles.infoText}>
              {new Date(item.scheduledDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No hay actividades</Text>
          </View>
        }
      />

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
              <Text style={styles.modalTitle}>Nueva Actividad</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
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

              <Text style={styles.label}>Estado</Text>
              <View style={styles.statusButtons}>
                {['pendiente', 'en_progreso', 'completada'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      formData.status === status && styles.statusButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, status })}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      formData.status === status && styles.statusButtonTextActive
                    ]}>
                      {status.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

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
    maxHeight: '90%',
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
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  statusButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
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
});
