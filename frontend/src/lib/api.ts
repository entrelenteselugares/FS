import axios from "axios";
import { Capacitor } from "@capacitor/core";

// Sempre usa caminhos relativos na web para roteamento Vercel/Vite.
// No Capacitor (Nativo), o localhost do celular não possui backend, 
// então forçamos a URL oficial de produção.
export const baseURL = Capacitor.isNativePlatform() 
  ? "https://foto-segundo.vercel.app/api" 
  : "/api";

export const getAppUrl = () => {
  return Capacitor.isNativePlatform()
    ? "https://foto-segundo.vercel.app"
    : window.location.origin;
};

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

// Interceptor de requisição para injetar o token JWT (Fallback para Capacitor)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && token !== "cookie-session") {
    if (!config.headers) {
      config.headers = {} as any;
    }
    if (typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers["Authorization"] = `Bearer ${token}`;
      config.headers["authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor de resposta para tratar expiração (401)
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const originalRequest = config;

    // Se o erro for 401 e não for uma tentativa de login, refresh ou checagem de sessão (/auth/me)
    if (response?.status === 401 && !originalRequest._retry && !config.url.includes("/auth/login") && !config.url.includes("/auth/refresh") && !config.url.includes("/auth/me")) {
      
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
        const localRefreshToken = localStorage.getItem("refreshToken");
        // Tenta renovar os tokens chamando o endpoint de refresh enviando o refreshToken no body
        const refreshRes = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken: localRefreshToken
        }, { withCredentials: true });
        
        if (refreshRes.data.token) {
          localStorage.setItem("token", refreshRes.data.token);
          if (refreshRes.data.refreshToken) {
            localStorage.setItem("refreshToken", refreshRes.data.refreshToken);
          }
        }
        
        isRefreshing = false;
        onRefreshed(true);
        
        // Repete a requisição original
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
