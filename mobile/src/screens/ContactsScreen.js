import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { contactsAPI, usersAPI, institutionsAPI } from '../config/api';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [userInstitutions, setUserInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [institutionsModalVisible, setInstitutionsModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    loadContacts();
    loadInstitutions();
    loadUserInstitutions();
  }, []);

  const loadContacts = async () => {
    try {
      const response = await contactsAPI.getAll();
      setContacts(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los contactos');
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const handleLinkInstitution = async (institutionId) => {
    try {
      await usersAPI.linkInstitution(institutionId);
      Alert.alert('Éxito', 'Institución vinculada');
      loadUserInstitutions();
    } catch (error) {
      Alert.alert('Error', 'No se pudo vincular la institución');
    }
  };

  const handleUnlinkInstitution = async (institutionId) => {
    Alert.alert(
      'Desvincular Institución',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            try {
              await usersAPI.unlinkInstitution(institutionId);
              Alert.alert('Éxito', 'Institución desvinculada');
              loadUserInstitutions();
            } catch (error) {
              Alert.alert('Error', 'No se pudo desvincular');
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Nombre y email son requeridos');
      return;
    }

    try {
      if (editingContact) {
        await contactsAPI.update(editingContact._id, formData);
        Alert.alert('Éxito', 'Contacto actualizado');
      } else {
        await contactsAPI.create(formData);
        Alert.alert('Éxito', 'Contacto creado');
      }
      closeModal();
      loadContacts();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el contacto');
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Eliminar Contacto',
      '¿Estás seguro de eliminar este contacto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await contactsAPI.delete(id);
              loadContacts();
              Alert.alert('Éxito', 'Contacto eliminado');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          }
        }
      ]
    );
  };

  const openModal = (contact = null) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        email: contact.email,
        phone: contact.phone || '',
        notes: contact.notes || ''
      });
    } else {
      setEditingContact(null);
      setFormData({ name: '', email: '', phone: '', notes: '' });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingContact(null);
    setFormData({ name: '', email: '', phone: '', notes: '' });
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <View style={styles.contactIcon}>
          <Ionicons name="person" size={24} color="#3b82f6" />
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactEmail}>{item.email}</Text>
          {item.phone && <Text style={styles.contactPhone}>{item.phone}</Text>}
          {item.isRegisteredUser && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Usuario Registrado</Text>
            </View>
          )}
        </View>
        <View style={styles.contactActions}>
          <TouchableOpacity onPress={() => openModal(item)}>
            <Ionicons name="pencil" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id)} style={{ marginLeft: 15 }}>
            <Ionicons name="trash" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      {item.notes && (
        <Text style={styles.contactNotes} numberOfLines={2}>{item.notes}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Cargando contactos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con botones */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setInstitutionsModalVisible(true)}
        >
          <Ionicons name="business" size={20} color="#fff" />
          <Text style={styles.headerButtonText}>Mis Instituciones</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadContacts();
          }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay contactos</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => openModal()}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Nombre completo"
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="email@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="+56 9 1234 5678"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Notas</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Información adicional..."
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={closeModal}
                >
                  <Text style={styles.buttonCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSubmit]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.buttonSubmitText}>
                    {editingContact ? 'Actualizar' : 'Crear'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Instituciones */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={institutionsModalVisible}
        onRequestClose={() => setInstitutionsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mis Instituciones</Text>
              <TouchableOpacity onPress={() => setInstitutionsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Instituciones Vinculadas */}
              <Text style={styles.sectionTitle}>Instituciones Vinculadas</Text>
              {userInstitutions.length === 0 ? (
                <Text style={styles.emptyText}>No tienes instituciones vinculadas</Text>
              ) : (
                userInstitutions.map((inst) => (
                  <View key={inst._id} style={styles.institutionItem}>
                    <View style={styles.institutionInfo}>
                      <Ionicons name="business" size={20} color="#3b82f6" />
                      <Text style={styles.institutionName}>{inst.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleUnlinkInstitution(inst._id)}>
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              {/* Todas las Instituciones */}
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Todas las Instituciones</Text>
              {institutions
                .filter(inst => !userInstitutions.some(ui => ui._id === inst._id))
                .map((inst) => (
                  <View key={inst._id} style={styles.institutionItem}>
                    <View style={styles.institutionInfo}>
                      <Ionicons name="business-outline" size={20} color="#6b7280" />
                      <Text style={styles.institutionName}>{inst.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleLinkInstitution(inst._id)}>
                      <Ionicons name="add-circle" size={24} color="#10b981" />
                    </TouchableOpacity>
                  </View>
                ))}
              {institutions.filter(inst => !userInstitutions.some(ui => ui._id === inst._id)).length === 0 && (
                <Text style={styles.emptyText}>Todas las instituciones están vinculadas</Text>
              )}
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
    backgroundColor: '#f3f4f6'
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14b8a6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContent: {
    padding: 16,
    paddingBottom: 80
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  contactInfo: {
    flex: 1
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4
  },
  contactEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2
  },
  contactPhone: {
    fontSize: 14,
    color: '#6b7280'
  },
  badge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start'
  },
  badgeText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600'
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  contactNotes: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    fontSize: 14,
    color: '#6b7280'
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 64
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af'
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
    elevation: 8
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: '85%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937'
  },
  modalForm: {
    flex: 1
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonCancel: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db'
  },
  buttonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  },
  buttonSubmit: {
    backgroundColor: '#3b82f6'
  },
  buttonSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  institutionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  institutionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  institutionName: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
});
