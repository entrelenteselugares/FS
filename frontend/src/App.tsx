import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { useAuth } from "./hooks/useAuth";
import { HelmetProvider } from "react-helmet-async";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BottomNav } from "./components/BottomNav";

import EventPage from "./pages/EventPage";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import ProfissionalDashboard from "./pages/ProfissionalDashboard";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import UnidadeFixaDashboard from "./pages/UnidadeFixaDashboard";
import { AuthSelectionPage } from "./pages/AuthSelectionPage";
import { RegisterPage } from "./pages/RegisterPage";
import ClienteArea from "./pages/ClienteArea";
import { QuotePage } from "./pages/QuotePage";
import { PartnerLP } from "./pages/PartnerLP";
import { NotFoundPage } from "./pages/NotFoundPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LuxuryExperiencePage from "./pages/LuxuryExperiencePage";
import PhygitalCapture from "./pages/PhygitalCapture";
import PrintMonitor from "./pages/PrintMonitor";
import FranchiseDashboard from "./pages/franchise/FranchiseDashboard";
import VaultsPage from "./pages/VaultsPage";
import VaultDetailPage from "./pages/VaultDetailPage";
import InvitationPage from "./pages/InvitationPage";
import { BusinessLanding } from "./pages/BusinessLanding";
import FlashUnlockPage from "./pages/FlashUnlockPage";
import { ClubLandingPage } from "./pages/ClubLandingPage";
import HelpPage from "./pages/HelpPage";
import { useState, useEffect } from "react";
import { API as api } from "./lib/api";
import { T } from "./lib/theme";
import { motion, AnimatePresence } from "framer-motion";

/** Redireciona /dashboard para o painel correto baseado no role */
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const map: Record<string, string> = {
    ADMIN:        "/admin",
    PROFISSIONAL: "/profissional",
    CARTORIO:     "/unidade-fixa",
    UNIDADE:      "/unidade-fixa",
    FRANCHISEE:   "/franquia",
    CLIENTE:      "/minha-conta",
  };
  return <Navigate to={map[user.role] || "/"} replace />;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  // Safety: Clear body overflow on every route change to prevent stuck overlays
  useEffect(() => {
    document.body.style.overflow = "unset";
  }, [location]);
  
  // Evita desmontagem completa do DashboardLayout ao transitar entre rotas internas da mesma área
  const getAnimationKey = (path: string) => {
    if (path.startsWith("/minha-conta") || path.startsWith("/meus-albuns")) return "cliente-area";
    if (path.startsWith("/admin")) return "admin-area";
    if (path.startsWith("/profissional")) return "profissional-area";
    if (path.startsWith("/unidade-fixa")) return "unidade-area";
    if (path.startsWith("/franquia")) return "franquia-area";
    return path;
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={getAnimationKey(location.pathname)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full pb-20 md:pb-0"
      >
        <Routes location={location}>
        {/* Público */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/e/:slug" element={<EventPage />} />
        <Route path="/auth" element={<AuthSelectionPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/cotacao" element={<QuotePage />} />
        {/* 
        <Route path="/hall-da-fama" element={<HallOfFame />} />
        <Route path="/concursos" element={<HallOfFame />} /> 
        */}
        <Route path="/p/:slug" element={<PartnerLP />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/:orderId" element={<CheckoutPage />} />
        <Route path="/delivery/:id" element={<LuxuryExperiencePage />} />
        <Route path="/captura" element={<PhygitalCapture />} />
        <Route path="/phygital-capture" element={<PhygitalCapture />} />
        <Route path="/negocios" element={<BusinessLanding />} />
        <Route path="/clube" element={<ClubLandingPage />} />
        <Route path="/flash/:shortId" element={<FlashUnlockPage />} />
        <Route path="/ajuda" element={<HelpPage />} />

        {/* Redireciona para o painel correto */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardRedirect /></ProtectedRoute>
        } />

        {/* Painel do Admin */}
        <Route path="/admin/*" element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Painel do Profissional (PROFISSIONAIS) */}
        <Route path="/profissional" element={
          <ProtectedRoute roles={["ADMIN", "PROFISSIONAL", "FRANCHISEE"]}>
            <ProfissionalDashboard />
          </ProtectedRoute>
        } />
        <Route path="/profissional/monitor/:eventId" element={
          <ProtectedRoute roles={["ADMIN", "PROFISSIONAL", "FRANCHISEE", "CARTORIO"]}>
            <PrintMonitor />
          </ProtectedRoute>
        } />

        {/* Painel Unidades Fixas */}
        <Route path="/unidade-fixa" element={
          <ProtectedRoute roles={["ADMIN", "CARTORIO", "UNIDADE"]}>
            <UnidadeFixaDashboard />
          </ProtectedRoute>
        } />

        {/* Painel da Franquia (B2B Hub) */}
        <Route path="/franquia" element={
          <ProtectedRoute roles={["ADMIN", "FRANCHISEE"]}>
            <FranchiseDashboard />
          </ProtectedRoute>
        } />

        {/* Área do Cliente / Minha Conta */}
        <Route path="/minha-conta" element={
          <ProtectedRoute roles={["ADMIN", "CLIENTE", "PROFISSIONAL", "CARTORIO", "UNIDADE"]}>
            <ClienteArea />
          </ProtectedRoute>
        }
        />

        {/* Meus Álbuns (Fase 11) */}
        <Route path="/meus-albuns" element={
          <ProtectedRoute>
            <VaultsPage />
          </ProtectedRoute>
        } />
        <Route path="/meus-albuns/:vaultId" element={
          <ProtectedRoute>
            <VaultDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/invitation/:code" element={<InvitationPage />} />

        {/* Home e 404 */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />

      </Routes>
    </motion.div>
    </AnimatePresence>
  );
};

function App() {
  const [isWakingUp, setIsWakingUp] = useState(true);

  useEffect(() => {
    const wakeUp = async () => {
      try {
        await api.get("/health");
      } catch (err) {
        console.warn("[WakeUp] Falha ao acordar o servidor, tentando novamente...", err);
      } finally {
        setIsWakingUp(false);
      }
    };
    wakeUp();
  }, []);

  return (
    <ThemeProvider>
      {isWakingUp ? (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 relative overflow-hidden transition-colors duration-700" style={{ background: T.bg }}>
          <div className="absolute inset-0 bg-brand-tactical/5 blur-[120px] rounded-full -m-64 opacity-20" />
          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-brand-tactical to-transparent" />
            <div className="text-[18px] font-black uppercase tracking-[0.8em] italic" style={{ color: T.text }}>FOTO SEGUNDO</div>
            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-tactical animate-pulse-soft">Sincronizando Rede Global</div>
            <div className="w-px h-16 bg-gradient-to-t from-transparent via-brand-tactical to-transparent" />
          </div>
        </div>
      ) : (
        <AuthProvider>
          <CartProvider>
            <HelmetProvider>
              <Router>
                <AnimatedRoutes />
                <BottomNav />
              </Router>
            </HelmetProvider>
          </CartProvider>
        </AuthProvider>
      )}
    </ThemeProvider>
  );
}

export default App;
