import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { safeStorage, type CartItem } from "@/lib/store";

interface StoreState {
  // cart
  cart: CartItem[];
  addToCart: (productId: number, qty?: number) => void;
  removeFromCart: (productId: number) => void;
  setQty: (productId: number, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  // favorites
  favorites: number[];
  toggleFavorite: (productId: number) => void;
  // theme
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from safe storage (guarded — may be unavailable in sandboxed iframes)
  useEffect(() => {
    try {
      const c = safeStorage.get("bm_cart");
      if (c) setCart(JSON.parse(c));
    } catch {
      /* ignore */
    }
    try {
      const f = safeStorage.get("bm_favorites");
      if (f) setFavorites(JSON.parse(f));
    } catch {
      /* ignore */
    }
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
    setHydrated(true);
  }, []);

  // Persist (best effort)
  useEffect(() => {
    if (hydrated) safeStorage.set("bm_cart", JSON.stringify(cart));
  }, [cart, hydrated]);
  useEffect(() => {
    if (hydrated) safeStorage.set("bm_favorites", JSON.stringify(favorites));
  }, [favorites, hydrated]);

  // Apply theme class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const addToCart = (productId: number, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, qty: Math.min(99, i.qty + qty) } : i,
        );
      }
      return [...prev, { productId, qty }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const setQty = (productId: number, qty: number) => {
    if (qty < 1) return removeFromCart(productId);
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, qty: Math.min(99, qty) } : i)));
  };

  const clearCart = () => setCart([]);

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const value: StoreState = {
    cart,
    addToCart,
    removeFromCart,
    setQty,
    clearCart,
    cartCount: cart.reduce((sum, i) => sum + i.qty, 0),
    favorites,
    toggleFavorite,
    theme,
    toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
