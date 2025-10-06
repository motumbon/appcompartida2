import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { checkAPIConnection } from '../config/api';

export default function LoginScreen({ navigation }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const { login } = useAuth();

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>App Trabajo en Terreno</Text>
        <Text style={styles.subtitle}>Iniciar Sesión</Text>

        {/* Indicador de estado de conexión */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusDot,
            apiStatus === 'connected' ? styles.statusConnected : 
            apiStatus === 'disconnected' ? styles.statusDisconnected : 
            styles.statusChecking
          ]} />
          <Text style={styles.statusText}>
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
          style={styles.input}
          placeholder="Usuario o Email"
          value={usernameOrEmail}
          onChangeText={setUsernameOrEmail}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3b82f6',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1e40af',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
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
  link: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
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
  retryButton: {
    padding: 5,
  },
  retryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
