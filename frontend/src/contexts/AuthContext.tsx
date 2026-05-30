import React, { useState, useEffect } from "react";
import { API } from "../lib/api";
import { AuthContext, type AuthUser } from "./AuthContextBase";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<string | null>(() => {
    return localStorage.getItem("fs_active_role");
  });

  const logout = async () => {
    try {
      await API.post("/auth/logout");
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem("fs_active_role");
    setToken(null);
    setUser(null);
    setActiveRole(null);
    window.location.href = "/login";
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Tenta buscar o usuário atual (os cookies serão enviados automaticamente)
        const r = await API.get("/auth/me");
        if (r.data && r.data.nome) {
          setUser(r.data);
          // O token exato não está mais disponível no frontend (HttpOnly), 
          // usaremos um valor "dummy" apenas para manter a tipagem do Context feliz
          setToken("cookie-session");
        }
      } catch (err: unknown) {
        // Se falhar (ex: 401), não está logado
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);



  const switchRole = (role: string) => {
    setActiveRole(role);
    localStorage.setItem("fs_active_role", role);
    // Redirecionamento baseado no papel
    if (role === "ADMIN") window.location.href = "/admin";
    else if (role === "FRANCHISEE") window.location.href = "/franquia";
    else if (role === "PROFISSIONAL" || role === "CARTORIO" || role === "UNIDADE") window.location.href = "/minha-conta";
    else window.location.href = "/";
  };

  const login = async (email: string, senha: string) => {
    await API.post("/auth/login", { email, senha });
    
    // Fetch full user object
    const meResponse = await API.get("/auth/me");
    const fullUser = meResponse.data;
    
    setToken("cookie-session");
    setUser(fullUser);
    return fullUser as AuthUser;
  };

  const register = async (email: string, senha: string, nome: string) => {
    await API.post("/auth/register", { email, senha, nome });
    
    const meResponse = await API.get("/auth/me");
    const fullUser = meResponse.data;

    setToken("cookie-session");
    setUser(fullUser);
    return fullUser as AuthUser;
  };

  const registerExpress = async (email: string, senha: string, nome?: string, whatsapp?: string) => {
    await API.post("/auth/register-express", { email, senha, nome, whatsapp });
    
    const meResponse = await API.get("/auth/me");
    const fullUser = meResponse.data;

    setToken("cookie-session");
    setUser(fullUser);
    return fullUser as AuthUser;
  };

  const updateMe = async (data: Partial<AuthUser>) => {
    const r = await API.patch("/auth/me", data);
    setUser(r.data);
    return r.data;
  };

  const applyRole = async (payload: { role: string; equipment?: string; razaoSocial?: string; cnpj?: string }) => {
    const r = await API.post("/auth/apply-role", payload);
    const me = await API.get("/auth/me");
    setUser(me.data);
    return r.data;
  };

  const effectiveRole = activeRole || user?.role || null;

  return (
    <AuthContext.Provider value={{ user, token, login, register, registerExpress, updateMe, applyRole, switchRole, logout, loading, activeRole: effectiveRole }}>
      {children}
    </AuthContext.Provider>
  );
};
