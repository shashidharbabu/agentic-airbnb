import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_HOST_API || 'http://localhost:4000',
  withCredentials: true
})

export default api
