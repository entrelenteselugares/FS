import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { T } from "../lib/theme";

interface Props {
  children: React.ReactNode;
  roles?: Array<"ADMIN" | "CARTORIO" | "UNIDADE" | "PROFISSIONAL" | "CLIENTE" | "FRANCHISEE">;
}

export const ProtectedRoute: React.FC<Props> = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${T.brand}`, borderTopColor: "transparent", borderRadius: "50%" }} className="animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};
