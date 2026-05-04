import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import { HelmetProvider } from "react-helmet-async";
import { ProtectedRoute } from "./components/ProtectedRoute";

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
import LuxuryExperiencePage from "./pages/LuxuryExperiencePage";
import PhygitalCapture from "./pages/PhygitalCapture";
import PrintMonitor from "./pages/PrintMonitor";
import FranchiseDashboard from "./pages/franchise/FranchiseDashboard";
import { BusinessLanding } from "./pages/BusinessLanding";
import { useState, useEffect } from "react";
import { API as api } from "./lib/api";
import { T } from "./lib/theme";

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
  
  return (
    <div
      key={location.pathname}
      className="w-full h-full animate-reveal"
    >
      <Routes location={location}>
        {/* Público */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/e/:slug" element={<EventPage />} />
        <Route path="/auth" element={<AuthSelectionPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
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
        <Route path="/negocios" element={<BusinessLanding />} />

        {/* Redireciona para o painel correto */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardRedirect /></ProtectedRoute>
        } />

        {/* Painel do Admin */}
        <Route path="/admin" element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

        {/* Painel do Profissional (PROFISSIONAIS) */}
        <Route path="/profissional" element={
          <ProtectedRoute roles={["ADMIN", "PROFISSIONAL", "FRANCHISEE"]}>
            <ProfissionalDashboard />
          </ProtectedRoute>
        } />
        <Route path="/profissional/monitor/:eventId" element={
          <ProtectedRoute roles={["ADMIN", "PROFISSIONAL", "FRANCHISEE"]}>
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
        } />

        {/* Home e 404 */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />

      </Routes>
    </div>
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
          <HelmetProvider>
            <Router>
              <AnimatedRoutes />
            </Router>
          </HelmetProvider>
        </AuthProvider>
      )}
    </ThemeProvider>
  );
}

export default App;
