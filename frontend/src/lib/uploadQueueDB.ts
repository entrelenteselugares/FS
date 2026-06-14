export interface UploadQueueItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  eventId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  userId?: string;
  code?: string;
  errorMessage?: string;
  timestamp: number;
}

const DB_NAME = 'FotoSegundoUploadQueue';
const STORE_NAME = 'uploads';
const DB_VERSION = 1;

/**
 * Initializes and returns the IndexedDB instance.
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Saves or updates an item in the queue.
 */
export const saveUploadItem = async (item: UploadQueueItem): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Removes an item from the queue (e.g., after success).
 */
export const removeUploadItem = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Gets all items currently in the queue.
 */
export const getAllUploadItems = async (): Promise<UploadQueueItem[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by timestamp descending so newest are first, or ascending?
      // For queue, usually ascending (FIFO), but UI might want descending (newest at top).
      // We will sort descending to match previous UI behavior.
      const items = (request.result as UploadQueueItem[]) || [];
      items.sort((a, b) => b.timestamp - a.timestamp);
      
      // Reset any 'uploading' items to 'pending' upon load (in case app crashed during upload)
      const mappedItems = items.map(item => 
        item.status === 'uploading' ? { ...item, status: 'pending' as const } : item
      );
      
      resolve(mappedItems);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Clears the entire queue.
 */
export const clearUploadQueue = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
