import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../config/api';
import notificationService from '../services/notificationService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Registrar para push notifications cuando el usuario está autenticado
  useEffect(() => {
    if (user && token) {
      // Registrar push token al autenticarse
      registerPushToken();
    }
  }, [user, token]);

  const registerPushToken = async () => {
    try {
      console.log('🔔 Registrando token de notificaciones push...');
      await notificationService.registerForPushNotifications();
    } catch (error) {
      console.error('Error registrando push token:', error);
    }
  };

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token');
      const storedUser = await SecureStore.getItemAsync('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      console.log('Intentando login...');
      const response = await authAPI.login(credentials);
      console.log('Login exitoso');
      const { token: newToken, user: newUser } = response.data;
      
      await SecureStore.setItemAsync('token', newToken);
      await SecureStore.setItemAsync('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error.message);
      let errorMessage = 'Error al iniciar sesión';
      
      if (!error.response) {
        errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
      } else if (error.response.status === 404) {
        errorMessage = 'Servidor no encontrado. Verifica la configuración de la API.';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token: newToken, user: newUser } = response.data;
      
      await SecureStore.setItemAsync('token', newToken);
      await SecureStore.setItemAsync('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.errors?.[0]?.msg || 
                error.response?.data?.message || 
                'Error al registrar'
      };
    }
  };

  const logout = async () => {
    // Desregistrar token de push antes de cerrar sesión
    try {
      const { pushTokensAPI } = await import('../config/api.js');
      await pushTokensAPI.unregister();
    } catch (error) {
      console.error('Error desregistrando push token:', error);
    }
    
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const updatedUser = response.data;
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error al refrescar usuario:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!token,
    isAdmin: user?.isAdmin || false
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
