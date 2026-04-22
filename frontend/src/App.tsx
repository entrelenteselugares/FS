import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import { HelmetProvider } from "react-helmet-async";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { motion, AnimatePresence } from "framer-motion";
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
import { useState, useEffect } from "react";
import { API as api } from "./lib/api";

/** Redireciona /dashboard para o painel correto baseado no role */
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const map: Record<string, string> = {
    ADMIN:        "/admin",
    PROFISSIONAL: "/profissional",
    CARTORIO:     "/unidade-fixa",
    UNIDADE:      "/unidade-fixa",
    CLIENTE:      "/minha-conta",
  };
  return <Navigate to={map[user.role] || "/"} replace />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, scale: 0.995 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.002 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <Routes location={location}>
          {/* Público */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/e/:slug" element={<EventPage />} />
          <Route path="/auth" element={<AuthSelectionPage />} />
          <Route path="/cotacao" element={<QuotePage />} />
{/* 
          <Route path="/hall-da-fama" element={<HallOfFame />} />
          <Route path="/concursos" element={<HallOfFame />} /> 
          */}
          <Route path="/p/:slug" element={<PartnerLP />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/:orderId" element={<CheckoutPage />} />

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

          {/* Painel do Artista (Profissional) */}
          <Route path="/profissional" element={
            <ProtectedRoute roles={["ADMIN", "PROFISSIONAL"]}>
              <ProfissionalDashboard />
            </ProtectedRoute>
          } />

          {/* Painel Unidades Fixas */}
          <Route path="/unidade-fixa" element={
            <ProtectedRoute roles={["ADMIN", "CARTORIO", "UNIDADE"]}>
              <UnidadeFixaDashboard />
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
        <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center gap-6 transition-colors duration-500">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-ping mb-4" />
          <div className="text-[14px] font-bold uppercase tracking-[0.6em] text-theme-text">FOTO SEGUNDO</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-theme-text-muted animate-pulse">Sincronizando Rede de Artistas...</div>
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
