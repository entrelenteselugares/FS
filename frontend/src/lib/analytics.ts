/**
 * Analytics Utility (GA4)
 * Centralizes all tracking logic for the Foto Segundo platform.
 */

export const GA_EVENTS = {
  LOGIN: "login",
  PURCHASE: "purchase",
  PRO_REGISTRATION: "pro_registration",
  PRINT_CLICK: "print_click",
  PAGE_VIEW: "page_view",
};

/**
 * Tracks a custom event in Google Analytics
 */
export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, {
      ...params,
      timestamp: new Date().toISOString(),
    });
    
    if (import.meta.env.DEV) {
      console.log(`[GA4] Event Tracked: ${eventName}`, params);
    }
  }
}

/**
 * Tracks page views manually (useful for React Router)
 */
export function trackPageView(path: string, title?: string) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "page_view", {
      page_path: path,
      page_title: title || document.title,
    });
  }
}

/** OPS-02: Typed conversion helpers */

export function trackLogin(method: "email" | "google" | "magic_link" = "email") {
  trackEvent(GA_EVENTS.LOGIN, { method });
}

export function trackPurchase(params: {
  orderId: string;
  value: number;
  currency?: string;
  itemCount?: number;
}) {
  trackEvent(GA_EVENTS.PURCHASE, {
    transaction_id: params.orderId,
    value: params.value,
    currency: params.currency ?? "BRL",
    items: params.itemCount ?? 1,
  });
}

export function trackProRegistration(role: "PROFISSIONAL" | "CARTORIO" = "PROFISSIONAL") {
  trackEvent(GA_EVENTS.PRO_REGISTRATION, { role });
}

export function trackPrintClick(eventId: string, mediaId: string) {
  trackEvent(GA_EVENTS.PRINT_CLICK, { event_id: eventId, media_id: mediaId });
}

