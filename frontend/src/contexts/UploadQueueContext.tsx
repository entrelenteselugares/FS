import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API } from '../lib/api';
import {
  type UploadQueueItem,
  getAllUploadItems,
  saveUploadItem,
  removeUploadItem,
  clearUploadQueue,
} from '../lib/uploadQueueDB';

interface UploadQueueContextData {
  uploadItems: UploadQueueItem[];
  addToQueue: (
    files: File[],
    metadata: {
      eventId: string;
      customerName: string;
      customerPhone: string;
      customerEmail: string;
      userId?: string;
    }
  ) => Promise<void>;
  retryUpload: (id: string) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
}

const UploadQueueContext = createContext<UploadQueueContextData>({} as UploadQueueContextData);

export const UploadQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uploadItems, setUploadItems] = useState<UploadQueueItem[]>([]);
  const uploadItemsRef = useRef<UploadQueueItem[]>([]);
  const isUploadingRef = useRef(false);

  useEffect(() => {
    uploadItemsRef.current = uploadItems;
  }, [uploadItems]);

  // Load from IndexedDB on mount
  useEffect(() => {
    getAllUploadItems()
      .then((items) => {
        setUploadItems(items);
      })
      .catch((err) => console.error('Failed to load upload queue:', err));
  }, []);

  const updateItemStatus = useCallback(async (
    id: string,
    updates: Partial<UploadQueueItem>
  ) => {
    setUploadItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          // Save updated state to IndexedDB in background
          saveUploadItem(updated).catch((err) =>
            console.error('Failed to save to DB:', err)
          );
          return updated;
        }
        return item;
      })
    );
  }, []);

  const processQueue = useCallback(async () => {
    if (isUploadingRef.current) return;

    // Find the oldest pending item (FIFO)
    // Find the oldest pending item (FIFO) using the ref to avoid stale closures
    const pendingItems = uploadItemsRef.current.filter((i) => i.status === 'pending');
    if (pendingItems.length === 0) return;

    // Sort pending ascending to get the oldest
    const oldestPending = [...pendingItems].sort((a, b) => a.timestamp - b.timestamp)[0];

    isUploadingRef.current = true;
    await updateItemStatus(oldestPending.id, { status: 'uploading' });

    try {
      const formDataPayload = new FormData();
      const resolvedType =
        oldestPending.file.type ||
        (oldestPending.file.name.match(/\.(mp4|webm|mov)$/i) ? 'video/mp4' : 'image/jpeg');

      // Text fields FIRST
      formDataPayload.append('eventId', oldestPending.eventId);
      formDataPayload.append('customerName', oldestPending.customerName);
      formDataPayload.append('customerPhone', oldestPending.customerPhone);
      formDataPayload.append('customerEmail', oldestPending.customerEmail);
      formDataPayload.append('mimetype', resolvedType);
      if (oldestPending.userId) {
        formDataPayload.append('userId', oldestPending.userId);
      }

      // File LAST
      formDataPayload.append('photo', oldestPending.file, oldestPending.file.name);

      const res = await API.post('/public/phygital/upload', formDataPayload);

      if (res.data && res.data.success) {
        await updateItemStatus(oldestPending.id, {
          status: 'success',
          code: res.data.referenceCode,
        });
      } else {
        throw new Error(res.data?.error || 'Erro no envio');
      }
    } catch (err: any) {
      await updateItemStatus(oldestPending.id, {
        status: 'error',
        errorMessage: err.message || 'Falha na conexão',
      });
    } finally {
      isUploadingRef.current = false;
      // Trigger next item in queue - because processQueue is stable and uses the ref, 
      // it won't suffer from stale closures
      setTimeout(processQueue, 100);
    }
  }, [updateItemStatus]);

  // Whenever uploadItems changes, try to process the queue
  useEffect(() => {
    processQueue();
  }, [uploadItems, processQueue]);

  const addToQueue = async (
    files: File[],
    metadata: {
      eventId: string;
      customerName: string;
      customerPhone: string;
      customerEmail: string;
      userId?: string;
    }
  ) => {
    const newItems: UploadQueueItem[] = files.map((file) => ({
      id: Date.now() + Math.random().toString(36).substring(2),
      file,
      status: 'pending',
      timestamp: Date.now(),
      ...metadata,
    }));

    // Save to IndexedDB first
    for (const item of newItems) {
      await saveUploadItem(item);
    }

    // Update state (newest first for UI)
    setUploadItems((prev) => [...newItems, ...prev]);
  };

  const retryUpload = (id: string) => {
    updateItemStatus(id, { status: 'pending', errorMessage: undefined });
  };

  const removeFromQueue = async (id: string) => {
    await removeUploadItem(id);
    setUploadItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearQueue = async () => {
    await clearUploadQueue();
    setUploadItems([]);
  };

  return (
    <UploadQueueContext.Provider
      value={{
        uploadItems,
        addToQueue,
        retryUpload,
        removeFromQueue,
        clearQueue,
      }}
    >
      {children}
    </UploadQueueContext.Provider>
  );
};

export const useUploadQueue = () => useContext(UploadQueueContext);
