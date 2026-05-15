import React, { useState, useEffect } from "react";
import { API } from "../lib/api";
import { AuthContext, type AuthUser } from "./AuthContextBase";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("fs_token");
    localStorage.removeItem("fs_refresh_token");
    delete API.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      const stored = localStorage.getItem("fs_token");
      const refresh = localStorage.getItem("fs_refresh_token");

      if (stored) {
        API.defaults.headers.common["Authorization"] = `Bearer ${stored}`;
        try {
          const r = await API.get("/auth/me");
          if (r.data && r.data.nome) {
            setUser(r.data);
            setToken(stored);
          }
        } catch (err: unknown) {
          const axiosError = err as { response?: { status: number } };
          // Se falhou por expiração e temos refresh token, tenta renovar
          if (axiosError.response?.status === 401 && refresh) {
            try {
              const { data } = await API.post("/auth/refresh", { refreshToken: refresh });
              localStorage.setItem("fs_token", data.token);
              localStorage.setItem("fs_refresh_token", data.refreshToken);
              API.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
              
              const meResponse = await API.get("/auth/me");
              setUser(meResponse.data);
              setToken(data.token);
            } catch {
              logout();
            }
          } else {
            logout();
          }
        }
      }
      setLoading(false);
    };
    
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, senha: string) => {
    const { data } = await API.post("/auth/login", { email, senha });
    localStorage.setItem("fs_token", data.token);
    localStorage.setItem("fs_refresh_token", data.refreshToken);
    API.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);
    return data.user as AuthUser;
  };

  const register = async (email: string, senha: string, nome: string) => {
    const { data } = await API.post("/auth/register", { email, senha, nome });
    localStorage.setItem("fs_token", data.token);
    localStorage.setItem("fs_refresh_token", data.refreshToken);
    API.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);
    return data.user as AuthUser;
  };

  const registerExpress = async (email: string, senha: string, nome?: string, whatsapp?: string) => {
    const { data } = await API.post("/auth/register-express", { email, senha, nome, whatsapp });
    localStorage.setItem("fs_token", data.token);
    localStorage.setItem("fs_refresh_token", data.refreshToken);
    API.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);
    return data.user as AuthUser;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, registerExpress, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
