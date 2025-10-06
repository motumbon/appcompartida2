import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { stockAPI } from '../config/api';

export default function StockScreen() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStock();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, items]);

  const loadStock = async () => {
    try {
      const response = await stockAPI.getAll();
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error al cargar stock:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterItems = () => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = items.filter(item =>
      item.referencia?.toLowerCase().includes(query) ||
      item.descripcion?.toLowerCase().includes(query) ||
      item.marca?.toLowerCase().includes(query)
    );
    setFilteredItems(filtered);
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

  const renderItem = ({ item }) => {
    const cantidad = parseInt(item.cantidad) || 0;
    const statusColor = getStatusColor(cantidad);
    const statusText = getStatusText(cantidad);

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
          <Text style={styles.stockQuantity}>{cantidad} unid.</Text>
        </View>

        <Text style={styles.itemReference}>{item.referencia || 'Sin referencia'}</Text>
        {item.descripcion && (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.descripcion}
          </Text>
        )}

        <View style={styles.itemDetails}>
          {item.marca && (
            <View style={styles.detailRow}>
              <Ionicons name="pricetag-outline" size={16} color="#6b7280" />
              <Text style={styles.detailText}>{item.marca}</Text>
            </View>
          )}
          {item.precioVenta && (
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={16} color="#6b7280" />
              <Text style={styles.detailText}>${item.precioVenta}</Text>
            </View>
          )}
        </View>

        {item.observaciones && (
          <View style={styles.observations}>
            <Text style={styles.observationsText} numberOfLines={3}>
              {item.observaciones}
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
  }
});
