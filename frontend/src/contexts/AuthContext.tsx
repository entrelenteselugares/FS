import React, { useState, useEffect } from "react";
import { API } from "../lib/api";
import { supabase } from "../lib/supabase";
import { AuthContext, type AuthUser } from "./AuthContextBase";
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
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
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("fs_active_role");
    setToken(null);
    setUser(null);
    setActiveRole(null);
    window.location.href = "/login";
  };

  // Keep localStorage token synchronized with state
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    const initAuth = async () => {
      // Se a URL contiver hashes de autenticação do Supabase (OAuth), pulamos o /auth/me inicial
      // para evitar que o app conclua o loading como null e cause redirecionamentos desnecessários
      if (window.location.hash.includes("access_token=") || window.location.href.includes("access_token=")) {
        return;
      }

      try {
        const r = await API.get("/auth/me");
        if (r.data && r.data.nome) {
          setUser(r.data);
          if (!localStorage.getItem("token")) {
            localStorage.setItem("token", "cookie-session");
            setToken("cookie-session");
          }
        }
      } catch (err: unknown) {
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          // Quando logar pelo Google (ou magic link), sincroniza com o backend customizado
          setLoading(true);
          try {
            const { data } = await API.post("/auth/oauth-callback", { 
              access_token: session.access_token 
            });
            if (data.token) {
              localStorage.setItem("token", data.token);
              localStorage.setItem("refreshToken", data.refreshToken || "");
              setToken(data.token);
            } else {
              localStorage.setItem("token", "cookie-session");
              localStorage.setItem("refreshToken", "cookie-session");
              setToken("cookie-session");
            }
            setUser(data.user);
          } catch (e) {
            console.error("Erro no callback oauth", e);
          } finally {
            setLoading(false);
          }
        }
        if (event === "SIGNED_OUT") {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          setToken(null);
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
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
    const res = await API.post("/auth/login", { email, senha });
    
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("refreshToken", res.data.refreshToken || "");
      setToken(res.data.token);
    } else {
      localStorage.setItem("token", "cookie-session");
      localStorage.setItem("refreshToken", "cookie-session");
      setToken("cookie-session");
    }
    
    // Fetch full user object
    const meResponse = await API.get("/auth/me");
    const fullUser = meResponse.data;
    
    setUser(fullUser);
    return fullUser as AuthUser;
  };

  const register = async (email: string, senha: string, nome: string) => {
    const res = await API.post("/auth/register", { email, senha, nome });
    
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("refreshToken", res.data.refreshToken || "");
      setToken(res.data.token);
    } else {
      localStorage.setItem("token", "cookie-session");
      localStorage.setItem("refreshToken", "cookie-session");
      setToken("cookie-session");
    }

    const meResponse = await API.get("/auth/me");
    const fullUser = meResponse.data;

    setUser(fullUser);
    return fullUser as AuthUser;
  };

  const registerExpress = async (email: string, senha: string, nome?: string, whatsapp?: string) => {
    const res = await API.post("/auth/register-express", { email, senha, nome, whatsapp });
    
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("refreshToken", res.data.refreshToken || "");
      setToken(res.data.token);
    } else {
      localStorage.setItem("token", "cookie-session");
      localStorage.setItem("refreshToken", "cookie-session");
      setToken("cookie-session");
    }

    const meResponse = await API.get("/auth/me");
    const fullUser = meResponse.data;

    setUser(fullUser);
    return fullUser as AuthUser;
  };

  const loginWithGoogle = async () => {
    const isNative = Capacitor.isNativePlatform();
    const redirectTo = isNative ? "com.fotosegundo.app://auth-callback" : window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: isNative,
      },
    });
    if (error) throw error;

    if (isNative && data?.url) {
      await Browser.open({ url: data.url });
    }
  };

  const loginWithApple = async () => {
    const isNative = Capacitor.isNativePlatform();
    const redirectTo = isNative ? "com.fotosegundo.app://auth-callback" : window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo,
        skipBrowserRedirect: isNative,
      },
    });
    if (error) throw error;

    if (isNative && data?.url) {
      await Browser.open({ url: data.url });
    }
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
    <AuthContext.Provider value={{ user, token, login, register, registerExpress, loginWithGoogle, loginWithApple, updateMe, applyRole, switchRole, logout, loading, activeRole: effectiveRole }}>
      {children}
    </AuthContext.Provider>
  );
};
