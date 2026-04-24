import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { T, BtnPrimary, FieldInput, FieldLabel } from "../lib/theme";
import { Shield, Mail, Lock, User } from "lucide-react";

interface AuthModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onClose }) => {
  const { login, register } = useAuth();
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
          <h2 style={{ fontFamily: T.fontD, fontSize: 24, fontWeight: 900, textTransform: "uppercase", color: T.text, margin: 0 }}>
            {mode === "login" ? "Identificação" : "Criar Conta"}
          </h2>
          <p style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: 2, marginTop: 8 }}>Acesso Exclusivo à Galeria</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "register" && (
            <div>
              <label style={FieldLabel}>Nome Completo</label>
              <div style={{ position: "relative" }}>
                <User size={14} style={{ position: "absolute", left: 16, top: 18, color: T.text3 }} />
                <input style={{ ...FieldInput, paddingLeft: 44 }} value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" required />
              </div>
            </div>
          )}
          
          <div>
            <label style={FieldLabel}>E-mail</label>
            <div style={{ position: "relative" }}>
              <Mail size={14} style={{ position: "absolute", left: 16, top: 18, color: T.text3 }} />
              <input style={{ ...FieldInput, paddingLeft: 44 }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>
          </div>

          <div>
            <label style={FieldLabel}>Senha</label>
            <div style={{ position: "relative" }}>
              <Lock size={14} style={{ position: "absolute", left: 16, top: 18, color: T.text3 }} />
              <input style={{ ...FieldInput, paddingLeft: 44 }} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
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
