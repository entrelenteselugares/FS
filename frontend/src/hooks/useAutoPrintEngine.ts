import { useEffect, useRef, useState, useCallback } from "react";
import { API } from "../lib/api";

export interface PrintItem {
  id: string;
  referenceCode: string;
  imageUrl: string;
  customerName: string;
  status: 'PENDING_PRINT' | 'PRINTED' | 'DISPATCHED_MAIL';
  createdAt: string;
}

interface UseAutoPrintEngineProps {
  enabled: boolean;
  prints: PrintItem[];
  eventId: string;
  onPrintGroup: (group: PrintItem[], orientation: 'portrait' | 'landscape') => void;
  refetchPrints: () => void;
}

export function useAutoPrintEngine({ enabled, prints, eventId, onPrintGroup, refetchPrints }: UseAutoPrintEngineProps) {
  const [portraitQueue, setPortraitQueue] = useState<PrintItem[]>([]);
  const [landscapeQueue, setLandscapeQueue] = useState<PrintItem[]>([]);
  const processedIds = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to load image dimensions
  const getImageDimensions = (url: string): Promise<{ w: number, h: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.width, h: img.height });
      img.onerror = () => resolve({ w: 1, h: 1 }); // fallback
      img.crossOrigin = "anonymous";
      img.src = url;
    });
  };

  // Helper to fetch random printed photos for fallback
  const fetchFallbackPhotos = useCallback(async (count: number): Promise<PrintItem[]> => {
    try {
      const { data } = await API.get(`/phygital/events/${eventId}/prints`);
      // We take printed ones, shuffle them
      const printed = (data as PrintItem[]).filter(p => p.status === 'PRINTED');
      return printed.sort(() => 0.5 - Math.random()).slice(0, count);
    } catch (e) {
      console.error(e);
      return [];
    }
  }, [eventId]);

  // Process new pending prints
  useEffect(() => {
    if (!enabled) {
      setTimeout(() => {
        setPortraitQueue([]);
        setLandscapeQueue([]);
      }, 0);
      processedIds.current.clear();
      return;
    }

    const pending = prints.filter(p => p.status === 'PENDING_PRINT' && !processedIds.current.has(p.id));

    if (pending.length > 0) {
      // Mark as processed immediately so we don't process them again
      pending.forEach(p => processedIds.current.add(p.id));

      const processNewPhotos = async () => {
        const newPortraits: PrintItem[] = [];
        const newLandscapes: PrintItem[] = [];

        for (const p of pending) {
          const { w, h } = await getImageDimensions(p.imageUrl);
          if (h >= w) {
            newPortraits.push(p);
          } else {
            newLandscapes.push(p);
          }
        }

        setPortraitQueue(prev => [...prev, ...newPortraits]);
        setLandscapeQueue(prev => [...prev, ...newLandscapes]);
      };

      processNewPhotos();
    }
  }, [prints, enabled]);

  // Check queues for grouping
  useEffect(() => {
    if (!enabled) return;

    // Trigger Print
    const trigger = async (group: PrintItem[], orientation: 'portrait' | 'landscape') => {
      if (group.length === 0) return;
      onPrintGroup(group, orientation);
      // Wait a bit and refetch
      setTimeout(refetchPrints, 1000);
    };

    if (portraitQueue.length >= 4) {
      const group = portraitQueue.slice(0, 4);
      setTimeout(() => setPortraitQueue(prev => prev.slice(4)), 0);
      trigger(group, 'portrait');
    }

    if (landscapeQueue.length >= 4) {
      const group = landscapeQueue.slice(0, 4);
      setTimeout(() => setLandscapeQueue(prev => prev.slice(4)), 0);
      trigger(group, 'landscape');
    }
  }, [portraitQueue, landscapeQueue, enabled, onPrintGroup, refetchPrints]);

  // Timeout logic to fill empty spots
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    if (portraitQueue.length > 0 && portraitQueue.length < 4) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const missing = 4 - portraitQueue.length;
        const fallbacks = await fetchFallbackPhotos(missing);
        const group = [...portraitQueue, ...fallbacks];
        // If we still don't have 4 (e.g. no printed photos yet), duplicate the existing ones
        while (group.length < 4) {
          group.push(portraitQueue[group.length % portraitQueue.length]);
        }
        setPortraitQueue([]);
        onPrintGroup(group, 'portrait');
      }, 60000); // 1 minute timeout
    } 
    else if (landscapeQueue.length > 0 && landscapeQueue.length < 4) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const missing = 4 - landscapeQueue.length;
        const fallbacks = await fetchFallbackPhotos(missing);
        const group = [...landscapeQueue, ...fallbacks];
        while (group.length < 4) {
          group.push(landscapeQueue[group.length % landscapeQueue.length]);
        }
        setLandscapeQueue([]);
        onPrintGroup(group, 'landscape');
      }, 60000); // 1 minute timeout
    }
    else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [portraitQueue, landscapeQueue, enabled, eventId, onPrintGroup, fetchFallbackPhotos]);

  return { portraitQueue, landscapeQueue };
}
