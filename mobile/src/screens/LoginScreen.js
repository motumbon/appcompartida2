import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { checkAPIConnection } from '../config/api';
import { useResponsive } from '../hooks/useResponsive';

export default function LoginScreen({ navigation }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const { login } = useAuth();
  const { isLandscape, isTablet, wp } = useResponsive();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    console.log('🔍 Verificando conexión al servidor...');
    const result = await checkAPIConnection();
    if (result.success) {
      console.log('✅ Servidor accesible');
      setApiStatus('connected');
    } else {
      console.error('❌ Servidor no accesible:', result.error);
      setApiStatus('disconnected');
    }
  };

  const handleLogin = async () => {
    if (!usernameOrEmail || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Verificar conexión antes de intentar login
    if (apiStatus === 'disconnected') {
      Alert.alert(
        'Sin conexión', 
        'No se puede conectar al servidor. ¿Deseas reintentar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reintentar', onPress: checkConnection }
        ]
      );
      return;
    }

    setLoading(true);
    const result = await login({ usernameOrEmail, password });
    setLoading(false);

    if (!result.success) {
      Alert.alert('Error de inicio de sesión', result.message);
    }
  };

  const contentWidth = isLandscape && isTablet ? wp(50) : isTablet ? wp(70) : '100%';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          isLandscape && styles.scrollContentLandscape
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.content, { width: contentWidth, maxWidth: 500 }]}>
          <Text style={[styles.title, isTablet && styles.titleTablet]}>
            App Trabajo en Terreno
          </Text>
          <Text style={[styles.subtitle, isTablet && styles.subtitleTablet]}>
            Iniciar Sesión
          </Text>

          {/* Indicador de estado de conexión */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot,
              apiStatus === 'connected' ? styles.statusConnected : 
              apiStatus === 'disconnected' ? styles.statusDisconnected : 
              styles.statusChecking
            ]} />
            <Text style={[styles.statusText, isTablet && styles.statusTextTablet]}>
              {apiStatus === 'connected' ? 'Servidor conectado' :
               apiStatus === 'disconnected' ? 'Sin conexión al servidor' :
               'Verificando conexión...'}
            </Text>
            {apiStatus === 'disconnected' && (
              <TouchableOpacity onPress={checkConnection} style={styles.retryButton}>
                <Text style={styles.retryText}>↻</Text>
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={[styles.input, isTablet && styles.inputTablet]}
            placeholder="Usuario o Email"
            value={usernameOrEmail}
            onChangeText={setUsernameOrEmail}
            autoCapitalize="none"
          />

          <TextInput
            style={[styles.input, isTablet && styles.inputTablet]}
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled, isTablet && styles.buttonTablet]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={[styles.buttonText, isTablet && styles.buttonTextTablet]}>
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.link, isTablet && styles.linkTablet]}>
              ¿No tienes cuenta? Regístrate
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3b82f6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContentLandscape: {
    paddingVertical: 10,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  titleTablet: {
    fontSize: 36,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  subtitleTablet: {
    fontSize: 24,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  inputTablet: {
    padding: 18,
    fontSize: 18,
  },
  button: {
    backgroundColor: '#1e40af',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonTablet: {
    padding: 18,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextTablet: {
    fontSize: 18,
  },
  link: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  linkTablet: {
    fontSize: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusConnected: {
    backgroundColor: '#22c55e',
  },
  statusDisconnected: {
    backgroundColor: '#ef4444',
  },
  statusChecking: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },
  statusTextTablet: {
    fontSize: 14,
  },
  retryButton: {
    padding: 5,
  },
  retryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
