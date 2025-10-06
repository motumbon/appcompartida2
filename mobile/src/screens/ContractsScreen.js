import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { contractsAPI } from '../config/api';

export default function ContractsScreen() {
  const [contracts, setContracts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const getStatusColor = (status) => {
    const colors = {
      activo: '#10b981',
      finalizado: '#6b7280',
      cancelado: '#ef4444',
      suspendido: '#f59e0b'
    };
    return colors[status] || '#6b7280';
  };

  const renderContract = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.contractNumber}>
            {item.numPedido || `Contrato #${index + 1}`}
          </Text>
          <Text style={styles.clientName}>
            {item.nomCliente || item.cliente || 'Sin nombre'}
          </Text>
        </View>
        {item.tipoCtto && (
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.tipoCtto}</Text>
          </View>
        )}
      </View>

      <View style={styles.detailsContainer}>
        {item.kamRepr && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>KAM/Repr:</Text>
            <Text style={styles.detailValue}>{item.kamRepr}</Text>
          </View>
        )}
        {item.material && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Material:</Text>
            <Text style={styles.detailValue}>{item.material}</Text>
          </View>
        )}
        {item.inicioValidez && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Inicio:</Text>
            <Text style={styles.detailValue}>{item.inicioValidez}</Text>
          </View>
        )}
        {item.finValidez && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fin:</Text>
            <Text style={styles.detailValue}>{item.finValidez}</Text>
          </View>
        )}
        {item.linea && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Línea:</Text>
            <Text style={styles.detailValue}>{item.linea}</Text>
          </View>
        )}
      </View>

      {item.denominacion && (
        <Text style={styles.description} numberOfLines={2}>{item.denominacion}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={contracts}
        renderItem={renderContract}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No hay contratos</Text>
          </View>
        }
      />
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
});
