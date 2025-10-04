import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { activitiesAPI, tasksAPI, complaintsAPI, contractsAPI } from '../config/api';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ activities: 0, tasks: 0, complaints: 0, contracts: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [activitiesRes, tasksRes, complaintsRes, contractsRes] = await Promise.all([
        activitiesAPI.getAll(),
        tasksAPI.getAll(),
        complaintsAPI.getAll(),
        contractsAPI.getAll()
      ]);

      setStats({
        activities: activitiesRes.data.length,
        tasks: tasksRes.data.filter(t => t.status !== 'completada').length,
        complaints: complaintsRes.data.filter(c => c.status !== 'cerrado').length,
        contracts: contractsRes.data.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>¡Hola, {user?.username}!</Text>
        {user?.isAdmin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminText}>Administrador</Text>
          </View>
        )}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
          <Ionicons name="calendar" size={32} color="#fff" />
          <Text style={styles.statNumber}>{stats.activities}</Text>
          <Text style={styles.statLabel}>Actividades</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#8b5cf6' }]}>
          <Ionicons name="checkmark-circle" size={32} color="#fff" />
          <Text style={styles.statNumber}>{stats.tasks}</Text>
          <Text style={styles.statLabel}>Tareas Pendientes</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
          <Ionicons name="alert-circle" size={32} color="#fff" />
          <Text style={styles.statNumber}>{stats.complaints}</Text>
          <Text style={styles.statLabel}>Reclamos Activos</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#6366f1' }]}>
          <Ionicons name="document-text" size={32} color="#fff" />
          <Text style={styles.statNumber}>{stats.contracts}</Text>
          <Text style={styles.statLabel}>Contratos</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Bienvenido a App Trabajo en Terreno</Text>
        <Text style={styles.infoText}>
          Gestiona tus actividades, tareas, reclamos y contratos desde tu dispositivo móvil.
        </Text>
        <Text style={styles.infoText}>
          Utiliza el menú inferior para navegar entre las diferentes secciones.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  adminBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
  },
  adminText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 10,
  },
});
