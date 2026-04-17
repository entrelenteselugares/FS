import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { EventPage } from "./pages/EventPage";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { ProfessionalDashboard } from "./pages/ProfessionalDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { CartorioDashboard } from "./pages/CartorioDashboard";
import { useAuth } from "./contexts/AuthContext";

/** Redireciona /dashboard para o painel correto baseado no role */
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const map: Record<string, string> = {
    ADMIN: "/admin",
    CARTORIO: "/cartorio",
    PROFISSIONAL: "/profissional",
    CLIENTE: "/",
  };
  return <Navigate to={map[user.role] || "/"} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Público */}
          <Route path="/" element={<HomePage />} />
          <Route path="/eventos/:id" element={<EventPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Redireciona para o painel correto */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardRedirect /></ProtectedRoute>
          } />

          {/* Painel do Profissional */}
          <Route path="/profissional" element={
            <ProtectedRoute roles={["PROFISSIONAL", "ADMIN"]}>
              <ProfessionalDashboard />
            </ProtectedRoute>
          } />

          {/* Painel Admin */}
          <Route path="/admin" element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Painel Cartório */}
          <Route path="/cartorio" element={
            <ProtectedRoute roles={["CARTORIO", "ADMIN"]}>
              <CartorioDashboard />
            </ProtectedRoute>
          } />

          {/* Home e 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
