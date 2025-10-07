import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { contractsAPI } from '../config/api';

export default function ContractsScreen() {
  const [contracts, setContracts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    kam: '',
    status: '',
    cliente: '',
    linea: '',
    denominacion: ''
  });

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const response = await contractsAPI.getAll();
      console.log('Contracts response:', response.data);
      // El backend devuelve { items: [...], uploadedBy, uploadedAt, fileName }
      const contractsData = response.data;
      setContracts(contractsData.items || []);
    } catch (error) {
      console.error('Error al cargar contratos:', error);
      Alert.alert('Error', 'No se pudieron cargar los contratos');
      setContracts([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContracts();
    setRefreshing(false);
  };

  const getExpirationStatus = (finValidez) => {
    if (!finValidez) return { status: 'unknown', color: '#6b7280', text: 'Sin fecha' };
    
    const today = new Date();
    const endDate = new Date(finValidez.split('-').reverse().join('-')); // Convierte DD-MM-YYYY a YYYY-MM-DD
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'expired', color: '#ef4444', text: 'Vencido' };
    } else if (diffDays < 60) {
      return { status: 'expiring', color: '#f59e0b', text: `${diffDays}d` };
    } else {
      return { status: 'active', color: '#10b981', text: `${diffDays}d` };
    }
  };

  // Obtener opciones únicas para los pickers
  const getUniqueKams = () => {
    const kams = contracts.map(c => c.kamRepr).filter(Boolean);
    return [...new Set(kams)].sort();
  };

  const getFilteredClientes = () => {
    let filtered = contracts;
    if (filters.kam) {
      filtered = filtered.filter(c => c.kamRepr === filters.kam);
    }
    const clientes = filtered.map(c => c.nomCliente).filter(Boolean);
    return [...new Set(clientes)].sort();
  };

  const getFilteredLineas = () => {
    let filtered = contracts;
    if (filters.kam) filtered = filtered.filter(c => c.kamRepr === filters.kam);
    if (filters.cliente) filtered = filtered.filter(c => c.nomCliente === filters.cliente);
    const lineas = filtered.map(c => c.linea).filter(Boolean);
    return [...new Set(lineas)].sort();
  };

  const getFilteredDenominaciones = () => {
    let filtered = contracts;
    if (filters.kam) filtered = filtered.filter(c => c.kamRepr === filters.kam);
    if (filters.cliente) filtered = filtered.filter(c => c.nomCliente === filters.cliente);
    if (filters.linea) filtered = filtered.filter(c => c.linea === filters.linea);
    const denominaciones = filtered.map(c => c.denominacion).filter(Boolean);
    return [...new Set(denominaciones)].sort();
  };

  const getFilteredContracts = () => {
    return contracts.filter(contract => {
      const matchKam = !filters.kam || contract.kamRepr === filters.kam;
      const matchCliente = !filters.cliente || contract.nomCliente === filters.cliente;
      const matchDenominacion = !filters.denominacion || contract.denominacion === filters.denominacion;
      const matchLinea = !filters.linea || contract.linea === filters.linea;
      
      // Filtro de status
      let matchStatus = true;
      if (filters.status) {
        const expirationInfo = getExpirationStatus(contract.finValidez);
        if (filters.status === 'active') {
          matchStatus = expirationInfo.status === 'active';
        } else if (filters.status === 'expiring') {
          matchStatus = expirationInfo.status === 'expiring';
        } else if (filters.status === 'expired') {
          matchStatus = expirationInfo.status === 'expired';
        }
      }
      
      return matchKam && matchCliente && matchDenominacion && matchLinea && matchStatus;
    });
  };

  const hasActiveFilters = () => {
    return filters.kam || filters.status || filters.cliente || filters.denominacion || filters.linea;
  };

  const clearFilters = () => {
    setFilters({
      kam: '',
      status: '',
      cliente: '',
      linea: '',
      denominacion: ''
    });
  };

  const renderContract = ({ item, index }) => {
    const expirationInfo = getExpirationStatus(item.finValidez);
    
    return (
      <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: expirationInfo.color }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.contractNumber}>
              {item.numPedido || `Contrato #${index + 1}`}
            </Text>
            <Text style={styles.clientName}>
              {item.nomCliente || item.cliente || 'Sin nombre'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: expirationInfo.color }]}>
            <Text style={styles.statusText}>{expirationInfo.text}</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          {item.linea && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Línea:</Text>
              <Text style={styles.detailValue}>{item.linea}</Text>
            </View>
          )}
          {item.material && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Material:</Text>
              <Text style={styles.detailValue}>{item.material}</Text>
            </View>
          )}
          {item.finValidez && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fin:</Text>
              <Text style={styles.detailValue}>{item.finValidez}</Text>
            </View>
          )}
        </View>

        {item.denominacion && (
          <Text style={styles.description} numberOfLines={2}>{item.denominacion}</Text>
        )}
      </View>
    );
  };

  const filteredContracts = getFilteredContracts();

  return (
    <View style={styles.container}>
      {/* Barra de filtros */}
      <View style={styles.filterBar}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="funnel-outline" size={20} color="#fff" />
          <Text style={styles.filterButtonText}>Filtros</Text>
          {hasActiveFilters() && <View style={styles.filterDot} />}
        </TouchableOpacity>
        {hasActiveFilters() && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredContracts}
        renderItem={renderContract}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {hasActiveFilters() ? 'No hay contratos que coincidan' : 'No hay contratos'}
            </Text>
          </View>
        }
      />

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
              <Text style={styles.modalTitle}>Filtrar Contratos</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* 1. KAM/Representante */}
              <Text style={styles.label}>KAM/Representante</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.kam}
                  onValueChange={(value) => setFilters({
                    kam: value,
                    status: filters.status,
                    cliente: '',
                    linea: '',
                    denominacion: ''
                  })}
                  style={styles.picker}
                >
                  <Picker.Item label="Todos" value="" />
                  {getUniqueKams().map((kam) => (
                    <Picker.Item key={kam} label={kam} value={kam} />
                  ))}
                </Picker>
              </View>

              {/* 2. Status */}
              <Text style={styles.label}>Estado</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.status}
                  onValueChange={(value) => setFilters({...filters, status: value})}
                  style={styles.picker}
                >
                  <Picker.Item label="Todos" value="" />
                  <Picker.Item label="Vigente (>60 días)" value="active" />
                  <Picker.Item label="Próximo a vencer (<60 días)" value="expiring" />
                  <Picker.Item label="Vencido" value="expired" />
                </Picker>
              </View>

              {/* 3. Nombre Cliente */}
              <Text style={styles.label}>Nombre Cliente</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.cliente}
                  onValueChange={(value) => setFilters({
                    ...filters,
                    cliente: value,
                    linea: '',
                    denominacion: ''
                  })}
                  style={styles.picker}
                  enabled={!filters.kam || getFilteredClientes().length > 0}
                >
                  <Picker.Item label="Todos" value="" />
                  {getFilteredClientes().map((cliente) => (
                    <Picker.Item key={cliente} label={cliente} value={cliente} />
                  ))}
                </Picker>
              </View>

              {/* 4. Línea */}
              <Text style={styles.label}>Línea</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.linea}
                  onValueChange={(value) => setFilters({
                    ...filters,
                    linea: value,
                    denominacion: ''
                  })}
                  style={styles.picker}
                  enabled={getFilteredLineas().length > 0}
                >
                  <Picker.Item label="Todos" value="" />
                  {getFilteredLineas().map((linea) => (
                    <Picker.Item key={linea} label={linea} value={linea} />
                  ))}
                </Picker>
              </View>

              {/* 5. Denominación */}
              <Text style={styles.label}>Denominación</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.denominacion}
                  onValueChange={(value) => setFilters({...filters, denominacion: value})}
                  style={styles.picker}
                  enabled={getFilteredDenominaciones().length > 0}
                >
                  <Picker.Item label="Todos" value="" />
                  {getFilteredDenominaciones().map((denominacion) => (
                    <Picker.Item key={denominacion} label={denominacion} value={denominacion} />
                  ))}
                </Picker>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => {
                    clearFilters();
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={styles.buttonSecondaryText}>Limpiar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={styles.buttonPrimaryText}>Aplicar</Text>
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
    marginBottom: 12,
  },
  contractNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 70,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  clearButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
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
    height: '70%',
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
