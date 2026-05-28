// src/components/AdminLayout.tsx
import React from "react";
import AdminSidebar from "./AdminSidebar";
import "../index.css";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main-content">{children}</main>
    </div>
  );
};

export default AdminLayout;

/*
  CSS classes (defined in index.css):
  .admin-layout { display: flex; min-height: 100vh; background: var(--bg-color); }
  .admin-main-content { flex: 1; padding: 2rem; overflow-y: auto; }
*/
