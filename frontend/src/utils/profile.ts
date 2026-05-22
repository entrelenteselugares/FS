import type { AuthUser } from "../contexts/AuthContextBase";

export interface ProfissionalProfile {
  pixKey?: string | null;
  experienceYears?: number;
  firstJobUrl?: string | null;
  services?: string[];
  equipmentList?: string[];
}

export const calculateProfileCompleteness = (
  user: AuthUser | null,
  profile: ProfissionalProfile | null
) => {
  const steps = [
    { id: "photo", label: "Foto de Perfil", weight: 20, done: !!user?.profileImageUrl },
    { id: "name", label: "Identidade", weight: 10, done: !!user?.nome },
    { id: "contact", label: "WhatsApp", weight: 10, done: !!user?.whatsapp },
    { id: "address", label: "Endereço Operacional", weight: 10, done: !!user?.address && (user.address || "").split('|').filter(Boolean).length > 3 },
    { id: "pix", label: "Chave PIX", weight: 10, done: !!profile?.pixKey },
    { id: "exp", label: "Experiência", weight: 10, done: (profile?.experienceYears ?? 0) > 0 },
    { id: "proof", label: "Primeiro Trabalho", weight: 10, done: !!profile?.firstJobUrl },
    { id: "skills", label: "Especialidades", weight: 10, done: (profile?.services?.length ?? 0) > 0 },
    { id: "gear", label: "Inventário Técnico", weight: 10, done: (profile?.equipmentList?.length ?? 0) > 0 },
  ];
  return {
    steps,
    percentage: steps.reduce((acc, s) => acc + (s.done ? s.weight : 0), 0),
  };
};
