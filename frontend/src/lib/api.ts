import axios from "axios";

// Sempre usa caminhos relativos — o vercel.json roteia /api/* para o backend.
// Isso elimina erros de CORS pois frontend e backend compartilham o mesmo domínio.
const baseURL = "/api";

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
