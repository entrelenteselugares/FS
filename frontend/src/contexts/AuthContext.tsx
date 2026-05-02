import React, { useState, useEffect } from "react";
import { API } from "../lib/api";
import { AuthContext, type AuthUser } from "./AuthContextBase";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const stored = localStorage.getItem("fs_token");
      if (stored) {
        API.defaults.headers.common["Authorization"] = `Bearer ${stored}`;
        try {
          const r = await API.get("/auth/me");
          if (r.data && r.data.nome) {
            setUser(r.data);
            setToken(stored);
          } else {
            throw new Error("Dados de usuário inválidos");
          }
        } catch {
          localStorage.removeItem("fs_token");
          delete API.defaults.headers.common["Authorization"];
        }
      }
      setLoading(false);
    };
    
    initAuth();
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

  const logout = () => {
    localStorage.removeItem("fs_token");
    localStorage.removeItem("fs_refresh_token");
    delete API.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
