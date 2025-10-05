import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  getPendingUsers: () => api.get('/auth/pending-users'),
  approveUser: (userId) => api.post(`/auth/approve-user/${userId}`),
  rejectUser: (userId) => api.delete(`/auth/reject-user/${userId}`)
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  delete: (id) => api.delete(`/users/${id}`),
  updatePermissions: (id, data) => api.put(`/users/${id}/permissions`, data),
  search: (email) => api.get(`/users/search?email=${email}`),
  autocomplete: (query) => api.get(`/users/autocomplete?query=${encodeURIComponent(query)}`),
  linkInstitution: (institutionId) => api.post('/users/institutions/link', { institutionId }),
  unlinkInstitution: (id) => api.delete(`/users/institutions/${id}`),
  getUserInstitutions: () => api.get('/users/institutions'),
  uploadProfileImage: (formData) => api.post('/users/profile-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  changePassword: (data) => api.put('/users/change-password', data),
  deleteAccount: () => api.delete('/users/me'),
  resetPassword: (userId) => api.post(`/users/${userId}/reset-password`)
};

// Institutions API
export const institutionsAPI = {
  getAll: () => api.get('/institutions'),
  create: (data) => api.post('/institutions', data),
  update: (id, data) => api.put(`/institutions/${id}`, data),
  delete: (id) => api.delete(`/institutions/${id}`)
};

// Contacts API
export const contactsAPI = {
  getAll: () => api.get('/contacts'),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`)
};

// Activities API
export const activitiesAPI = {
  getAll: () => api.get('/activities'),
  create: (data) => api.post('/activities', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  update: (id, data) => api.put(`/activities/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  delete: (id) => api.delete(`/activities/${id}`),
  downloadAttachment: (activityId, filename) => api.get(`/activities/${activityId}/attachments/${filename}`, {
    responseType: 'blob'
  })
};

// Tasks API
export const tasksAPI = {
  getAll: () => api.get('/tasks'),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`)
};

// Complaints API
export const complaintsAPI = {
  getAll: () => api.get('/complaints'),
  create: (data) => api.post('/complaints', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  update: (id, data) => api.put(`/complaints/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  addUpdate: (id, data) => api.post(`/complaints/${id}/updates`, data),
  delete: (id) => api.delete(`/complaints/${id}`),
  downloadAttachment: (complaintId, filename) => api.get(`/complaints/${complaintId}/attachments/${filename}`, {
    responseType: 'blob'
  })
};

// Contracts API
export const contractsAPI = {
  getContracts: () => api.get('/contracts'),
  uploadExcel: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/contracts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onUploadProgress) {
          onUploadProgress(percentCompleted);
        }
      }
    });
  },
  deleteContracts: () => api.delete('/contracts')
};

// Stock API
export const stockAPI = {
  getStock: () => api.get('/stock'),
  uploadExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/stock/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  deleteStock: () => api.delete('/stock')
};

export default api;
