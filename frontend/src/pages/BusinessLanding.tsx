import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { T } from "../lib/theme";
import { DICT } from "../lib/dictionary";
import { Navbar } from "../components/Navbar";
import { Building2, Cpu, Globe, ArrowRight, Star } from "lucide-react";

export const BusinessLanding = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: "A",
      title: DICT.CAT_A_TITLE,
      desc: DICT.CAT_A_DESC,
      icon: <Globe size={32} color={T.brand} />,
      cta: "Seja um Franqueado",
      color: "#D4AF37", // Gold
      link: "/register?role=FRANCHISEE"
    },
    {
      id: "B",
      title: DICT.CAT_B_TITLE,
      desc: DICT.CAT_B_DESC,
      icon: <Cpu size={32} color={T.brand} />,
      cta: "Contratar Phygital",
      color: "#8E8E8E", // Silver
      link: "/cotacao?type=PHYGITAL"
    },
    {
      id: "C",
      title: DICT.CAT_C_TITLE,
      desc: DICT.CAT_C_DESC,
      icon: <Building2 size={32} color={T.brand} />,
      cta: "Soluções Corporativas",
      color: "#CD7F32", // Bronze/Tactical
      link: "/cotacao?type=CORPORATE"
    }
  ];

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: "100vh", fontFamily: T.fontB }}>
      <Helmet>
        <title>Negócios & Parcerias | Foto Segundo</title>
        <meta name="description" content={DICT.BIZ_DESC} />
      </Helmet>

      <Navbar />

      {/* Hero Section */}
      <section style={{ padding: "80px 28px 60px", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 10, fontFamily: T.fontB, fontWeight: 500, letterSpacing: "0.4em", textTransform: "uppercase", color: T.brand, marginBottom: 24 }}>
          {DICT.BIZ_TAGLINE}
        </p>
        <h1 style={{ 
          fontFamily: T.fontD, fontWeight: 900, fontSize: "clamp(42px, 8vw, 72px)", 
          lineHeight: 1, textTransform: "uppercase", marginBottom: 32 
        }}>
          {DICT.BIZ_TITLE}
          <span style={{ fontStyle: "italic", color: T.brand }}>{DICT.BIZ_TITLE_ITALIC}</span>
        </h1>
        <p style={{ fontSize: 16, color: T.text2, maxWidth: 600, margin: "0 auto 48px", lineHeight: 1.6, fontWeight: 300 }}>
          {DICT.BIZ_DESC}
        </p>
      </section>

      {/* Categories Grid */}
      <section style={{ padding: "0 28px 100px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
          gap: 24 
        }}>
          {categories.map((cat) => (
            <div 
              key={cat.id}
              onClick={() => navigate(cat.link)}
              style={{ 
                background: T.bgCard, 
                border: `1px solid ${T.border}`, 
                padding: 48,
                display: "flex",
                flexDirection: "column",
                gap: 24,
                cursor: "pointer",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = T.brand;
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ 
                position: "absolute", top: -20, right: -20, opacity: 0.05,
                transform: "rotate(45deg)"
              }}>
                <Star size={120} color={T.brand} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {cat.icon}
                <span style={{ 
                  fontFamily: T.fontD, fontWeight: 900, fontSize: 14, 
                  color: T.brand, letterSpacing: 3 
                }}>PILAR {cat.id}</span>
              </div>

              <h3 style={{ 
                fontFamily: T.fontD, fontWeight: 900, fontSize: 32, 
                textTransform: "uppercase", margin: 0, lineHeight: 1 
              }}>
                {cat.title}
              </h3>

              <p style={{ 
                fontSize: 14, color: T.text3, lineHeight: 1.6, 
                fontWeight: 300, minHeight: 80 
              }}>
                {cat.desc}
              </p>

              <div style={{ 
                marginTop: "auto", display: "flex", alignItems: "center", 
                gap: 12, color: T.text, fontSize: 12, fontWeight: 500, 
                textTransform: "uppercase", letterSpacing: 2 
              }}>
                {cat.cta} <ArrowRight size={16} color={T.brand} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Shortcut / CTA */}
      <section style={{ padding: "80px 28px", background: T.bgCard, borderTop: `1px solid ${T.border}`, textAlign: "center" }}>
        <h2 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 32, textTransform: "uppercase", marginBottom: 16 }}>
          Pronto para escalar seu negócio?
        </h2>
        <p style={{ color: T.text3, marginBottom: 40, maxWidth: 500, margin: "0 auto 40px" }}>
          Junte-se ao ecossistema que está redefinindo o padrão da fotografia editorial no Brasil.
        </p>
        <button 
          onClick={() => navigate("/contato")}
          style={{ 
            background: T.brand, color: T.brandText, border: "none", 
            padding: "16px 40px", fontFamily: T.fontD, fontWeight: 900, 
            letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" 
          }}
        >
          Falar com um Consultor
        </button>
      </section>

      {/* Basic Footer */}
      <footer style={{ padding: "40px 28px", textAlign: "center", borderTop: `1px solid ${T.border}` }}>
        <p style={{ fontSize: 10, color: T.text3, letterSpacing: 1 }}>
          {DICT.FOOTER_COPYRIGHT}
        </p>
      </footer>
    </div>
  );
};
