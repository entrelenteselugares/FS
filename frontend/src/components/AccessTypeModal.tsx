import { useState } from "react";
import { API as api } from "../lib/api";

interface AccessTypeModalProps {
  orderId: string;
  eventTitle: string;
  onConfirmed: (accessType: string, expiresAt: string) => void;
}

const T = {
  bg:     "#0c0c0c",
  card:   "#111",
  border: "#1c1c1c",
  border2:"#2a2a2a",
  text:   "#f0ede8",
  text2:  "#999",
  text3:  "#555",
  accent: "#8a9a5b",
  fontD:  "'Barlow Condensed', sans-serif",
  fontB:  "'Inter', sans-serif",
};

export default function AccessTypeModal({ orderId, eventTitle, onConfirmed }: AccessTypeModalProps) {
  const [selected, setSelected] = useState<"PUBLIC" | "PRIVATE" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post(`/orders/${orderId}/access-type`, {
        accessType: selected,
      });
      onConfirmed(data.accessType, data.accessExpiresAt);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Erro ao salvar escolha.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: 24, fontFamily: T.fontB,
    }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, maxWidth: 480, width: "100%" }}>

        {/* Header */}
        <div style={{ padding: "24px 24px 0" }}>
          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: T.accent, marginBottom: 8 }}>
            Privacidade dos arquivos
          </p>
          <h2 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 28, color: "#fff", textTransform: "uppercase", lineHeight: 1, marginBottom: 8 }}>
            {eventTitle}
          </h2>
          <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.6, marginBottom: 24 }}>
            Escolha como seus arquivos serão armazenados. <strong style={{ color: T.text }}>Esta escolha é permanente e não pode ser alterada.</strong>
          </p>
        </div>

        {/* Opções */}
        <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>

          {/* PUBLIC */}
          <button
            onClick={() => setSelected("PUBLIC")}
            style={{
              background: selected === "PUBLIC" ? "#0f130a" : T.bg,
              border: `1px solid ${selected === "PUBLIC" ? T.accent : T.border2}`,
              padding: 16, textAlign: "left", cursor: "pointer", transition: "all .15s",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 18, height: 18, border: `2px solid ${selected === "PUBLIC" ? T.accent : T.border2}`,
                  borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {selected === "PUBLIC" && <div style={{ width: 8, height: 8, background: T.accent, borderRadius: "50%" }} />}
                </div>
                <span style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 17, color: "#fff", textTransform: "uppercase", letterSpacing: 1 }}>
                  Público
                </span>
              </div>
              <span style={{ fontSize: 10, background: "#0f130a", border: `1px solid ${T.accent}`, color: T.accent, padding: "3px 8px", letterSpacing: 1, textTransform: "uppercase" }}>
                90 dias
              </span>
            </div>
            <p style={{ fontSize: 12, color: T.text2, lineHeight: 1.6, marginLeft: 28 }}>
              Seu álbum aparece no portfólio público do Foto Segundo e pode ser acessado por qualquer pessoa via link.
              Você tem <strong style={{ color: T.text }}>90 dias</strong> para fazer o download completo.
            </p>
            <div style={{ marginLeft: 28, marginTop: 8, padding: "8px 10px", background: "rgba(138,154,91,0.08)", borderLeft: `2px solid ${T.accent}` }}>
              <p style={{ fontSize: 11, color: T.text3 }}>
                Ideal para compartilhar com família e convidados. O link pode ser enviado pelo WhatsApp.
              </p>
            </div>
          </button>

          {/* PRIVATE */}
          <button
            onClick={() => setSelected("PRIVATE")}
            style={{
              background: selected === "PRIVATE" ? "#1a0a0a" : T.bg,
              border: `1px solid ${selected === "PRIVATE" ? "#ef4444" : T.border2}`,
              padding: 16, textAlign: "left", cursor: "pointer", transition: "all .15s",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 18, height: 18, border: `2px solid ${selected === "PRIVATE" ? "#ef4444" : T.border2}`,
                  borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {selected === "PRIVATE" && <div style={{ width: 8, height: 8, background: "#ef4444", borderRadius: "50%" }} />}
                </div>
                <span style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 17, color: "#fff", textTransform: "uppercase", letterSpacing: 1 }}>
                  Privado
                </span>
              </div>
              <span style={{ fontSize: 10, background: "#1a0a0a", border: "1px solid #ef4444", color: "#ef4444", padding: "3px 8px", letterSpacing: 1, textTransform: "uppercase" }}>
                15 dias
              </span>
            </div>
            <p style={{ fontSize: 12, color: T.text2, lineHeight: 1.6, marginLeft: 28 }}>
              Seus arquivos ficam acessíveis apenas para você, com login. O link <strong style={{ color: T.text }}>não é público</strong>.
              Você tem <strong style={{ color: T.text }}>15 dias</strong> para fazer o download.
            </p>
            <div style={{ marginLeft: 28, marginTop: 8, padding: "8px 10px", background: "rgba(239,68,68,0.06)", borderLeft: "2px solid #ef4444" }}>
              <p style={{ fontSize: 11, color: T.text3 }}>
                Após 15 dias os arquivos são excluídos permanentemente e não podem ser recuperados.
              </p>
            </div>
          </button>
        </div>

        {/* LGPD disclaimer */}
        <div style={{ margin: "0 24px 20px", padding: "12px 14px", background: "#0a0a0a", border: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 11, color: T.text3, lineHeight: 1.6 }}>
            <strong style={{ color: T.text2 }}>LGPD — Lei 13.709/2018:</strong> Em conformidade com a legislação brasileira de proteção de dados, apenas o titular do pedido (e-mail cadastrado) pode acessar estes arquivos. Após o prazo escolhido, os dados são excluídos permanentemente de nossos servidores.
          </p>
        </div>

        {error && (
          <div style={{ margin: "0 24px 16px", padding: "10px 12px", background: "#1a0a0a", border: "1px solid #3a1a1a" }}>
            <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Botão confirmar */}
        <div style={{ padding: "0 24px 24px" }}>
          <button
            onClick={handleConfirm}
            disabled={!selected || saving}
            style={{
              width: "100%", padding: 14,
              background: selected ? T.accent : "#1a1a1a",
              color: selected ? "#0c0c0c" : T.text3,
              border: "none", fontFamily: T.fontD, fontWeight: 900,
              fontSize: 15, letterSpacing: 2, textTransform: "uppercase",
              cursor: selected ? "pointer" : "not-allowed",
            }}
          >
            {saving ? "Confirmando..." : selected ? `Confirmar — ${selected === "PUBLIC" ? "Público (90 dias)" : "Privado (15 dias)"}` : "Selecione uma opção"}
          </button>
          <p style={{ fontSize: 10, color: T.text3, textAlign: "center", marginTop: 8, letterSpacing: "0.5px" }}>
            Esta escolha é definitiva e não pode ser alterada posteriormente
          </p>
        </div>
      </div>
    </div>
  );
}
