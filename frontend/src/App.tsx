import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { useAuth } from "./hooks/useAuth";
import { HelmetProvider } from "react-helmet-async";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BottomNav } from "./components/BottomNav";
import { PushNotificationManager } from "./components/PushNotificationManager";
import { UploadQueueProvider } from "./contexts/UploadQueueContext";

import React, { Suspense } from "react";


// ─── Lazy Loaded Routes ───
const EventPage = React.lazy(() => import("./pages/EventPage"));
const LoginPage = React.lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const HomePage = React.lazy(() => import("./pages/HomePage").then(m => ({ default: m.HomePage })));
const AuthSelectionPage = React.lazy(() => import("./pages/AuthSelectionPage").then(m => ({ default: m.AuthSelectionPage })));
const RegisterPage = React.lazy(() => import("./pages/RegisterPage").then(m => ({ default: m.RegisterPage })));

const ProfissionalDashboard = React.lazy(() => import("./pages/ProfissionalDashboard"));
const PortfolioManage = React.lazy(() => import("./pages/profissional/PortfolioManage"));
const CustomServiceForm = React.lazy(() => import("./pages/profissional/CustomServiceForm"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const UnidadeFixaDashboard = React.lazy(() => import("./pages/UnidadeFixaDashboard"));
const ClienteArea = React.lazy(() => import("./pages/ClienteArea"));
const QuotePage = React.lazy(() => import("./pages/QuotePage").then(m => ({ default: m.QuotePage })));
const PackageFlowPage = React.lazy(() => import("./pages/quote/PackageFlowPage").then(m => ({ default: m.PackageFlowPage })));
const PartnerFlowPage = React.lazy(() => import("./pages/quote/PartnerFlowPage").then(m => ({ default: m.PartnerFlowPage })));
const CustomFlowPage = React.lazy(() => import("./pages/quote/CustomFlowPage").then(m => ({ default: m.CustomFlowPage })));
const PartnerLP = React.lazy(() => import("./pages/PartnerLP").then(m => ({ default: m.PartnerLP })));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })));
const CheckoutPage = React.lazy(() => import("./pages/CheckoutPage").then(m => ({ default: m.CheckoutPage })));
const ResetPasswordPage = React.lazy(() => import("./pages/ResetPasswordPage"));
const ForgotPasswordPage = React.lazy(() => import("./pages/ForgotPasswordPage"));
const LuxuryExperiencePage = React.lazy(() => import("./pages/LuxuryExperiencePage"));
const PhygitalCapture = React.lazy(() => import("./pages/PhygitalCapture"));
const PrintMonitor = React.lazy(() => import("./pages/PrintMonitor"));
const FullMonitor = React.lazy(() => import("./pages/FullMonitor"));
const TermsPage = React.lazy(() => import("./pages/TermsPage").then(m => ({ default: m.TermsPage })));
const FranchiseDashboard = React.lazy(() => import("./pages/franchise/FranchiseDashboard"));
const VaultsPage = React.lazy(() => import("./pages/VaultsPage"));
const VaultDetailPage = React.lazy(() => import("./pages/VaultDetailPage"));
const AmbassadorPage = React.lazy(() => import("./pages/AmbassadorPage"));
const InvitationPage = React.lazy(() => import("./pages/InvitationPage"));
const ProfissionaisPage = React.lazy(() => import("./pages/ProfissionaisPage"));
const ProfissionalProfilePage = React.lazy(() => import("./pages/ProfissionalProfilePage"));
const AboutPage = React.lazy(() => import("./pages/AboutPage").then(m => ({ default: m.AboutPage })));
const PrivacyPage = React.lazy(() => import("./pages/PrivacyPage").then(m => ({ default: m.PrivacyPage })));
const LgpdPage = React.lazy(() => import("./pages/LgpdPage").then(m => ({ default: m.LgpdPage })));
const PartnershipsPage = React.lazy(() => import("./pages/PartnershipsPage").then(m => ({ default: m.PartnershipsPage })));
const ContactPage = React.lazy(() => import("./pages/ContactPage").then(m => ({ default: m.ContactPage })));
const StatusPage = React.lazy(() => import("./pages/StatusPage").then(m => ({ default: m.StatusPage })));
const BusinessLanding = React.lazy(() => import("./pages/BusinessLanding").then(m => ({ default: m.BusinessLanding })));
const FlashUnlockPage = React.lazy(() => import("./pages/FlashUnlockPage"));
const ClubLandingPage = React.lazy(() => import("./pages/ClubLandingPage").then(m => ({ default: m.ClubLandingPage })));
const HelpPage = React.lazy(() => import("./pages/HelpPage"));
const AlbumTorcidaPage = React.lazy(() => import("./pages/worldcup/AlbumTorcidaPage").then(m => ({ default: m.AlbumTorcidaPage })));
const MatchFolhaPage = React.lazy(() => import("./pages/worldcup/MatchFolhaPage").then(m => ({ default: m.MatchFolhaPage })));
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./components/PageTransition";
import { API as api } from "./lib/api";
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useNavigate } from 'react-router-dom';

