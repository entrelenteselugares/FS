import axios from "axios";

// Sempre usa caminhos relativos — o vercel.json roteia /api/* para o backend.
// Isso elimina erros de CORS pois frontend e backend compartilham o mesmo domínio.
const baseURL = "/api";

export const API = axios.create({ 
  baseURL 
});

// Flag para evitar múltiplas tentativas simultâneas de refresh
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Adiciona interceptor para injetar o token JWT em todas as requisições
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("fs_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta para tratar expiração (401)
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const originalRequest = config;

    // Se o erro for 401 e não for uma tentativa de login ou refresh
    if (response?.status === 401 && !originalRequest._retry && !config.url.includes("/auth/login") && !config.url.includes("/auth/refresh")) {
      
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(API(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("fs_refresh_token");
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        localStorage.setItem("fs_token", data.token);
        localStorage.setItem("fs_refresh_token", data.refreshToken);
        
        isRefreshing = false;
        onRefreshed(data.token);
        
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return API(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        // Se falhar o refresh, desloga o usuário (limpa tokens)
        localStorage.removeItem("fs_token");
        localStorage.removeItem("fs_refresh_token");
        window.location.href = "/login?session=expired";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
