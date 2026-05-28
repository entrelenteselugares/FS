// src/components/AdminSidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import "../index.css";

interface NavItem {
  name: string;
  path: string;
  icon?: React.ReactNode; // optional icon component
}

const navigationItems: NavItem[] = [
  { name: "Visão Geral", path: "/admin" },
  { name: "Orçamentos", path: "/admin/orcamentos" },
  { name: "Membros", path: "/admin/membros" },
  { name: "Financeiro", path: "/admin/financeiro" },
  { name: "Impressão", path: "/admin/impressao" },
  { name: "Franquias", path: "/admin/franquias" },
  { name: "Estoque", path: "/admin/estoque" },
  { name: "Concursos", path: "/admin/concurso" },
  { name: "Configurações", path: "/admin/configuracoes" },
];

const AdminSidebar: React.FC = () => {
  return (
    <aside className="admin-sidebar">
      <nav>
        <ul className="admin-nav-list">
          {navigationItems.map((item) => (
            <li key={item.path} className="admin-nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive ? "admin-nav-link active" : "admin-nav-link"
                }
              >
                {item.icon && <span className="icon">{item.icon}</span>}
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;

/*
  CSS classes (defined in index.css):
  .admin-sidebar { width: 260px; background: rgba(255,255,255,0.08); backdrop-filter: blur(12px); color: var(--text-primary); }
  .admin-nav-list { list-style: none; padding: 0; margin: 0; }
  .admin-nav-item { margin: 0.5rem 0; }
  .admin-nav-link { display: block; padding: 0.75rem 1rem; border-radius: 8px; color: inherit; text-decoration: none; }
  .admin-nav-link.active { background: var(--accent-color); color: #fff; }
*/
