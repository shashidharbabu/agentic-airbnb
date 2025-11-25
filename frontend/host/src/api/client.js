import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_HOST_API || 'http://localhost:4000',
  withCredentials: true
})

// Add interceptor to include user ID from localStorage in headers
api.interceptors.request.use(
  (config) => {
    try {
      const userStr = localStorage.getItem('host_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          config.headers['X-User-ID'] = user.id;
        }
      }
    } catch (error) {
      console.error('Error adding user ID to request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api
