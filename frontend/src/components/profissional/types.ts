// Shared types for the Professional Dashboard sub-components

export interface EventItem {
  id: string;
  slug: string;
  nomeNoivos: string;
  dataEvento: string;
  createdAt: string;
  cartorio: string | null;
  coverPhotoUrl: string | null;
  lightroomUrl: string | null;
  driveUrl: string | null;
  temFoto: boolean;
  temVideo: boolean;
  temReels: boolean;
  temFotoImpressa: boolean;
  eventHours: number | null;
  captacaoId: string | null;
  captacaoStatus: "PENDING" | "ACCEPTED" | "REJECTED";
  edicaoId: string | null;
  edicaoStatus: "PENDING" | "ACCEPTED" | "REJECTED";
  location: string | null;
  _count: { pedidos: number };
}

export interface UnitInvite {
  id: string;
  cartorioId: string;
  tipo: string;
  status: string;
  cartorio: {
    razaoSocial: string;
    cidade: string;
  };
}

export interface ServiceCatalog {
  id: string;
  name: string;
  description: string | null;
  category: string;
  basePrice: number;
  estimatedMinutes: number;
}

export interface ProfessionalService {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  catalogId: string | null;
  active: boolean;
  catalog?: ServiceCatalog;
}

export interface EquipmentItem {
  name: string;
  value: number;
}

export interface ProfileData {
  user: {
    nome: string | null;
    email: string | null;
    whatsapp: string | null;
  };
  pixKey: string | null;
  pixType: string | null;
  services: string[];
  equipment: string | null;
  equipmentList?: EquipmentItem[];
  experienceYears?: number;
  hourlyRate?: number;
  equipmentMultiplier?: number;
  proServices?: ProfessionalService[];
  otherHabilities: string | null;
  workflowType?: string[];
  stats?: {
    totalEarnings: number;
    monthEarnings: number;
    completedEvents: number;
  };
  payoutHistory?: Array<{
    id: string;
    amount: number;
    status: string;
    orderCount: number;
    payout?: {
      weekStart: string;
    };
  }>;
  cartorioProfissional?: Array<{
    tipo: string;
    cartorio: { razaoSocial: string };
  }>;
}

export interface Partner {
  id: string;
  nome: string;
  email: string;
  whatsapp: string | null;
}

export type ExpressFormData = {
  customerName: string;
  customerEmail: string;
  whatsapp: string;
  amount: number;
  location: string;
  productType: "FOTOS" | "REELS" | "SD_CARD" | "ALBUM_IMPRESSO";
  paymentMethod: "PIX" | "CARD" | "MONEY";
  internalNotes: string;
  editorId: string;
};
