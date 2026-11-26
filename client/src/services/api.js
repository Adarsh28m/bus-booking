import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', timeout: 30000 });
api.interceptors.request.use((c) => { const k = sessionStorage.getItem('adminKey'); if (k) c.headers['x-admin-key'] = k; return c; });
export const errMsg = (e) => e.response?.data?.message || 'Could not reach the server. Please try again.';
export default api;
