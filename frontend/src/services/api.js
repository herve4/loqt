import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  }
});

export const dashboardService = {
  getStats: () => api.get('dashboard/stats/'),
  getRealtime: () => api.get('dashboard/realtime/'),
};

export const authService = {
  login: (credentials) => api.post('auth/login/', credentials),
  logout: () => api.post('auth/logout/'),
  register: (data) => api.post('auth/register/', data),
  getCurrentUser: () => api.get('auth/me/'),
  requestPasswordReset: (email) => api.post('auth/password-reset/', { email }),
  confirmPasswordReset: (data) => api.post('auth/password-reset-confirm/', data),
  sendVerificationCode: (email) => api.post('auth/send-code/', { email }),
  verifyCode: (email, code) => api.post('auth/verify-code/', { email, code }),
};

export const logisticsService = {
  getEglises: (params) => api.get('eglises/', { params }),
  getMateriels: (params) => api.get('materiels/', { params }),
  getMaterielById: (id) => api.get(`materiels/${id}/`),
  getEvenements: (params) => api.get('evenements/', { params }),
  getEvenementById: (id) => api.get(`evenements/${id}/`),
  postEvenement: (data) => api.post('evenements/', data),
  patchEvenement: (id, data) => api.patch(`evenements/${id}/`, data),
  deleteEvenement: (id) => api.delete(`evenements/${id}/`),
  postEvenementImage: (data) => api.post('evenement-images/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  scanPoster: (data) => api.post('evenements/detect-info/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  extractChronogram: (data) => api.post('evenements/extract-chronogram/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getChronogramItems: (evenementId) => api.get(`chronogrammes/?evenement=${evenementId}`),
  postDefectReport: (data) => api.post('defectuosites/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMovements: () => api.get('mouvements/'),
  getMaterielMovements: (materielId) => api.get(`mouvements/?materiel=${materielId}`),
  getMaterielDefects: (materielId) => api.get(`defectuosites/?materiel=${materielId}`),
  postMovement: (data) => api.post('mouvements/', data),
  getMembers: () => api.get('users/'),
  getReunions: (params) => api.get('reunions/', { params }),
  getReunionById: (id) => api.get(`reunions/${id}/`),
  postReunion: (data) => api.post('reunions/', data),
  patchReunion: (id, data) => api.patch(`reunions/${id}/`, data),
  getExpressions: (params) => api.get('expressions-besoin/', { params }),
  getExpressionById: (id) => api.get(`expressions-besoin/${id}/`),
  postExpression: (data) => api.post('expressions-besoin/', data),
  patchValidation: (id, data) => api.patch(`validations/${id}/`, data),
  deciderExpression: (id, data) => api.post(`expressions-besoin/${id}/decider/`, data),
  getFormations: () => api.get('formations/'),
  getSessionsFormation: () => api.get('sessions-f/'), // Changé session-f pour matcher avec logistque/urls.py
  getDemandesFormation: () => api.get('demandes-f/'), // Changé demandes-f pour matcher avec logistque/urls.py
  postDemandeFormation: (data) => api.post('demandes-f/', data),
  getRessources: () => api.get('ressources/'),
  getPoles: () => api.get('poles/'),
  getRegions: () => api.get('regions/'),
  getCategories: () => api.get('categories/'),
  getSousCategories: () => api.get('sous-categories/'),
  getChronogramTemplates: () => api.get('chronogramme-templates/'),
  createChronogramTemplate: (data) => api.post('chronogramme-templates/', data),
  updateChronogramTemplate: (id, data) => api.patch(`chronogramme-templates/${id}/`, data),
  deleteChronogramTemplate: (id) => api.delete(`chronogramme-templates/${id}/`),
};

export default api;
