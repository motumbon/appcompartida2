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
import { notesAPI, contactsAPI, institutionsAPI } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

export default function NotesScreen() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [allNotes, setAllNotes] = useState([]); // Todas las notas sin filtrar
  const [contacts, setContacts] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    comment: '',
    sharedWith: [],
    institution: null
  });
  const [filters, setFilters] = useState({
    month: null,
    institution: null,
    sharedUser: null
  });

  useEffect(() => {
    loadNotes();
    loadContacts();
    loadInstitutions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allNotes, filters]);

  const loadNotes = async () => {
    try {
      const response = await notesAPI.getNotes();
      setAllNotes(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las notas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadContacts = async () => {
    try {
      const response = await contactsAPI.getAll();
      setContacts(response.data.filter(c => c.isRegisteredUser));
    } catch (error) {
      console.error('Error al cargar contactos');
    }
  };

  const loadInstitutions = async () => {
    try {
      const response = await institutionsAPI.getAll();
      setInstitutions(response.data);
    } catch (error) {
      console.error('Error al cargar instituciones');
    }
  };

  const applyFilters = () => {
    let filtered = [...allNotes];

    // Filtro por mes
    if (filters.month) {
      filtered = filtered.filter(note => {
        const noteDate = new Date(note.createdAt);
        const noteMonth = `${noteDate.getFullYear()}-${String(noteDate.getMonth() + 1).padStart(2, '0')}`;
        return noteMonth === filters.month;
      });
    }

    // Filtro por institución
    if (filters.institution) {
      filtered = filtered.filter(note => note.institution?._id === filters.institution);
    }

    // Filtro por usuario compartido
    if (filters.sharedUser) {
      filtered = filtered.filter(note => 
        note.sharedWith?.some(u => u._id === filters.sharedUser)
      );
    }

    setNotes(filtered);
  };

  const clearFilters = () => {
    setFilters({
      month: null,
      institution: null,
      sharedUser: null
    });
    setFilterModalVisible(false);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(v => v !== null).length;
  };

  const getMonthOptions = () => {
    const months = [];
    const uniqueMonths = new Set();
    
    allNotes.forEach(note => {
      const date = new Date(note.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      uniqueMonths.add(monthKey);
    });
    
    Array.from(uniqueMonths).sort().reverse().forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      const date = new Date(year, parseInt(month) - 1);
      months.push({
        value: monthKey,
        label: date.toLocaleDateString('es', { month: 'long', year: 'numeric' })
      });
    });
    
    return months;
  };

  const getAvailableInstitutions = () => {
    const institutionIds = new Set();
    
    allNotes.forEach(note => {
      if (note.institution) {
        institutionIds.add(note.institution._id);
      }
    });
    
    return institutions.filter(inst => institutionIds.has(inst._id));
  };

  const getAvailableSharedUsers = () => {
    const userIds = new Set();
    
    allNotes.forEach(note => {
      if (note.sharedWith && note.sharedWith.length > 0) {
        note.sharedWith.forEach(user => {
          userIds.add(user._id);
        });
      }
    });
    
    return contacts.filter(contact => userIds.has(contact.userId));
  };

  const handleSubmit = async () => {
    if (!formData.subject || !formData.comment) {
      Alert.alert('Error', 'Asunto y comentario son requeridos');
      return;
    }

    try {
      if (editingNote) {
        await notesAPI.updateNote(editingNote._id, formData);
        Alert.alert('Éxito', 'Nota actualizada');
      } else {
        await notesAPI.createNote(formData);
        Alert.alert('Éxito', 'Nota creada');
      }
      closeModal();
      loadNotes();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la nota');
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Eliminar Nota',
      '¿Estás seguro de eliminar esta nota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await notesAPI.deleteNote(id);
              loadNotes();
              Alert.alert('Éxito', 'Nota eliminada');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          }
        }
      ]
    );
  };

  const openModal = (note = null) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        subject: note.subject,
        comment: note.comment,
        sharedWith: note.sharedWith.map(u => u._id),
        institution: note.institution?._id || null
      });
    } else {
      setEditingNote(null);
      setFormData({ subject: '', comment: '', sharedWith: [], institution: null });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingNote(null);
    setFormData({ subject: '', comment: '', sharedWith: [], institution: null });
  };

  const toggleSharedUser = (userId) => {
    setFormData(prev => ({
      ...prev,
      sharedWith: prev.sharedWith.includes(userId)
        ? prev.sharedWith.filter(id => id !== userId)
        : [...prev.sharedWith, userId]
    }));
  };

  const isSharedNote = (note) => {
    const creatorId = note.createdBy?._id || note.createdBy;
    const currentUserId = user?._id || user?.id;
    return creatorId !== currentUserId;
  };

  const renderNote = ({ item }) => {
    const isShared = isSharedNote(item);
    const borderColor = isShared ? '#a855f7' : '#3b82f6';

    return (
      <View style={[styles.noteCard, { borderLeftColor: borderColor }]}>
        {isShared && item.createdBy && (
          <View style={styles.sharedBadge}>
            <Ionicons name="person" size={12} color="#a855f7" />
            <Text style={styles.sharedText}>Por: {item.createdBy.username}</Text>
          </View>
        )}

        <Text style={styles.noteSubject}>{item.subject}</Text>
        <Text style={styles.noteComment} numberOfLines={4}>{item.comment}</Text>

        {item.institution && (
          <View style={styles.institutionContainer}>
            <Ionicons name="business" size={14} color="#6b7280" />
            <Text style={styles.institutionText}>{item.institution.name}</Text>
          </View>
        )}

        {item.sharedWith && item.sharedWith.length > 0 && (
          <View style={styles.sharedWithContainer}>
            <Ionicons name="people-outline" size={14} color="#6b7280" />
            <Text style={styles.sharedWithText}>
              Compartido con: {item.sharedWith.map(u => u.username).join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.noteFooter}>
          <Text style={styles.noteDate}>
            {new Date(item.createdAt).toLocaleDateString('es-CL', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          <View style={styles.noteActions}>
            <TouchableOpacity onPress={() => openModal(item)} style={styles.actionButton}>
              <Ionicons name="pencil" size={18} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionButton}>
              <Ionicons name="trash" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Cargando notas...</Text>
      </View>
    );
  }

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <View style={styles.container}>
      {/* Barra de filtros */}
      <View style={styles.filterBar}>
        <TouchableOpacity 
          style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={20} color={activeFiltersCount > 0 ? "#3b82f6" : "#6b7280"} />
          <Text style={[styles.filterButtonText, activeFiltersCount > 0 && styles.filterButtonTextActive]}>
            Filtros
          </Text>
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        {activeFiltersCount > 0 && (
          <TouchableOpacity style={styles.clearFilterButton} onPress={clearFilters}>
            <Text style={styles.clearFilterText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notes}
        renderItem={renderNote}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadNotes();
          }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {activeFiltersCount > 0 ? 'No hay notas con estos filtros' : 'No hay notas'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
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
                {editingNote ? 'Editar Nota' : 'Nueva Nota'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Asunto *</Text>
              <TextInput
                style={styles.input}
                value={formData.subject}
                onChangeText={(text) => setFormData({ ...formData, subject: text })}
                placeholder="Título de la nota"
              />

              <Text style={styles.label}>Comentario *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.comment}
                onChangeText={(text) => setFormData({ ...formData, comment: text })}
                placeholder="Escribe aquí tu nota..."
                multiline
                numberOfLines={6}
              />

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

              <Text style={styles.label}>Compartir con usuarios</Text>
              {contacts.length === 0 ? (
                <Text style={styles.noContactsText}>
                  No hay usuarios disponibles para compartir
                </Text>
              ) : (
                <View style={styles.contactsList}>
                  {contacts.map((contact) => (
                    <TouchableOpacity
                      key={contact._id}
                      style={[
                        styles.contactItem,
                        formData.sharedWith.includes(contact.userId) && styles.contactItemSelected
                      ]}
                      onPress={() => toggleSharedUser(contact.userId)}
                    >
                      <View style={styles.contactCheckbox}>
                        {formData.sharedWith.includes(contact.userId) && (
                          <Ionicons name="checkmark" size={16} color="#3b82f6" />
                        )}
                      </View>
                      <View style={styles.contactItemInfo}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        {contact.email && (
                          <Text style={styles.contactEmail}>{contact.email}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

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
                    {editingNote ? 'Actualizar' : 'Crear'}
                  </Text>
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
              {/* Filtro por Mes */}
              <Text style={styles.label}>Mes</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <TouchableOpacity
                  style={[styles.filterChip, !filters.month && styles.filterChipSelected]}
                  onPress={() => setFilters({ ...filters, month: null })}
                >
                  <Text style={[styles.filterChipText, !filters.month && styles.filterChipTextSelected]}>
                    Todos
                  </Text>
                </TouchableOpacity>
                {getMonthOptions().map((month) => (
                  <TouchableOpacity
                    key={month.value}
                    style={[styles.filterChip, filters.month === month.value && styles.filterChipSelected]}
                    onPress={() => setFilters({ ...filters, month: month.value })}
                  >
                    <Text style={[styles.filterChipText, filters.month === month.value && styles.filterChipTextSelected]}>
                      {month.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Filtro por Institución */}
              <Text style={styles.label}>Institución</Text>
              {getAvailableInstitutions().length === 0 ? (
                <Text style={styles.noOptionsText}>
                  No hay notas con instituciones asignadas
                </Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  <TouchableOpacity
                    style={[styles.filterChip, !filters.institution && styles.filterChipSelected]}
                    onPress={() => setFilters({ ...filters, institution: null })}
                  >
                    <Text style={[styles.filterChipText, !filters.institution && styles.filterChipTextSelected]}>
                      Todas
                    </Text>
                  </TouchableOpacity>
                  {getAvailableInstitutions().map((inst) => (
                    <TouchableOpacity
                      key={inst._id}
                      style={[styles.filterChip, filters.institution === inst._id && styles.filterChipSelected]}
                      onPress={() => setFilters({ ...filters, institution: inst._id })}
                    >
                      <Ionicons 
                        name="business" 
                        size={14} 
                        color={filters.institution === inst._id ? "#fff" : "#6b7280"} 
                      />
                      <Text style={[styles.filterChipText, filters.institution === inst._id && styles.filterChipTextSelected]}>
                        {inst.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Filtro por Usuario Compartido */}
              <Text style={styles.label}>Compartido con</Text>
              {getAvailableSharedUsers().length === 0 ? (
                <Text style={styles.noOptionsText}>
                  No hay notas compartidas con usuarios
                </Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  <TouchableOpacity
                    style={[styles.filterChip, !filters.sharedUser && styles.filterChipSelected]}
                    onPress={() => setFilters({ ...filters, sharedUser: null })}
                  >
                    <Text style={[styles.filterChipText, !filters.sharedUser && styles.filterChipTextSelected]}>
                      Todos
                    </Text>
                  </TouchableOpacity>
                  {getAvailableSharedUsers().map((contact) => (
                    <TouchableOpacity
                      key={contact._id}
                      style={[styles.filterChip, filters.sharedUser === contact.userId && styles.filterChipSelected]}
                      onPress={() => setFilters({ ...filters, sharedUser: contact.userId })}
                    >
                      <Ionicons 
                        name="person" 
                        size={14} 
                        color={filters.sharedUser === contact.userId ? "#fff" : "#6b7280"} 
                      />
                      <Text style={[styles.filterChipText, filters.sharedUser === contact.userId && styles.filterChipTextSelected]}>
                        {contact.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={clearFilters}
                >
                  <Text style={styles.buttonCancelText}>Limpiar Filtros</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSubmit]}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={styles.buttonSubmitText}>Aplicar</Text>
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
    backgroundColor: '#f3f4f6'
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
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4
  },
  sharedText: {
    fontSize: 11,
    color: '#a855f7',
    fontWeight: '600'
  },
  noteSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8
  },
  noteComment: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12
  },
  sharedWithContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginBottom: 12
  },
  sharedWithText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  noteDate: {
    fontSize: 12,
    color: '#9ca3af'
  },
  noteActions: {
    flexDirection: 'row',
    gap: 12
  },
  actionButton: {
    padding: 4
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
    height: 120,
    textAlignVertical: 'top'
  },
  noContactsText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginBottom: 16
  },
  contactsList: {
    marginBottom: 16
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12
  },
  contactItemSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff'
  },
  contactCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  contactItemInfo: {
    flex: 1
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2
  },
  contactEmail: {
    fontSize: 12,
    color: '#6b7280'
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
  institutionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  institutionText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db'
  },
  filterButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6'
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280'
  },
  filterButtonTextActive: {
    color: '#3b82f6'
  },
  filterBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  clearFilterText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600'
  },
  institutionScroll: {
    marginBottom: 16
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
    marginRight: 8
  },
  institutionChipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6'
  },
  institutionChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500'
  },
  institutionChipTextSelected: {
    color: '#fff'
  },
  filterScroll: {
    marginBottom: 16
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8
  },
  filterChipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6'
  },
  filterChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500'
  },
  filterChipTextSelected: {
    color: '#fff'
  },
  noOptionsText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginBottom: 16,
    paddingVertical: 12
  }
});
