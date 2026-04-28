import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

export interface MediaFile {
  id: string;
  url: string;
  tipo: string;
  isCoverPhoto: boolean;
}

export interface EventData {
  id: string;
  nomeNoivos: string;
  dataEvento: string;
  coverPhotoUrl: string | null;
  temFoto: boolean;
  temFotoImpressa: boolean;
  midias: MediaFile[];
  paywall: {
    active: boolean;
    message: string;
  };
}

// NOTE: Use API from lib/api.ts for authenticated requests.
// Routes: /public/events/:slug (public) | /checkout/payment (checkout)

export default api;
