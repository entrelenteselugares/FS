import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { API } from "../lib/api";
import { T, BtnPrimary, FieldLabel, FieldInput } from "../lib/theme";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // O Supabase coloca o token no hash da URL (#access_token=...)
  // Se não houver hash, redirecionamos para o login
  useEffect(() => {
    if (!window.location.hash) {
      navigate("/login");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      return setMessage({ type: "error", text: "A senha deve ter pelo menos 6 caracteres." });
    }
    if (password !== confirmPassword) {
      return setMessage({ type: "error", text: "As senhas não coincidem." });
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Extrai o access_token do hash da URL (#access_token=XXX&...)
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get("access_token");

      if (!token) {
        return setMessage({ type: "error", text: "Token de recuperação ausente. Solicite um novo link." });
      }

      await API.post("/auth/update-password", { password, token });
      setMessage({ type: "success", text: "Senha alterada com sucesso! Redirecionando..." });
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? (err.response?.data?.error ?? "Erro ao atualizar senha. O link pode ter expirado.")
        : "Erro ao atualizar senha.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400, background: T.bgCard, border: `1px solid ${T.border}`, padding: 40, textAlign: "center" }}>
        <img src="/logo-fs.png" alt="Foto Segundo" style={{ height: 30, marginBottom: 30 }} />
        
        <h1 style={{ fontFamily: T.fontD, fontSize: 24, fontWeight: 900, textTransform: "uppercase", color: T.text, margin: "0 0 10px" }}>
          Nova Senha
        </h1>
        <p style={{ fontSize: 12, color: T.text2, marginBottom: 30 }}>
          Digite sua nova senha de acesso abaixo.
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={FieldLabel}>Nova Senha</label>
            <input 
              type="password" 
              style={FieldInput} 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label style={FieldLabel}>Confirmar Senha</label>
            <input 
              type="password" 
              style={FieldInput} 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {message.text && (
            <div style={{ 
              padding: 12, 
              fontSize: 11, 
              fontWeight: 700,
              background: message.type === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(133, 185, 172, 0.1)",
              border: `1px solid ${message.type === "error" ? "#ef444433" : "#85b9ac33"}`,
              color: message.type === "error" ? "#ef4444" : T.brand,
              textAlign: "center"
            }}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{ ...BtnPrimary, width: "100%", justifyContent: "center", marginTop: 10 }}
          >
            {loading ? "ATUALIZANDO..." : "REDEFINIR SENHA"}
          </button>
        </form>
      </div>
    </div>
  );
}
