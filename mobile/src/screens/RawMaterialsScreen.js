import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import { rawMaterialsAPI } from '../config/api';

export default function RawMaterialsScreen() {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categoryStructure = {
    'IV Drugs': {
      children: [
        { name: 'Anestesia', parent: 'IV Drugs' },
        { name: 'Oncología', parent: 'IV Drugs' }
      ]
    },
    'Enterales': {
      children: [
        { name: 'Tube Feeds', parent: 'Enterales' },
        { name: 'Soporte Oral', parent: 'Enterales' },
        { name: 'Polvos', parent: 'Enterales' }
      ]
    },
    'Parenterales': {
      children: [
        { name: '3CB', parent: 'Parenterales' },
        { name: 'Materias Primas', parent: 'Parenterales' }
      ]
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, selectedCategory, selectedParent]);

  const loadDocuments = async () => {
    try {
      const response = await rawMaterialsAPI.getAll();
      setDocuments(response.data);
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      Alert.alert('Error', 'No se pudieron cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    if (!selectedCategory) {
      setFilteredDocuments([]);
      return;
    }

    const filtered = documents.filter(
      doc => doc.category === selectedCategory && doc.parentCategory === selectedParent
    );
    setFilteredDocuments(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const handleCategorySelect = (category, parent) => {
    setSelectedCategory(category);
    setSelectedParent(parent);
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setSelectedParent(null);
  };

  const handleView = async (doc) => {
    try {
      Alert.alert(
        'Ver Documento',
        `¿Cómo deseas ver "${doc.title}"?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel'
          },
          {
            text: 'Descargar y Abrir',
            onPress: () => handleDownload(doc, true)
          },
          {
            text: 'Solo Descargar',
            onPress: () => handleDownload(doc, false)
          }
        ]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo procesar la solicitud');
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Permiso de Almacenamiento',
            message: 'La aplicación necesita acceso al almacenamiento para descargar archivos PDF.',
            buttonNeutral: 'Preguntar Después',
            buttonNegative: 'Cancelar',
            buttonPositive: 'Permitir',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS no requiere este permiso
  };

  const handleDownload = async (doc, openAfterDownload = false) => {
    try {
      // Solicitar permisos primero
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert(
          'Permiso Requerido',
          'Necesitas otorgar permiso de almacenamiento para descargar archivos.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configuración', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      Alert.alert('Descargando', 'Por favor espera...');

      // Obtener token de autenticación
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        Alert.alert('Error', 'No se pudo autenticar. Por favor inicia sesión nuevamente.');
        return;
      }

      // Crear ruta de archivo con nombre limpio
      const fileName = doc.originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Descargar con headers de autenticación
      const downloadResumable = FileSystem.createDownloadResumable(
        rawMaterialsAPI.getViewUrl(doc._id),
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        },
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log(`Progreso: ${(progress * 100).toFixed(0)}%`);
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result) {
        // Verificar que el archivo se descargó correctamente
        const fileInfo = await FileSystem.getInfoAsync(result.uri);
        console.log('Archivo descargado:', fileInfo);
        
        if (fileInfo.exists && fileInfo.size > 1000) {
          Alert.alert(
            'Éxito',
            `Documento descargado: ${doc.originalName}`,
            [
              {
                text: 'OK',
                onPress: () => {
                  if (openAfterDownload) {
                    openDocument(result.uri);
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', 'El archivo descargado parece estar dañado o vacío');
        }
      }
    } catch (error) {
      console.error('Error al descargar:', error);
      Alert.alert('Error', `No se pudo descargar el documento: ${error.message}`);
    }
  };

  const openDocument = async (uri) => {
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Info', 'No se puede abrir el documento en este dispositivo');
      }
    } catch (error) {
      console.error('Error al abrir documento:', error);
      Alert.alert('Error', 'No se pudo abrir el documento');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const renderCategoryButton = ({ item: child }) => (
    <TouchableOpacity
      style={styles.categoryButton}
      onPress={() => handleCategorySelect(child.name, child.parent)}
    >
      <Text style={styles.categoryButtonText}>{child.name}</Text>
      <Ionicons name="chevron-forward" size={20} color="#fff" />
    </TouchableOpacity>
  );

  const renderDocument = ({ item }) => (
    <View style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <Ionicons name="document-text" size={32} color="#ef4444" />
        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.documentMeta}>
            {formatFileSize(item.fileSize)} • {new Date(item.createdAt).toLocaleDateString('es-ES')}
          </Text>
        </View>
      </View>
      <View style={styles.documentActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => handleView(item)}
        >
          <Ionicons name="eye" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Ver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.downloadButton]}
          onPress={() => handleDownload(item, false)}
        >
          <Ionicons name="download" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Descargar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando documentos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Fichas Técnicas</Text>
      </View>

      {/* Breadcrumb */}
      {selectedCategory && (
        <View style={styles.breadcrumb}>
          <TouchableOpacity onPress={handleBack} style={styles.breadcrumbButton}>
            <Ionicons name="arrow-back" size={20} color="#3b82f6" />
            <Text style={styles.breadcrumbText}>Volver</Text>
          </TouchableOpacity>
          <Text style={styles.breadcrumbPath}>
            {selectedParent} → {selectedCategory}
          </Text>
        </View>
      )}

      {!selectedCategory ? (
        /* Vista de categorías */
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {Object.entries(categoryStructure).map(([parentName, { children }]) => (
            <View key={parentName} style={styles.categoryGroup}>
              <Text style={styles.categoryGroupTitle}>{parentName}</Text>
              <FlatList
                data={children}
                renderItem={renderCategoryButton}
                keyExtractor={(item) => item.name}
                scrollEnabled={false}
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        /* Vista de documentos */
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>
            Documentos de {selectedCategory}
          </Text>
          {filteredDocuments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                No hay documentos en esta categoría
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredDocuments}
              renderItem={renderDocument}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.documentList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </View>
      )}
    </View>
  );
}

// Necesitamos importar ScrollView
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b'
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  breadcrumb: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  breadcrumbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500'
  },
  breadcrumbPath: {
    fontSize: 12,
    color: '#64748b'
  },
  content: {
    flex: 1,
    padding: 16
  },
  categoryGroup: {
    marginBottom: 24
  },
  categoryGroupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12
  },
  categoryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16
  },
  documentList: {
    paddingBottom: 16
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  documentHeader: {
    flexDirection: 'row',
    marginBottom: 12
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4
  },
  documentMeta: {
    fontSize: 12,
    color: '#64748b'
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6
  },
  viewButton: {
    backgroundColor: '#3b82f6'
  },
  downloadButton: {
    backgroundColor: '#10b981'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 16
  }
});
