import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    console.log('Making API request to:', config.url);
    console.log('Request config:', config);
    console.log('Cookies being sent:', document.cookie);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('API error:', error.response?.status, error.config?.url, error.message);
    if (error.response?.status === 401) {
      console.log('Unauthorized - redirecting to login');
      localStorage.removeItem('traveler');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (data) => api.post('/api/auth/signup', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get('/api/auth/me'),
  checkAuth: () => api.get('/api/auth/check'),
};

export const travelerAPI = {
  getProfile: () => api.get('/api/traveler/profile'),
  updateProfile: (data) => api.put('/api/traveler/profile', data),
  uploadProfilePicture: (formData) => api.post('/api/traveler/profile/picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPublicProfile: (id) => api.get(`/api/traveler/profile/${id}`),
};

export const propertiesAPI = {
  search: (params) => api.get('/api/properties/search', { params }),
  getById: (id) => api.get(`/api/properties/${id}`),
  checkAvailability: (id, checkIn, checkOut) => 
    api.get(`/api/properties/${id}/availability`, { 
      params: { check_in: checkIn, check_out: checkOut } 
    }),
};

export const bookingsAPI = {
  create: (data) => api.post('/api/bookings', data),
  getTravelerBookings: (travelerId, status) => 
    api.get(`/api/bookings/traveler/${travelerId}`, { params: { status } }),
  getById: (id) => api.get(`/api/bookings/${id}`),
  cancel: (id) => api.put(`/api/bookings/${id}/cancel`),
};

export const favoritesAPI = {
  add: (propertyId) => api.post('/api/favorites', { property_id: propertyId }),
  remove: (propertyId) => api.delete(`/api/favorites/${propertyId}`),
  getTravelerFavorites: (travelerId, page = 1, limit = 20) => 
    api.get(`/api/favorites/traveler/${travelerId}`, { 
      params: { page, limit } 
    }),
  check: (propertyId) => api.get(`/api/favorites/check/${propertyId}`),
};

export default api;
