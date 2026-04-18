import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { HelmetProvider } from "react-helmet-async";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { EventPage } from "./pages/EventPage";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import ProfissionalDashboard from "./pages/ProfissionalDashboard";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import CartorioDashboard from "./pages/CartorioDashboard";
import { AuthSelectionPage } from "./pages/AuthSelectionPage";
import { RegisterPage } from "./pages/RegisterPage";
import ClienteArea from "./pages/ClienteArea";

/** Redireciona /dashboard para o painel correto baseado no role */
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const map: Record<string, string> = {
    ADMIN: "/admin",
    CARTORIO: "/cartorio",
    PROFISSIONAL: "/profissional",
    CLIENTE: "/minha-conta",
  };
  return <Navigate to={map[user.role] || "/"} replace />;
};

function App() {
  return (
    <AuthProvider>
      <HelmetProvider>
        <Router>
        <Routes>
          {/* Público */}
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthSelectionPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/eventos/:id" element={<EventPage />} />
          <Route path="/e/:id" element={<EventPage />} />

          {/* Redireciona para o painel correto */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardRedirect /></ProtectedRoute>
          } />

          {/* Painel do Profissional */}
          <Route path="/profissional" element={
            <ProtectedRoute roles={["PROFISSIONAL", "ADMIN"]}>
              <ProfissionalDashboard />
            </ProtectedRoute>
          } />

          {/* Painel Admin Modular v6.0 */}
          <Route path="/admin" element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

          {/* Painel Unidades */}
          <Route path="/cartorio" element={
            <ProtectedRoute roles={["CARTORIO", "ADMIN"]}>
              <CartorioDashboard />
            </ProtectedRoute>
          } />

          {/* Área do Cliente */}
          <Route path="/minha-conta" element={
            <ProtectedRoute roles={["CLIENTE", "ADMIN", "PROFISSIONAL", "CARTORIO"]}>
              <ClienteArea />
            </ProtectedRoute>
          } />

          {/* Home e 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </HelmetProvider>
    </AuthProvider>
  );
}

export default App;
