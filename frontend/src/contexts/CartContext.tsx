import React, { createContext, useContext, useState, useEffect } from 'react';

export interface DigitalItem {
  eventId: string;
  shortId: string;
}

export interface PhysicalItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedPhotos: string[]; // URLs or shortIds
  category?: string;
  eventId: string;
}

interface CartContextType {
  digitalPhotos: DigitalItem[];
  physicalItems: PhysicalItem[];
  addToCart: (eventId: string, shortId: string) => void;
  removeFromCart: (eventId: string, shortId: string) => void;
  addPhysicalItem: (item: PhysicalItem) => void;
  removePhysicalItem: (productId: string) => void;
  updatePhysicalQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: (eventPricePerPhoto: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [digitalPhotos, setDigitalPhotos] = useState<DigitalItem[]>([]);
  const [physicalItems, setPhysicalItems] = useState<PhysicalItem[]>([]);

  // Carregar do localStorage ao iniciar
  useEffect(() => {
    const savedDigital = localStorage.getItem('fs_cart_digital');
    const savedPhysical = localStorage.getItem('fs_cart_physical');
    if (savedDigital) setDigitalPhotos(JSON.parse(savedDigital));
    if (savedPhysical) setPhysicalItems(JSON.parse(savedPhysical));
  }, []);

  // Salvar no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('fs_cart_digital', JSON.stringify(digitalPhotos));
    localStorage.setItem('fs_cart_physical', JSON.stringify(physicalItems));
  }, [digitalPhotos, physicalItems]);

  const addToCart = (eventId: string, shortId: string) => {
    setDigitalPhotos(prev => {
      const exists = prev.some(item => item.eventId === eventId && item.shortId === shortId);
      if (exists) return prev;
      return [...prev, { eventId, shortId }];
    });
  };

  const removeFromCart = (eventId: string, shortId: string) => {
    setDigitalPhotos(prev => prev.filter(item => !(item.eventId === eventId && item.shortId === shortId)));
  };

  const addPhysicalItem = (item: PhysicalItem) => {
    setPhysicalItems(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.eventId === item.eventId);
      if (existing) {
        return prev.map(i => (i.productId === item.productId && i.eventId === item.eventId)
          ? { ...i, quantity: i.quantity + item.quantity, selectedPhotos: [...new Set([...i.selectedPhotos, ...item.selectedPhotos])] }
          : i
        );
      }
      return [...prev, item];
    });
  };

  const removePhysicalItem = (productId: string) => {
    setPhysicalItems(prev => prev.filter(i => i.productId !== productId));
  };

  const updatePhysicalQuantity = (productId: string, quantity: number) => {
    setPhysicalItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i));
  };

  const clearCart = () => {
    setDigitalPhotos([]);
    setPhysicalItems([]);
    localStorage.removeItem('fs_cart_digital');
    localStorage.removeItem('fs_cart_physical');
  };

  const totalItems = digitalPhotos.length + physicalItems.reduce((acc, i) => acc + i.quantity, 0);

  const totalPrice = (eventPricePerPhoto: number) => {
    // Nota: simplificação aqui assume que todas as fotos digitais têm o mesmo preço do evento atual
    // Em um cenário multi-evento, precisaríamos do preço de cada evento.
    const digitalTotal = digitalPhotos.length * eventPricePerPhoto;
    const physicalTotal = physicalItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    return digitalTotal + physicalTotal;
  };

  return (
    <CartContext.Provider value={{
      digitalPhotos,
      physicalItems,
      addToCart,
      removeFromCart,
      addPhysicalItem,
      removePhysicalItem,
      updatePhysicalQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
