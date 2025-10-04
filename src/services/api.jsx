
import axios from 'axios';

const api = axios.create({
  baseURL: "https://woopservice.infinityfreeapp.com/api",
  withCredentials: true, // false car tu utilises des tokens Bearer, pas les cookies Sanctum
  headers: {
    Accept: "application/json",
  },
});

// Ajout automatique du token dans les requêtes
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
