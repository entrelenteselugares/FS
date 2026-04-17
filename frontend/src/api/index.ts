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

export const getEvent = async (id: string, userId?: string) => {
  const { data } = await api.get<EventData>(`/events/${id}`, {
    params: { userId },
  });
  return data;
};

export const createCheckout = async (checkoutData: {
  eventId: string;
  userId: string;
  email: string;
  method: string;
}) => {
  const { data } = await api.post("/checkout", checkoutData);
  return data;
};

export default api;
