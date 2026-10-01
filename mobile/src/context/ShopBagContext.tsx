import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { Product } from '../api/client';

export interface BagLine {
  product: Product;
  quantity: number;
}

interface ShopBagContextValue {
  lines: BagLine[];
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  subtotal: number;
  itemCount: number;
}

const ShopBagContext = createContext<ShopBagContextValue | null>(null);

// Local-only bag for the finished-goods shop (retail/gift/wholesale products) —
// distinct from the server-backed raw-lot cart in src/api/client.ts (`api.lots`).
// It's small-basket, single-session shopping (a tourist buying a few bags, a
// diaspora gift order), so it doesn't need to survive an app restart or sync
// across devices the way the B2B lot cart does.
export function ShopBagProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BagLine[]>([]);

  function addItem(product: Product, quantity = product.minOrderQty || 1) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id
            ? { ...l, quantity: l.quantity + quantity }
            : l,
        );
      }
      return [...prev, { product, quantity }];
    });
  }

  function setQuantity(productId: string, quantity: number) {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.product.id !== productId);
      return prev.map((l) =>
        l.product.id === productId ? { ...l, quantity } : l,
      );
    });
  }

  function removeItem(productId: string) {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function clear() {
    setLines([]);
  }

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.product.priceUgx * l.quantity, 0),
    [lines],
  );
  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  );

  return (
    <ShopBagContext.Provider
      value={{ lines, addItem, setQuantity, removeItem, clear, subtotal, itemCount }}
    >
      {children}
    </ShopBagContext.Provider>
  );
}

export function useShopBag() {
  const ctx = useContext(ShopBagContext);
  if (!ctx) throw new Error('useShopBag must be used within ShopBagProvider');
  return ctx;
}
