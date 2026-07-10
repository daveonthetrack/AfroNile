import { create } from 'zustand';

export interface CartItem {
  id: string; // product id or SKU
  title: string;
  priceCents: number;
  quantity: number;
  sku: string;
  type: string; // MERCHANDISE, TICKET_DIGITAL, VIP_EXPERIENCE
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),

  addItem: (newItem) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.id === newItem.id);
      
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.id === newItem.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
          isOpen: true, // Auto-open cart drawer when item is added
        };
      }

      return {
        items: [...state.items, { ...newItem, quantity: 1 }],
        isOpen: true,
      };
    });
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  getCartTotal: () => {
    return get().items.reduce((total, item) => total + item.priceCents * item.quantity, 0);
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
