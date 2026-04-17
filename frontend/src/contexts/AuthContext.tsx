import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: "ADMIN" | "CARTORIO" | "PROFISSIONAL" | "CLIENTE";
  mpUserId?: string | null;
  mpPublicKey?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("fs_token");
    if (stored) {
      API.defaults.headers.common["Authorization"] = `Bearer ${stored}`;
      API.get("/auth/me")
        .then((r) => { setUser(r.data); setToken(stored); })
        .catch(() => localStorage.removeItem("fs_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, senha: string) => {
    const { data } = await API.post("/auth/login", { email, senha });
    localStorage.setItem("fs_token", data.token);
    API.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);
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

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
};

export { API };
