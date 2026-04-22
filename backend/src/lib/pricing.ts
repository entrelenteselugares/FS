import { Event } from "@prisma/client";

/**
 * Calcula o preço de um evento baseado na data atual e status de Crowdfund.
 * Lógica: Antecipado se hoje < data do evento, caso contrário preço base.
 * Crowdfund: Se ativo, usa o valor da contribuição enviado.
 */
export function calculateEventPrice(event: Event, contributionAmount?: number): number {
  const now = new Date();
  const eventDate = new Date(event.dataEvento);
  eventDate.setHours(0, 0, 0, 0);

  // Se for Compra Coletiva (Crowdfund), o valor é o enviado pelo usuário (cota)
  if (event.isCrowdfund && contributionAmount) {
    return Number(contributionAmount);
  }

  // Se a data atual for anterior à data do evento, usa preço antecipado
  if (now.getTime() < eventDate.getTime()) {
    return Number(event.priceEarly ?? 190);
  }

  return Number(event.priceBase ?? 200);
}
