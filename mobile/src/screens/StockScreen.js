import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { stockAPI } from '../config/api';

export default function StockScreen() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    linea: '',
    codigo: '',
    material: '',
    status: ''
  });

  useEffect(() => {
    loadStock();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, items, filters]);

  const loadStock = async () => {
    try {
      const response = await stockAPI.getAll();
      console.log('Stock response:', response.data);
      // El backend devuelve { items: [...], uploadedBy, uploadedAt, fileName }
      const stockData = response.data;
      setItems(stockData.items || []);
    } catch (error) {
      console.error('Error al cargar stock:', error);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    // Filtros del modal
    if (filters.linea) {
      filtered = filtered.filter(item => 
        item.linea?.toLowerCase().includes(filters.linea.toLowerCase())
      );
    }
    if (filters.codigo) {
      filtered = filtered.filter(item => 
        item.codigo?.toLowerCase().includes(filters.codigo.toLowerCase())
      );
    }
    if (filters.material) {
      filtered = filtered.filter(item => 
        item.material?.toLowerCase().includes(filters.material.toLowerCase())
      );
    }
    if (filters.status) {
      filtered = filtered.filter(item => 
        item.status?.toLowerCase().includes(filters.status.toLowerCase())
      );
    }

    // Búsqueda general
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.referencia?.toLowerCase().includes(query) ||
        item.descripcion?.toLowerCase().includes(query) ||
        item.codigo?.toLowerCase().includes(query) ||
        item.material?.toLowerCase().includes(query) ||
        item.linea?.toLowerCase().includes(query) ||
        item.observacion?.toLowerCase().includes(query)
      );
    }

    setFilteredItems(filtered);
  };

  const hasActiveFilters = () => {
    return filters.linea || filters.codigo || filters.material || filters.status;
  };

  const clearFilters = () => {
    setFilters({
      linea: '',
      codigo: '',
      material: '',
      status: ''
    });
  };

  const getStatusColor = (cantidad) => {
    const qty = parseInt(cantidad) || 0;
    if (qty === 0) return '#ef4444'; // rojo
    if (qty < 5) return '#f97316'; // naranja
    return '#22c55e'; // verde
  };

  const getStatusText = (cantidad) => {
    const qty = parseInt(cantidad) || 0;
    if (qty === 0) return 'Sin Stock';
    if (qty < 5) return 'Stock Bajo';
    return 'Disponible';
  };

  const getStatusColorFromText = (status) => {
    if (!status) return '#6b7280';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('sin stock')) return '#ef4444';
    if (statusLower.includes('discontinua')) return '#10b981';
    if (statusLower.includes('disponible') || statusLower.includes('contratos')) return '#3b82f6';
    if (statusLower.includes('mensual')) return '#8b5cf6';
    return '#6b7280';
  };

  const renderItem = ({ item }) => {
    const statusColor = getStatusColorFromText(item.status);

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={{ flex: 1 }}>
            {item.linea && (
              <Text style={styles.itemLinea}>{item.linea}</Text>
            )}
            <Text style={styles.itemReference}>{item.codigo || item.referencia || 'Sin código'}</Text>
          </View>
          {item.status && (
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusTextWhite}>{item.status}</Text>
            </View>
          )}
        </View>

        {item.material && (
          <Text style={styles.itemMaterial}>{item.material}</Text>
        )}

        <View style={styles.detailsGrid}>
          {item.descripcion && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Descripción:</Text>
              <Text style={styles.detailValue} numberOfLines={2}>{item.descripcion}</Text>
            </View>
          )}
        </View>

        {item.observacion && (
          <View style={styles.observations}>
            <Text style={styles.detailLabel}>Observación:</Text>
            <Text style={styles.observationsText} numberOfLines={3}>
              {item.observacion}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando stock...</Text>
      </View>
    );
  }

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

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por referencia, descripción o marca..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Ionicons 
            name="close-circle" 
            size={20} 
            color="#9ca3af" 
            onPress={() => setSearchQuery('')}
          />
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{items.length}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {items.filter(i => parseInt(i.cantidad) === 0).length}
          </Text>
          <Text style={styles.statLabel}>Sin Stock</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {items.filter(i => parseInt(i.cantidad) > 0 && parseInt(i.cantidad) < 5).length}
          </Text>
          <Text style={styles.statLabel}>Stock Bajo</Text>
        </View>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.referencia}-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => {
              setRefreshing(true);
              loadStock();
            }} 
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron resultados' : 'No hay items en stock'}
            </Text>
            {!searchQuery && (
              <Text style={styles.emptySubtext}>
                Sube un archivo Excel desde la versión web
              </Text>
            )}
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
              <Text style={styles.modalTitle}>Filtrar Stock</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Línea</Text>
              <TextInput
                style={styles.input}
                value={filters.linea}
                onChangeText={(text) => setFilters({...filters, linea: text})}
                placeholder="Buscar por línea..."
              />

              <Text style={styles.label}>Código</Text>
              <TextInput
                style={styles.input}
                value={filters.codigo}
                onChangeText={(text) => setFilters({...filters, codigo: text})}
                placeholder="Buscar por código..."
              />

              <Text style={styles.label}>Material</Text>
              <TextInput
                style={styles.input}
                value={filters.material}
                onChangeText={(text) => setFilters({...filters, material: text})}
                placeholder="Buscar por material..."
              />

              <Text style={styles.label}>Status</Text>
              <TextInput
                style={styles.input}
                value={filters.status}
                onChangeText={(text) => setFilters({...filters, status: text})}
                placeholder="Buscar por status..."
              />

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
    backgroundColor: '#f3f4f6'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937'
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  itemCard: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  stockQuantity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937'
  },
  itemReference: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6
  },
  itemDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280'
  },
  observations: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  observationsText: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic'
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 64
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center'
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center'
  },
  itemLinea: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  itemMaterial: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 12,
  },
  detailsGrid: {
    marginTop: 8,
  },
  detailItem: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  statusTextWhite: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
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
