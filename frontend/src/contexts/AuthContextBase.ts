import { createContext } from "react";

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: "ADMIN" | "CARTORIO" | "UNIDADE" | "PROFISSIONAL" | "CLIENTE";
  mpUserId?: string | null;
  mpPublicKey?: string | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<AuthUser>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);