/** Redireciona /dashboard para o painel correto baseado no role */
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const map: Record<string, string> = {
    ADMIN:        "/admin",
    PROFISSIONAL: "/minha-conta",
    CARTORIO:     "/minha-conta",
    UNIDADE:      "/minha-conta",
    FRANCHISEE:   "/franquia",
    CLIENTE:      "/minha-conta",
  };
  return <Navigate to={map[user.role] || "/"} replace />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Escuta Deep Links nativos do Capacitor (ex: OAuth callback)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const listener = CapacitorApp.addListener('appUrlOpen', (event) => {
        // Importa e fecha o In-App Browser do Google Auth
        import('@capacitor/browser').then(({ Browser }) => {
          Browser.close().catch(() => {});
        });

        // Extrai a rota e hash (ex: com.fotosegundo.app://auth-callback#access_token=...)
        try {
          const urlObj = new URL(event.url);
          if (urlObj.hostname === 'auth-callback') {
            if (urlObj.hash) {
              window.location.hash = urlObj.hash;
              
              // Extrai access_token e refresh_token para definir a sessão manualmente no Supabase
              const hashParams = new URLSearchParams(urlObj.hash.substring(1));
              const access_token = hashParams.get("access_token");
              const refresh_token = hashParams.get("refresh_token");
              
              if (access_token && refresh_token) {
                import("./lib/supabase").then(({ supabase }) => {
                  supabase.auth.setSession({ access_token, refresh_token }).catch(err => {
                    console.error("Erro ao definir sessao no Supabase", err);
                  });
                });
              }
            }
            // Navega para a home repassando o hash para o Supabase capturar o token
            navigate({ pathname: '/', search: urlObj.search, hash: urlObj.hash }, { replace: true });
          } else {
            const slug = event.url.split('://').pop();
            if (slug) navigate('/' + slug);
          }
        } catch (e) {
          console.error("Erro no appUrlOpen", e);
        }
      });
      return () => { listener.then(l => l.remove()); };
    }
  }, [navigate]);

  // Safety: Clear body overflow on every route change to prevent stuck overlays
  useEffect(() => {
    document.body.style.overflow = "unset";
    
    // GA4: Track Page View
    import("./lib/analytics").then(({ trackPageView }) => {
      trackPageView(location.pathname);
    });
  }, [location]);
  
  // Evita desmontagem completa do DashboardLayout ao transitar entre rotas internas da mesma área
  const getAnimationKey = (path: string) => {
    if (path.startsWith("/minha-conta") || path.startsWith("/meus-albuns") || path.startsWith("/profissional") || path.startsWith("/unidade-fixa") || path.startsWith("/franquia")) return "cliente-area";
    if (path.startsWith("/admin")) return "admin-area";
    return path;
  };

  return (
    <AnimatePresence mode="wait">
      <PageTransition key={getAnimationKey(location.pathname)}>
        <div className="w-full h-full pb-20 md:pb-0">
          <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-theme-bg"><div className="w-6 h-6 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin"></div></div>}>
            <Routes location={location}>
            {/* Public / Whitelist Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth" element={<AuthSelectionPage />} />
          <Route path="/invitation/:code" element={<InvitationPage />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/sobre" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
            <Route path="/parcerias" element={<ProtectedRoute><PartnershipsPage /></ProtectedRoute>} />
            <Route path="/termos" element={<ProtectedRoute><TermsPage /></ProtectedRoute>} />
            <Route path="/privacidade" element={<ProtectedRoute><PrivacyPage /></ProtectedRoute>} />
            <Route path="/lgpd" element={<ProtectedRoute><LgpdPage /></ProtectedRoute>} />
            <Route path="/contato" element={<ProtectedRoute><ContactPage /></ProtectedRoute>} />
            <Route path="/status" element={<ProtectedRoute><StatusPage /></ProtectedRoute>} />
            <Route path="/vitrine" element={<ProtectedRoute><ProfissionaisPage /></ProtectedRoute>} />
            <Route path="/profissionais" element={<ProtectedRoute><ProfissionaisPage /></ProtectedRoute>} />
            <Route path="/pro/:id" element={<ProtectedRoute><ProfissionalProfilePage /></ProtectedRoute>} />
            <Route path="/p/:slug" element={<ProtectedRoute><PartnerLP /></ProtectedRoute>} />
            <Route path="/suporte" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
            
            <Route path="/e/:slug" element={<ProtectedRoute><EventPage /></ProtectedRoute>} />
            <Route path="/cotacao" element={<ProtectedRoute><QuotePage /></ProtectedRoute>} />
            <Route path="/cotacao/pacotes" element={<ProtectedRoute><PackageFlowPage /></ProtectedRoute>} />
            <Route path="/cotacao/unidades" element={<ProtectedRoute><PartnerFlowPage /></ProtectedRoute>} />
            <Route path="/cotacao/customizado" element={<ProtectedRoute><CustomFlowPage /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/checkout/:orderId" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/delivery/:id" element={<ProtectedRoute><LuxuryExperiencePage /></ProtectedRoute>} />
            <Route path="/captura" element={<ProtectedRoute><PhygitalCapture /></ProtectedRoute>} />
            <Route path="/phygital-capture" element={<ProtectedRoute><PhygitalCapture /></ProtectedRoute>} />
            <Route path="/negocios" element={<ProtectedRoute><BusinessLanding /></ProtectedRoute>} />
            <Route path="/clube" element={<ProtectedRoute><ClubLandingPage /></ProtectedRoute>} />
            <Route path="/flash/:shortId" element={<ProtectedRoute><FlashUnlockPage /></ProtectedRoute>} />
            <Route path="/embaixador/:slug" element={<ProtectedRoute><AmbassadorPage /></ProtectedRoute>} />
            
            {/* World Cup Gamification */}
            <Route path="/album-torcida" element={<ProtectedRoute><AlbumTorcidaPage /></ProtectedRoute>} />
            <Route path="/album-torcida/match/:matchId" element={<ProtectedRoute><MatchFolhaPage /></ProtectedRoute>} />

            {/* Redireciona para o painel correto */}
            <Route path="/dashboard" element={<DashboardRedirect />} />
            
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
            <Route path="/profissional/novo-servico" element={
              <ProtectedRoute roles={["ADMIN", "PROFISSIONAL", "FRANCHISEE"]}>
                <CustomServiceForm />
              </ProtectedRoute>
            } />
            <Route path="/profissional/portfolio" element={
              <ProtectedRoute roles={["ADMIN", "PROFISSIONAL", "FRANCHISEE"]}>
                <PortfolioManage />
              </ProtectedRoute>
            } />
            <Route path="/profissional/monitor/:eventId" element={
              <ProtectedRoute roles={["ADMIN", "PROFISSIONAL", "FRANCHISEE", "CARTORIO"]}>
                <PrintMonitor />
              </ProtectedRoute>
            } />
            <Route path="/profissional/monitor/:eventId/full" element={<ProtectedRoute roles={["ADMIN", "PROFISSIONAL", "FRANCHISEE", "CARTORIO"]}><FullMonitor /></ProtectedRoute>} />
            <Route path="/profissional/monitor/:eventId/fullscreen" element={<ProtectedRoute roles={["ADMIN", "PROFISSIONAL", "FRANCHISEE", "CARTORIO"]}><FullMonitor /></ProtectedRoute>} />

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
              <ProtectedRoute roles={["ADMIN", "CLIENTE", "PROFISSIONAL", "CARTORIO", "UNIDADE", "FRANCHISEE"]}>
                <ClienteArea />
              </ProtectedRoute>
            } />

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

            {/* Home e 404 */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
      </PageTransition>
    </AnimatePresence>
  );
};

function App() {
  // PERFORMANCE FIX #1: Não bloquear a UI com cold start.
  // O wake-up roda em background. A app inicia imediatamente.
  // Se o backend ainda não respondeu, a AuthProvider lida com os 503s silenciosamente.
  useEffect(() => {
    api.get("/health").catch(() => {
      // Silencioso — o servidor está aquecendo. As requisições subsequentes
      // terão retry automático pelo interceptor do axios.
      console.warn("[WakeUp] Backend ainda inicializando, continuando em background...");
    });
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <UploadQueueProvider>
            <HelmetProvider>
              <Router>
                <AnimatedRoutes />
                <BottomNav />
                <PushNotificationManager />
              </Router>
            </HelmetProvider>
          </UploadQueueProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
