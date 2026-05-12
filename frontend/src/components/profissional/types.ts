// Shared types for the Professional Dashboard sub-components

export interface EventItem {
  id: string;
  slug: string;
  nomeNoivos: string;
  dataEvento: string;
  createdAt: string;
  cartorio: string | null;
  coverPhotoUrl: string | null;
  coverPosition?: string | null;
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
  city?: string | null;
  ownerId?: string | null;
  isPublicCall?: boolean;
  type: "ALBUM_FULL" | "PHOTO_MARKETPLACE" | "FOTO_POINT";
  priceUnit: number | null;
  itinerary: string | null;
  references: string[];
  isPrivate: boolean;
  active: boolean;
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
  catalogService?: ServiceCatalog;
}

export interface EquipmentItem {
  name: string;
  value: number;
}

export interface ResidentUnit {
  id: string;
  tipo: string;
  cartorio: {
    razaoSocial: string;
    endereco: string | null;
    cidade: string | null;
  };
}

export interface ProfileData {
  user: {
    nome: string | null;
    email: string | null;
    whatsapp: string | null;
    address: string | null;
    isVerified?: boolean;
    verificationStatus?: string;
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
  firstJobUrl?: string | null;
  isExperienceValidated?: boolean;
  stats?: {
    totalEarnings: number;
    monthEarnings: number;
    completedEvents: number;
    agilityPoints: number;
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
  cartorioProfissional?: ResidentUnit[];
  cartorios?: ResidentUnit[];
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
  productType: string;
  paymentMethod: "PIX" | "CARD" | "MONEY";
  internalNotes: string;
  editorId: string;
};
