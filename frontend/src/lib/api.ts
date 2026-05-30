import axios from "axios";

// Sempre usa caminhos relativos — o vercel.json roteia /api/* para o backend.
// Isso elimina erros de CORS pois frontend e backend compartilham o mesmo domínio.
const baseURL = "/api";

export const API = axios.create({ 
  baseURL,
  withCredentials: true // Serverless-Native: Utiliza HTTP-Only cookies para segurança
});

// Flag para evitar múltiplas tentativas simultâneas de refresh
let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

const onRefreshed = (success: boolean) => {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
};

// Interceptor de resposta para tratar expiração (401)
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const originalRequest = config;

    // Se o erro for 401 e não for uma tentativa de login ou refresh
    if (response?.status === 401 && !originalRequest._retry && !config.url.includes("/auth/login") && !config.url.includes("/auth/refresh")) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((success: boolean) => {
            if (success) {
              resolve(API(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Tenta renovar os cookies chamando o endpoint de refresh
        await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        
        isRefreshing = false;
        onRefreshed(true);
        
        // Repete a requisição original (os novos cookies serão enviados automaticamente)
        return API(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshed(false);
        
        const currentPath = window.location.pathname;
        if (!currentPath.includes("/login") && !currentPath.includes("/register")) {
          window.location.href = "/login?session=expired";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
