"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Cart, CartItem } from "@/lib/types/cart";

interface CartContextType {
  cart: Cart;
  addItem: (item: Omit<CartItem, "cartItemId">) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItem: (cartItemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "tc-cart";

function generateId() {
  return `ci_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadCart(): Cart {
  if (typeof window === "undefined") return { items: [] };
  try {
    const stored = localStorage.getItem(CART_KEY);
    if (!stored) return { items: [] };
    const cart = JSON.parse(stored) as Cart;
    // Backfill cartItemId for items from older sessions
    cart.items = cart.items.map((i) => ({
      ...i,
      cartItemId: i.cartItemId || generateId(),
    }));
    return cart;
  } catch {
    return { items: [] };
  }
}

function saveCart(cart: Cart) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [] });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCart(loadCart());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveCart(cart);
  }, [cart, mounted]);

  const addItem = useCallback((item: Omit<CartItem, "cartItemId">) => {
    setCart((prev) => {
      // Check for duplicate: same product + same personalisation
      const existing = prev.items.find(
        (i) =>
          i.productId === item.productId &&
          JSON.stringify(i.personalisationData) ===
            JSON.stringify(item.personalisationData)
      );
      if (existing) {
        return {
          items: prev.items.map((i) =>
            i.cartItemId === existing.cartItemId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { items: [...prev.items, { ...item, cartItemId: generateId() }] };
    });
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setCart((prev) => ({
      items: prev.items.filter((i) => i.cartItemId !== cartItemId),
    }));
  }, []);

  const updateQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      if (quantity < 1) return;
      setCart((prev) => ({
        items: prev.items.map((i) =>
          i.cartItemId === cartItemId ? { ...i, quantity } : i
        ),
      }));
    },
    []
  );

  const updateItem = useCallback(
    (cartItemId: string, updates: Partial<CartItem>) => {
      setCart((prev) => ({
        items: prev.items.map((i) =>
          i.cartItemId === cartItemId ? { ...i, ...updates } : i
        ),
      }));
    },
    []
  );

  const clearCart = useCallback(() => {
    setCart({ items: [] });
  }, []);

  // itemCount = number of distinct products, not total quantity
  const itemCount = cart.items.length;
  const total = cart.items.reduce(
    (t, i) => t + i.unitPrice * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateQuantity,
        updateItem,
        clearCart,
        itemCount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
