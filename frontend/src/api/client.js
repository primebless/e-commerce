import axios from 'axios';

const getViteEnv = () => {
  try {
    return (0, eval)('import.meta.env') || {};
  } catch {
    return {};
  }
};

// Shared API client configured with backend base URL.
const api = axios.create({
  baseURL: getViteEnv().VITE_API_URL || process.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth');
  if (raw) {
    const auth = JSON.parse(raw);
    if (auth?.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
  }
  return config;
});

export default api;
