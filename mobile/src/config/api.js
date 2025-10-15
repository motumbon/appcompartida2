import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Configuración de la API URL - Railway siempre usa HTTPS
const BASE_API_URL = 'https://web-production-10bfc.up.railway.app';
const API_URL = Constants.expoConfig?.extra?.apiUrl || 
                Constants.manifest?.extra?.apiUrl || 
                Constants.manifest2?.extra?.expoClient?.extra?.apiUrl ||
                `${BASE_API_URL}/api`;

console.log('🌐 API URL configurada:', API_URL);
console.log('🔧 Constants.expoConfig:', Constants.expoConfig);

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Verificar conexión a la API
export const checkAPIConnection = async () => {
  try {
    console.log('🔍 Verificando conexión a:', `${API_URL}/health`);
    const response = await axios.get(`${API_URL}/health`, { timeout: 10000 });
    console.log('✅ Conexión exitosa:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    if (error.code === 'ECONNABORTED') {
      return { success: false, error: 'Timeout: El servidor tardó demasiado en responder' };
    }
    if (!error.response) {
      return { success: false, error: 'No se pudo conectar al servidor. Verifica tu internet.' };
    }
    return { success: false, error: error.message };
  }
};

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
  getAll: () => api.get('/contracts'),
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
  getAll: () => api.get('/notes'),
  getNotes: () => api.get('/notes'),
  create: (data) => api.post('/notes', data),
  createNote: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  updateNote: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
  deleteNote: (id) => api.delete(`/notes/${id}`)
};

export const usersAPI = {
  getUserInstitutions: () => api.get('/users/institutions'),
  linkInstitution: (institutionId) => api.post(`/users/institutions/${institutionId}`),
  unlinkInstitution: (institutionId) => api.delete(`/users/institutions/${institutionId}`),
  autocomplete: (query) => api.get(`/users/autocomplete?query=${encodeURIComponent(query)}`)
};

export const institutionsAPI = {
  getAll: () => api.get('/institutions'),
  create: (data) => api.post('/institutions', data),
  update: (id, data) => api.put(`/institutions/${id}`, data),
  delete: (id) => api.delete(`/institutions/${id}`)
};

export const pushTokensAPI = {
  register: (data) => api.post('/push-tokens/register', data),
  unregister: () => api.delete('/push-tokens/unregister')
};

export const rawMaterialsAPI = {
  getAll: (params) => api.get('/raw-materials', { params }),
  download: (id) => api.get(`/raw-materials/download/${id}`, { responseType: 'blob' }),
  getViewUrl: (id) => `${API_URL}/raw-materials/view/${id}`
};

export default api;
