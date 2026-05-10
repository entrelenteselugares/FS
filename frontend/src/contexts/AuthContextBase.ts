import { createContext } from "react";

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: "ADMIN" | "CARTORIO" | "UNIDADE" | "PROFISSIONAL" | "CLIENTE" | "FRANCHISEE";
  whatsapp?: string | null;
  mpUserId?: string | null;
  mpPublicKey?: string | null;
  rewardCredits?: number | null;
  gamificationLedger?: Array<{
    id: string;
    type: string;
    amount: number | null;
    points: number | null;
    description: string | null;
    createdAt: string;
  }>;
  franchiseProfile?: {
    id: string;
    printCredits: number;
    tier?: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";
    active: boolean;
    transactions?: Array<{
      id: string;
      amount: number;
      type: string;
      description: string | null;
      createdAt: string;
    }>;
  } | null;
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<AuthUser>;
  register: (email: string, senha: string, nome: string) => Promise<AuthUser>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);
