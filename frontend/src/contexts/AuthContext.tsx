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
          setUser(r.data);
          setToken(stored);
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
    API.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);
    return data.user as AuthUser;
  };

  const logout = () => {
    localStorage.removeItem("fs_token");
    delete API.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
