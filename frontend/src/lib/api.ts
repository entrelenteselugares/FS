import axios from "axios";

// Em produção usa a URL do backend na Vercel
// Em desenvolvimento usa o proxy do Vite (/api -> localhost:3001)
const baseURL = import.meta.env.PROD
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

export const API = axios.create({ 
  baseURL 
});

// Adiciona interceptor para injetar o token JWT em todas as requisições
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("fs_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
