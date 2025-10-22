import axios from 'axios'

const agent = axios.create({
  baseURL: import.meta.env.VITE_AGENT_API || 'http://localhost:8000',
  withCredentials: false
})

export default agent
