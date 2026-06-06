import { useEffect, useState } from "react";
import { API as api } from "../../lib/api";
import { CheckCircle2, Lock, Target, ThumbsUp, ThumbsDown, Camera } from "lucide-react";

export function AlbumMissionsTab() {
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [pendingCommunity, setPendingCommunity] = useState<any[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | null>>({});

  useEffect(() => {
    fetchData();
    fetchCommunity();
  }, []);

  const fetchData = () => {
    setLoading(true);
    api.get("/worldcup/missions")
      .then(({ data }) => {
        setMissions(data.missions);
        setProgress(data.progress || []);
      })
      .finally(() => setLoading(false));
  };

  const fetchCommunity = () => {
    api.get("/worldcup/community/pending")
      .then(({ data }) => {
        setPendingCommunity(data.pending || []);
      });
  };

  const handleQuizSubmit = (slotId: string, answerIndex: number, slotIndex: number) => {
    api.post("/worldcup/missions/quiz", { slotId, answerIndex })
      .then(() => {
        alert("Resposta correta! Missão desbloqueada.");
        setSelectedAnswers(prev => { const next = { ...prev }; delete next[slotIndex]; return next; });
        fetchData();
      })
      .catch((err) => {
        alert(err.response?.data?.error || "Resposta incorreta. Tente novamente.");
      });
  };

  const handlePhotoUpload = (slotId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Em um ambiente real faríamos upload pro S3/Supabase aqui.
      // Para demonstração, mandamos o base64 (limite de tamanho pode ser um problema, mas simulamos)
      api.post("/worldcup/missions/upload", { slotId, imageUrl: base64 })
        .then(() => {
          alert("Foto enviada para validação da comunidade!");
          fetchData();
        })
        .catch(() => {
          alert("Erro ao enviar foto.");
        });
    };
    reader.readAsDataURL(file);
  };

  const handleCommunityVote = (slotId: string, isApproved: boolean) => {
    api.post(`/worldcup/community/validate/${slotId}`, { isApproved })
      .then(() => {
        alert("Voto computado com sucesso! Obrigado por ajudar a comunidade.");
        fetchCommunity();
      })
      .catch(() => {
        alert("Erro ao computar voto.");
      });
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40, color: "#10b981" }}>Carregando missões...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      
      {/* SEÇÃO COMUNIDADE */}
      {pendingCommunity.length > 0 && (
        <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Users size={20} color="#10b981" />
            <h3 style={{ fontSize: 16, fontWeight: 900, color: "white", textTransform: "uppercase", fontStyle: "italic", margin: 0 }}>
              Ajudar a Comunidade
            </h3>
          </div>
          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16, lineHeight: 1.5 }}>
            Ganhe pontos validando as fotos de outros torcedores. A foto abaixo cumpre a missão requerida?
          </p>
          
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
            {pendingCommunity.map(pc => (
              <div key={pc.id} style={{ minWidth: 260, background: "rgba(0,0,0,0.4)", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, background: "rgba(255,255,255,0.03)" }}>
                  <img src={pc.userAvatar} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>{pc.userName}</span>
                </div>
                <img src={pc.imageUrl} alt="" style={{ width: "100%", height: 180, objectFit: "cover" }} />
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#10b981", fontWeight: 900, textTransform: "uppercase", marginBottom: 4 }}>
                    Missão: {pc.missionTitle}
                  </div>
                  <div style={{ fontSize: 11, color: "#d1d5db", marginBottom: 12 }}>{pc.missionDesc}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleCommunityVote(pc.id, true)} style={{ flex: 1, padding: "8px", background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", fontWeight: 700 }}>
                      <ThumbsUp size={14} /> Sim
                    </button>
                    <button onClick={() => handleCommunityVote(pc.id, false)} style={{ flex: 1, padding: "8px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", fontWeight: 700 }}>
                      <ThumbsDown size={14} /> Não
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MISSÕES DO USUÁRIO */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Target size={20} color="#fbbf24" />
          <h3 style={{ fontSize: 16, fontWeight: 900, color: "white", textTransform: "uppercase", fontStyle: "italic", margin: 0 }}>
            Suas Missões
          </h3>
        </div>
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 24, lineHeight: 1.5 }}>
          Responda aos Quizzes para liberar as missões. Após o envio, a comunidade irá validar a sua foto. Cada foto aprovada rende pontos!
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {missions.map((mission, idx) => {
            const slot = progress.find(s => s.slotIndex === idx);
            const status = slot?.status || "LOCKED";
            const quizPassed = slot?.quizPassed || false;

            return (
              <div key={idx} style={{ 
                background: "rgba(255,255,255,0.03)", 
                border: "1px solid rgba(255,255,255,0.08)", 
                borderRadius: 8, 
                padding: 16,
                position: "relative",
                overflow: "hidden"
              }}>
                {status === "APPROVED" && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(16,185,129,0.1)", pointerEvents: "none" }} />
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: status === "APPROVED" ? "#10b981" : "#6b7280", textTransform: "uppercase" }}>
                    Slot {idx + 1}
                  </div>
                  {status === "LOCKED" && !quizPassed && <Lock size={14} color="#6b7280" />}
                  {status === "APPROVED" && <CheckCircle2 size={16} color="#10b981" />}
                </div>

                <div style={{ fontSize: 14, fontWeight: 900, color: "white", marginBottom: 4, fontStyle: "italic" }}>
                  {mission.missionTitle}
                </div>

                {!quizPassed ? (
                  // STATE 1: QUIZ
                  <div style={{ marginTop: 16, padding: 12, background: "rgba(0,0,0,0.3)", borderRadius: 4 }}>
                    <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700, marginBottom: 8 }}>QUIZ PARA DESBLOQUEAR:</div>
                    <div style={{ fontSize: 12, color: "white", marginBottom: 12 }}>{mission.quiz}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {mission.options.map((opt: string, oIdx: number) => (
                        <button
                          key={oIdx}
                          onClick={() => setSelectedAnswers(prev => ({ ...prev, [idx]: oIdx }))}
                          style={{
                            padding: "8px 12px",
                            textAlign: "left",
                            background: selectedAnswers[idx] === oIdx ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.05)",
                            border: `1px solid ${selectedAnswers[idx] === oIdx ? "#fbbf24" : "transparent"}`,
                            color: selectedAnswers[idx] === oIdx ? "#fbbf24" : "#d1d5db",
                            borderRadius: 4,
                            fontSize: 11,
                            cursor: "pointer"
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => slot ? handleQuizSubmit(slot.id, selectedAnswers[idx]!, idx) : null}
                      disabled={selectedAnswers[idx] == null || !slot}
                      style={{
                        marginTop: 12, width: "100%", padding: 10, background: selectedAnswers[idx] != null ? "#fbbf24" : "rgba(255,255,255,0.1)",
                        color: selectedAnswers[idx] != null ? "black" : "#6b7280", border: "none", borderRadius: 4,
                        fontWeight: 900, textTransform: "uppercase", fontSize: 10, cursor: selectedAnswers[idx] != null ? "pointer" : "not-allowed"
                      }}
                    >
                      Responder
                    </button>
                  </div>
                ) : (
                  // QUIZ PASSED
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12 }}>
                      <strong style={{ color: "white" }}>Missão:</strong> {mission.missionDesc}
                    </div>

                    {status === "APPROVED" && slot?.imageUrl ? (
                       <div style={{ position: "relative" }}>
                         <img src={slot.imageUrl} alt="" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 4, border: "2px solid #10b981" }} />
                         <div style={{ position: "absolute", bottom: 8, right: 8, background: "#10b981", color: "black", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 900 }}>APROVADO</div>
                       </div>
                    ) : status === "AWAITING_VALIDATION" && slot?.imageUrl ? (
                       <div style={{ position: "relative" }}>
                         <img src={slot.imageUrl} alt="" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 4, opacity: 0.5 }} />
                         <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgba(0,0,0,0.8)", padding: "8px 12px", borderRadius: 4, fontSize: 10, color: "#fbbf24", fontWeight: 900, textAlign: "center", width: "80%" }}>
                           AGUARDANDO<br/>COMUNIDADE
                         </div>
                       </div>
                    ) : (
                      // LOCKED OR REJECTED
                      <div>
                        {status === "REJECTED" && (
                          <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, marginBottom: 8 }}>
                            Sua última foto foi rejeitada. Tente novamente!
                          </div>
                        )}
                        <label style={{
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          height: 120, border: "1px dashed rgba(16,185,129,0.5)", background: "rgba(16,185,129,0.05)",
                          borderRadius: 4, cursor: "pointer", color: "#10b981", gap: 8
                        }}>
                          <Camera size={24} />
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Enviar Foto</span>
                          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => slot && handlePhotoUpload(slot.id, e)} />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Em um ambiente real, poderíamos importar `Users` do `lucide-react` mas vamos usar algo simples caso não tenha.
function Users({ size, color }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
}
