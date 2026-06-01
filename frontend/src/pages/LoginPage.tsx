import React, { useState, useEffect, useRef } from "react";
import { isAxiosError } from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Helmet } from "react-helmet-async";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sun, Moon } from "lucide-react";
import { API } from "../lib/api";
import { useTheme } from "../contexts/ThemeContextCore";

const ROLE_DESTINATIONS: Record<string, string> = {
  ADMIN:        "/admin",
  PROFISSIONAL: "/minha-conta?s=agenda",
  CARTORIO:     "/minha-conta?s=agenda",
  UNIDADE:      "/minha-conta?s=agenda",
  FRANCHISEE:   "/franquia",
  CLIENTE:      "/minha-conta",
};

// Fallback photos while API loads
const FALLBACK_PHOTOS = Array.from({ length: 18 }, (_, i) => ({
  id: `fallback-${i}`,
  url: null,
  title: "",
}));

interface PhotoItem {
  id: string;
  url: string | null;
  title: string;
}

// Animated photo column with infinite scroll
function PhotoColumn({ photos, speed, offset = 0 }: { photos: PhotoItem[]; speed: number; offset?: number }) {
  const colRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(offset);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const col = colRef.current;
    if (!col) return;

    const animate = () => {
      posRef.current -= speed;
      const half = col.scrollHeight / 2;
      if (Math.abs(posRef.current) >= half) {
        posRef.current = 0;
      }
      col.style.transform = `translateY(${posRef.current}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed, photos]);

  // Duplicate photos for seamless loop
  const doubled = [...photos, ...photos];

  return (
    <div className="flex-1 overflow-hidden relative">
      <div ref={colRef} className="flex flex-col gap-2">
        {doubled.map((photo, idx) => (
          <div
            key={`${photo.id}-${idx}`}
            className="relative rounded-2xl overflow-hidden flex-shrink-0 group"
            style={{ height: idx % 3 === 0 ? "260px" : idx % 3 === 1 ? "200px" : "180px" }}
          >
            {photo.url ? (
              <img
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-zinc-800/60 animate-pulse" />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ))}
      </div>
    </div>
  );
}

export const LoginPage: React.FC = () => {
  const [email,     setEmail]     = useState("");
  const [senha,     setSenha]     = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [photos,    setPhotos]    = useState<PhotoItem[]>(FALLBACK_PHOTOS);

  const { login }       = useAuth();
  const navigate        = useNavigate();
  const { toggle, isDark } = useTheme();

  // Fetch real photos from public events
  useEffect(() => {
    API.get("/public/events", { params: { limit: 30, page: 1 } })
      .then(({ data }) => {
        const events = Array.isArray(data) ? data : (data.events ?? data.data ?? []);
        const withCovers = events
          .filter((e: { coverPhotoUrl?: string | null }) => e.coverPhotoUrl)
          .map((e: { id: string; coverPhotoUrl: string; title?: string }) => ({ id: e.id, url: e.coverPhotoUrl, title: e.title ?? "" }));

        if (withCovers.length > 0) {
          // Repeat available covers to fill the grid nicely
          let repeated = [...withCovers];
          while (repeated.length < 18) {
            repeated = [...repeated, ...withCovers];
          }
          setPhotos(repeated.slice(0, 18));
        } else {
          // Use beautiful Unsplash fallbacks if no public events have covers
          const fallbacks = [
            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1530103862676-de8892bc952f?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1540039155732-d6749b9325f0?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800"
          ];
          let repeatedFallbacks = fallbacks.map((url, i) => ({ id: `fb-${i}`, url, title: "Foto Segundo" }));
          while (repeatedFallbacks.length < 18) {
            repeatedFallbacks = [...repeatedFallbacks, ...repeatedFallbacks];
          }
          setPhotos(repeatedFallbacks.slice(0, 18));
        }
      })
      .catch(() => {/* silently keep fallback */});
  }, []);

  // Distribute photos across 3 columns
  const col1 = photos.filter((_, i) => i % 3 === 0);
  const col2 = photos.filter((_, i) => i % 3 === 1);
  const col3 = photos.filter((_, i) => i % 3 === 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const authUser = await login(email.trim().toLowerCase(), senha);

      import("../lib/analytics").then(({ trackEvent, GA_EVENTS }) => {
        trackEvent(GA_EVENTS.LOGIN, { role: authUser.role, user_id: authUser.id });
      });

      const pending = localStorage.getItem("pending_purchase_event_id");
      if (pending) {
        localStorage.removeItem("pending_purchase_event_id");
        navigate(`/e/${pending}`);
        return;
      }

      navigate(ROLE_DESTINATIONS[authUser.role] ?? "/");
    } catch (err: unknown) {
      console.error("[LOGIN ERROR]", err);
      const msg = isAxiosError(err)
        ? (err.response?.data?.error ?? "Credenciais inválidas.")
        : "Erro ao autenticar. Tente novamente.";
      setError(typeof msg === "string" ? msg : "Acesso negado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-theme-bg">
      <Helmet>
        <title>Acesso — Foto Segundo</title>
      </Helmet>

      {/* ── LEFT: Animated Photo Mosaic ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Gradient overlays */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Top fade */}
          <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${isDark ? "from-black" : "from-stone-100"} to-transparent`} />
          {/* Bottom fade */}
          <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t ${isDark ? "from-black" : "from-stone-100"} to-transparent`} />
          {/* Right edge vignette → blends into form panel */}
          <div className={`absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l ${isDark ? "from-zinc-950" : "from-stone-100"} to-transparent`} />
          {/* Cyan tint overlay for brand color */}
          <div className="absolute inset-0 bg-brand-tactical/5 mix-blend-overlay" />
        </div>

        {/* Brand watermark on photo side */}
        <div className="absolute top-8 left-8 z-20">
          <Link to="/">
            <img
              src="/logo.png"
              alt="Foto Segundo"
              style={{ height: 28, objectFit: "contain", filter: isDark ? "brightness(0.5)" : "brightness(0.6)" }}
            />
          </Link>
        </div>

        {/* Tagline bottom-left */}
        <div className="absolute bottom-8 left-8 z-20">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 italic">
            Cada segundo conta.
          </p>
        </div>

        {/* 3 scrolling columns */}
        <div className="flex gap-2 p-2 w-full">
          <PhotoColumn photos={col1.length >= 2 ? col1 : FALLBACK_PHOTOS.slice(0, 6)} speed={0.4} offset={-80} />
          <PhotoColumn photos={col2.length >= 2 ? col2 : FALLBACK_PHOTOS.slice(6, 12)} speed={0.28} offset={-200} />
          <PhotoColumn photos={col3.length >= 2 ? col3 : FALLBACK_PHOTOS.slice(12, 18)} speed={0.5} offset={-40} />
        </div>
      </div>

      {/* ── RIGHT: Login Panel ── */}
      <div
        className={`
          w-full lg:w-[480px] xl:w-[520px] flex flex-col justify-between relative
          ${isDark ? "bg-zinc-950 border-l border-white/5" : "bg-white border-l border-black/5"}
          shadow-2xl h-screen overflow-y-auto
        `}
      >
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className={`
            absolute top-6 right-6 p-2.5 rounded-full transition-all z-10
            ${isDark
              ? "bg-white/5 hover:bg-white/10 text-white/50 hover:text-white"
              : "bg-black/5 hover:bg-black/10 text-black/40 hover:text-black"
            }
          `}
          title={isDark ? "Modo claro" : "Modo escuro"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Top: Logo */}
        <div className="pt-12 px-10 xl:px-14 pb-4">
          <div className="space-y-3">
            <Link to="/" className="inline-block">
              <img
                src="/logo.png"
                alt="Foto Segundo"
                style={{ height: 34, objectFit: "contain", filter: "var(--logo-filter)" }}
              />
            </Link>
            <div className="text-[9px] font-black text-brand-tactical uppercase tracking-[0.5em] italic">
              Portal de Acesso
            </div>
          </div>
        </div>

        {/* Center: Form */}
        <div className="flex-1 flex flex-col justify-center px-10 xl:px-14 py-8 space-y-10">
          {/* Heading */}
          <div>
            <h1 className={`text-4xl xl:text-5xl font-heading font-black uppercase italic leading-none tracking-tighter ${isDark ? "text-white" : "text-zinc-900"}`}>
              Efetuar
            </h1>
            <h1 className="text-4xl xl:text-5xl font-heading font-black uppercase italic leading-none tracking-tighter text-brand-tactical">
              Login
            </h1>
            <p className={`mt-3 text-[10px] font-medium uppercase tracking-widest ${isDark ? "text-white/30" : "text-zinc-400"}`}>
              Bem-vindo de volta ao sistema
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-[0.2em] p-4 text-center border border-red-500/20 rounded-xl">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className={`text-[9px] font-black uppercase tracking-[0.3em] ${isDark ? "text-white/40" : "text-zinc-400"}`}>
                Identificação
              </label>
              <div className={`relative flex items-center rounded-xl border transition-all ${isDark ? "bg-white/5 border-white/10 focus-within:border-brand-tactical/50" : "bg-zinc-50 border-zinc-200 focus-within:border-brand-tactical"}`}>
                <Mail className="absolute left-4 text-brand-tactical/60" size={14} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`w-full bg-transparent py-4 pl-11 pr-4 text-xs outline-none placeholder:opacity-30 ${isDark ? "text-white placeholder:text-white" : "text-zinc-800 placeholder:text-zinc-400"}`}
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className={`text-[9px] font-black uppercase tracking-[0.3em] ${isDark ? "text-white/40" : "text-zinc-400"}`}>
                  Chave de Acesso
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[8px] font-black uppercase tracking-widest text-brand-tactical hover:text-brand-tactical transition-colors italic"
                >
                  Esqueci a senha →
                </Link>
              </div>
              <div className={`relative flex items-center rounded-xl border transition-all ${isDark ? "bg-white/5 border-white/10 focus-within:border-brand-tactical/50" : "bg-zinc-50 border-zinc-200 focus-within:border-brand-tactical"}`}>
                <Lock className="absolute left-4 text-brand-tactical/60" size={14} />
                <input
                  type={showSenha ? "text" : "password"}
                  required
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className={`w-full bg-transparent py-4 pl-11 pr-12 text-xs outline-none placeholder:opacity-30 ${isDark ? "text-white placeholder:text-white" : "text-zinc-800 placeholder:text-zinc-400"}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className={`absolute right-4 transition-colors ${isDark ? "text-white/30 hover:text-white/60" : "text-zinc-400 hover:text-zinc-700"}`}
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-tactical text-zinc-950 hover:bg-white active:scale-[0.98] font-black uppercase tracking-[0.4em] text-[10px] py-5 transition-all flex items-center justify-center gap-3 group disabled:opacity-30 rounded-xl italic shadow-lg shadow-brand-tactical/20 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                  Validando acesso...
                </span>
              ) : (
                <>
                  Entrar no sistema
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom: Footer */}
        <div className={`px-10 xl:px-14 pb-8 pt-6 border-t flex flex-col gap-4 text-center ${isDark ? "border-white/5" : "border-zinc-100"}`}>
          <p className={`text-[8px] font-black uppercase tracking-[0.3em] ${isDark ? "text-white/20" : "text-zinc-400"}`}>
            Novo por aqui?{" "}
            <Link
              to="/registro"
              className={`ml-2 transition-all underline underline-offset-4 ${isDark ? "text-white/50 hover:text-brand-tactical decoration-white/10 hover:decoration-brand-tactical/50" : "text-zinc-600 hover:text-brand-tactical decoration-zinc-200"}`}
            >
              Solicitar Cadastro
            </Link>
          </p>
          <Link
            to="/"
            className={`text-[8px] font-black uppercase tracking-[0.4em] transition-all italic ${isDark ? "text-white/15 hover:text-white/40" : "text-zinc-300 hover:text-zinc-500"}`}
          >
            ← Voltar para a Vitrine
          </Link>
        </div>
      </div>
    </div>
  );
};
