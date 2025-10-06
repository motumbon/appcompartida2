import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Configuración de la API URL con fallback
const API_URL = Constants.expoConfig?.extra?.apiUrl || 
                Constants.manifest?.extra?.apiUrl || 
                Constants.manifest2?.extra?.expoClient?.extra?.apiUrl ||
                'https://appcompartida2-production.up.railway.app/api';

console.log('API URL configurada:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos de timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación y conexión
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('Error en API:', error.message);
    
    // Error de red o timeout
    if (!error.response) {
      console.error('Error de conexión a la API:', API_URL);
      error.message = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
    }
    
    // Error 401/403 - No autenticado
    if (error.response?.status === 401 || error.response?.status === 403) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me')
};

export const activitiesAPI = {
  getAll: () => api.get('/activities'),
  create: (data) => api.post('/activities', data),
  update: (id, data) => api.put(`/activities/${id}`, data),
  delete: (id) => api.delete(`/activities/${id}`)
};

export const tasksAPI = {
  getAll: () => api.get('/tasks'),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`)
};

export const complaintsAPI = {
  getAll: () => api.get('/complaints'),
  create: (data) => api.post('/complaints', data),
  update: (id, data) => api.put(`/complaints/${id}`, data),
  addUpdate: (id, data) => api.post(`/complaints/${id}/updates`, data),
  delete: (id) => api.delete(`/complaints/${id}`)
};

export const contractsAPI = {
  getContracts: () => api.get('/contracts')
};

export const contactsAPI = {
  getAll: () => api.get('/contacts'),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`)
};

export const stockAPI = {
  uploadFile: (formData) => api.post('/stock/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: () => api.get('/stock'),
  search: (query) => api.get(`/stock/search?query=${encodeURIComponent(query)}`)
};

export const notesAPI = {
  getNotes: () => api.get('/notes'),
  createNote: (data) => api.post('/notes', data),
  updateNote: (id, data) => api.put(`/notes/${id}`, data),
  deleteNote: (id) => api.delete(`/notes/${id}`)
};

export default api;
