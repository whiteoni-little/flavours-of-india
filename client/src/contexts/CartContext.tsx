import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface CartProduct {
  id: string;
  title: string;
  slug: string;
  priceInMinorUnits: number | null;
  currency: string;
  category: string;
  primaryImage?: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPriceInMinorUnits: number | null;
  product?: CartProduct;
}

interface CartContextType {
  items: CartItem[];
  totalCount: number;
  subtotalInMinorUnits: number;
  currency: string;
  isLoading: boolean;
  addItem: (
    productId: string,
    quantity?: number,
    productDetails?: Partial<CartProduct>
  ) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CART_STORAGE_KEY = "foi_cart_items_v2";

function loadStoredItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredItems(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn("Failed to persist cart items to localStorage:", err);
  }
}

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const price =
      item.product?.priceInMinorUnits || item.unitPriceInMinorUnits || 0;
    return sum + price * item.quantity;
  }, 0);
}

function calculateTotalCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadStoredItems());
  const [totalCount, setTotalCount] = useState<number>(() =>
    calculateTotalCount(loadStoredItems())
  );
  const [subtotalInMinorUnits, setSubtotalInMinorUnits] = useState<number>(() =>
    calculateSubtotal(loadStoredItems())
  );
  const [currency] = useState("INR");
  const [isLoading, setIsLoading] = useState(false);

  // Sync state helpers
  const applyItemsUpdate = (newItems: CartItem[]) => {
    setItems(newItems);
    setTotalCount(calculateTotalCount(newItems));
    setSubtotalInMinorUnits(calculateSubtotal(newItems));
    saveStoredItems(newItems);
  };

  // Listen to multi-tab changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) {
        const updated = loadStoredItems();
        setItems(updated);
        setTotalCount(calculateTotalCount(updated));
        setSubtotalInMinorUnits(calculateSubtotal(updated));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const refreshCart = async () => {
    // Non-blocking background sync of product prices / images from Supabase
    if (items.length === 0) return;
    try {
      const productIds = Array.from(new Set(items.map(i => i.productId)));
      const { data, error } = await supabase
        .from("products")
        .select("id, title, slug, price_in_minor_units, currency, category, product_images(*)")
        .in("id", productIds);

      if (!error && data && data.length > 0) {
        const prodMap = new Map(data.map(p => [p.id, p]));
        const updatedItems = items.map(item => {
          const p = prodMap.get(item.productId);
          if (!p) return item;
          const images = p.product_images || [];
          return {
            ...item,
            unitPriceInMinorUnits: p.price_in_minor_units ?? item.unitPriceInMinorUnits,
            product: {
              id: p.id,
              title: p.title,
              slug: p.slug,
              priceInMinorUnits: p.price_in_minor_units,
              currency: p.currency || "INR",
              category: p.category,
              primaryImage: images[0]?.public_url || item.product?.primaryImage,
            },
          };
        });
        applyItemsUpdate(updatedItems);
      }
    } catch (err) {
      console.warn("Background cart refresh failed:", err);
    }
  };

  const addItem = async (
    productId: string,
    quantity: number = 1,
    productDetails?: Partial<CartProduct>
  ): Promise<boolean> => {
    try {
      let product: CartProduct | undefined = undefined;

      if (productDetails && productDetails.title) {
        product = {
          id: productId,
          title: productDetails.title,
          slug: productDetails.slug || "",
          priceInMinorUnits: productDetails.priceInMinorUnits ?? null,
          currency: productDetails.currency || "INR",
          category: productDetails.category || "Pantry",
          primaryImage: productDetails.primaryImage,
        };
      } else {
        // Fetch product info directly from Supabase
        const { data } = await supabase
          .from("products")
          .select("id, title, slug, price_in_minor_units, currency, category, product_images(*)")
          .eq("id", productId)
          .maybeSingle();

        if (data) {
          const images = data.product_images || [];
          product = {
            id: data.id,
            title: data.title,
            slug: data.slug,
            priceInMinorUnits: data.price_in_minor_units,
            currency: data.currency || "INR",
            category: data.category,
            primaryImage: images[0]?.public_url,
          };
        }
      }

      const existingIndex = items.findIndex(i => i.productId === productId);
      let newItems: CartItem[];

      if (existingIndex >= 0) {
        newItems = items.map((item, idx) => {
          if (idx === existingIndex) {
            return {
              ...item,
              quantity: item.quantity + quantity,
              product: product || item.product,
            };
          }
          return item;
        });
      } else {
        const newItem: CartItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          cartId: "local_cart",
          productId,
          quantity,
          unitPriceInMinorUnits: product?.priceInMinorUnits ?? null,
          product,
        };
        newItems = [...items, newItem];
      }

      applyItemsUpdate(newItems);
      return true;
    } catch (err) {
      console.error("Failed to add cart item:", err);
      return false;
    }
  };

  const updateQuantity = async (
    itemId: string,
    quantity: number
  ): Promise<boolean> => {
    try {
      if (quantity <= 0) {
        return removeItem(itemId);
      }
      const newItems = items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      applyItemsUpdate(newItems);
      return true;
    } catch (err) {
      console.error("Failed to update cart item quantity:", err);
      return false;
    }
  };

  const removeItem = async (itemId: string): Promise<boolean> => {
    try {
      const newItems = items.filter(item => item.id !== itemId);
      applyItemsUpdate(newItems);
      return true;
    } catch (err) {
      console.error("Failed to delete cart item:", err);
      return false;
    }
  };

  const clearCart = async (): Promise<void> => {
    applyItemsUpdate([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        subtotalInMinorUnits,
        currency,
        isLoading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
