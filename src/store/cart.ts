import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Extra {
  id: string;
  name: string;
  price: number;
}

interface SelectedExtra extends Extra {
  quantity: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  extras: SelectedExtra[];
  isFreeProduct?: boolean;
  couponId?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  addFreeItem: (item: { id: string; name: string; couponId: string }) => void;
  removeItem: (id: string) => void;
  removeFreeItems: (couponId?: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

const formatPrice = (price: number): number => {
  return Number((Math.round(price * 100) / 100).toFixed(2));
};

const calculateTotal = (items: CartItem[]): number => {
  return formatPrice(
    items.reduce((sum, item) => {
      if (item.isFreeProduct) return sum;
      const itemPrice = item.price + item.extras.reduce((extraSum, extra) => extraSum + (extra.price * extra.quantity), 0);
      return sum + (itemPrice * item.quantity);
    }, 0)
  );
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      getTotal: () => calculateTotal(get().items),
      addItem: (item) => {
        const items = get().items;

        const existingItemIndex = items.findIndex((i) => {
          if (i.id !== item.id) return false;
          if (i.isFreeProduct || item.isFreeProduct) return false;
          if (i.extras.length !== item.extras.length) return false;
          return i.extras.every(e1 =>
            item.extras.some(e2 => e2.id === e1.id && e2.quantity === e1.quantity)
          );
        });

        if (existingItemIndex > -1) {
          const newItems = [...items];
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            price: item.price,
            quantity: newItems[existingItemIndex].quantity + 1,
          };
          set({ items: newItems });
        } else {
          set({ items: [...items, { ...item, quantity: 1 }] });
        }
      },
      addFreeItem: (item) => {
        const items = get().items;
        const existingFreeItem = items.find(
          (i) => i.isFreeProduct && i.couponId === item.couponId
        );
        if (existingFreeItem) return;

        set({
          items: [
            ...items,
            {
              id: `free-${item.id}-${item.couponId}`,
              name: item.name,
              price: 0,
              quantity: 1,
              extras: [],
              isFreeProduct: true,
              couponId: item.couponId,
            },
          ],
        });
      },
      removeItem: (id) => {
        const items = get().items;
        set({
          items: items.filter((i) => i.id !== id),
        });
      },
      removeFreeItems: (couponId) => {
        const items = get().items;
        if (couponId) {
          set({
            items: items.filter((i) => !(i.isFreeProduct && i.couponId === couponId)),
          });
        } else {
          set({
            items: items.filter((i) => !i.isFreeProduct),
          });
        }
      },
      updateQuantity: (id, quantity) => {
        const items = get().items;

        if (quantity <= 0) {
          set({
            items: items.filter((i) => i.id !== id),
          });
        } else {
          set({
            items: items.map((i) =>
              i.id === id ? { ...i, quantity } : i
            ),
          });
        }
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
    }
  )
);
