import { useState, useEffect, useCallback } from 'react';

export interface RecentAlbum {
  eventId: string;
  title: string;
  coverUrl?: string;
  visitedAt: number;
}

const STORAGE_KEY = 'fs_recent_albums';
const MAX_ALBUMS = 3;

export const useRecentAlbums = () => {
  const [recentAlbums, setRecentAlbums] = useState<RecentAlbum[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentAlbums(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load recent albums', err);
    }
  }, []);

  const addAlbum = useCallback((album: Omit<RecentAlbum, 'visitedAt'>) => {
    setRecentAlbums(prev => {
      // Remove if it already exists to put it at the top
      const filtered = prev.filter(a => a.eventId !== album.eventId);
      const newAlbum = { ...album, visitedAt: Date.now() };
      const updated = [newAlbum, ...filtered].slice(0, MAX_ALBUMS);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save recent albums', err);
      }
      
      return updated;
    });
  }, []);

  return {
    recentAlbums,
    addAlbum
  };
};
