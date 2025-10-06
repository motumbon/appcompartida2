import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      console.log('🔐 Intentando login...', { username: credentials.usernameOrEmail });
      const response = await authAPI.login(credentials);
      console.log('✅ Respuesta del servidor:', response.status);
      
      // Verificar si está pendiente de aprobación
      if (response.data.pending) {
        return { 
          success: false, 
          pending: true,
          message: response.data.message || 'Tu cuenta está pendiente de aprobación'
        };
      }
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        console.error('❌ Respuesta inválida del servidor:', response.data);
        return {
          success: false,
          message: 'Respuesta inválida del servidor'
        };
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      
      console.log('✅ Login exitoso');
      return { success: true };
    } catch (error) {
      console.error('❌ Error en login:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      // Verificar si es error de aprobación pendiente
      if (error.response?.status === 403 && error.response?.data?.pending) {
        return { 
          success: false, 
          pending: true,
          message: error.response.data.message || 'Tu cuenta está pendiente de aprobación'
        };
      }
      
      // Error de red
      if (!error.response) {
        return {
          success: false,
          message: 'No se pudo conectar al servidor. Verifica tu conexión a internet.'
        };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Error al iniciar sesión' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      
      // Verificar si está pendiente de aprobación
      if (response.data.pending) {
        return { 
          success: true, 
          pending: true,
          message: response.data.message 
        };
      }
      
      // Si no está pendiente, es un admin auto-aprobado
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      
      return { success: true, pending: false };
    } catch (error) {
      const message = error.response?.data?.errors?.[0]?.msg || 
                     error.response?.data?.message || 
                     'Error al registrar usuario';
      return { success: false, message };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const updatedUser = response.data;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('Error al refrescar usuario:', error);
      // Si hay error de autenticación, cerrar sesión
      if (error.response?.status === 401) {
        logout();
      }
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
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
