import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { T, BtnPrimary, FieldInput, FieldLabel } from "../lib/theme";
import { Shield, Mail, Lock, User } from "lucide-react";

interface AuthModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onClose }) => {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, nome);
      }
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Erro na autenticação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: T.bg, border: `1px solid ${T.border}`, width: "100%", maxWidth: 400, padding: 40, position: "relative" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: T.text3, fontSize: 24, cursor: "pointer" }}>×</button>
        
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Shield size={32} style={{ color: T.brand, marginBottom: 16 }} />
          <h2 style={{ fontFamily: T.fontD, fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>
            {mode === "login" ? "Acesse sua conta" : "Criar Conta"}
          </h2>
          <p style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: 2, marginTop: 8 }}>Acesso Exclusivo à Galeria</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          <button 
            type="button" 
            onClick={loginWithGoogle}
            style={{ ...BtnPrimary, width: "100%", justifyContent: "center", background: "#fff", color: "#000", border: "1px solid #ccc" }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: T.border }}></div>
          <span style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: 1 }}>Ou use seu e-mail</span>
          <div style={{ flex: 1, height: 1, background: T.border }}></div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "register" && (
            <div>
              <label style={FieldLabel}>Nome Completo</label>
              <div style={{ position: "relative" }}>
                <User size={14} style={{ position: "absolute", left: 16, top: 18, color: T.text3 }} />
                <input style={{ ...FieldInput, paddingLeft: 48 }} value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" required />
              </div>
            </div>
          )}
          
          <div>
            <label style={FieldLabel}>E-mail</label>
            <div style={{ position: "relative" }}>
              <Mail size={14} style={{ position: "absolute", left: 16, top: 18, color: T.text3 }} />
              <input style={{ ...FieldInput, paddingLeft: 48 }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" style={FieldLabel}>Senha</label>
            <div style={{ position: "relative" }}>
              <Lock size={14} style={{ position: "absolute", left: 16, top: 18, color: T.text3 }} />
              <input id="auth-password" style={{ ...FieldInput, paddingLeft: 48 }} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua Senha" required />
            </div>
          </div>

          {error && <div style={{ fontSize: 10, color: "#ff4040", padding: 8, background: "#ff404011", border: "1px solid #ff404022" }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ ...BtnPrimary, width: "100%", justifyContent: "center", marginTop: 8 }}>
            {loading ? "PROCESSANDO..." : mode === "login" ? "ENTRAR" : "CRIAR CONTA"}
          </button>

          <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ background: "none", border: "none", color: T.text3, fontSize: 10, textTransform: "uppercase", cursor: "pointer", letterSpacing: 1, marginTop: 12 }}>
            {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
          </button>
        </form>
      </div>
    </div>
  );
};
