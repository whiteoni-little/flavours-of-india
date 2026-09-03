import React, { createContext, useContext, useEffect, useState } from "react";

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

export interface CartData {
  id: string;
  status: string;
  currency: string;
}

interface CartContextType {
  items: CartItem[];
  totalCount: number;
  subtotalInMinorUnits: number;
  currency: string;
  isLoading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [subtotalInMinorUnits, setSubtotalInMinorUnits] = useState(0);
  const [currency, setCurrency] = useState("INR");
  const [isLoading, setIsLoading] = useState(true);

  const refreshCart = async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalCount(data.totalCount || 0);
        setSubtotalInMinorUnits(data.subtotalInMinorUnits || 0);
        setCurrency(data.currency || "INR");
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addItem = async (
    productId: string,
    quantity: number = 1
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      setItems(data.items || []);
      setTotalCount(data.totalCount || 0);
      setSubtotalInMinorUnits(data.subtotalInMinorUnits || 0);
      setCurrency(data.currency || "INR");
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
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      setItems(data.items || []);
      setTotalCount(data.totalCount || 0);
      setSubtotalInMinorUnits(data.subtotalInMinorUnits || 0);
      return true;
    } catch (err) {
      console.error("Failed to update cart item quantity:", err);
      return false;
    }
  };

  const removeItem = async (itemId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) return false;

      const data = await res.json();
      setItems(data.items || []);
      setTotalCount(data.totalCount || 0);
      setSubtotalInMinorUnits(data.subtotalInMinorUnits || 0);
      return true;
    } catch (err) {
      console.error("Failed to delete cart item:", err);
      return false;
    }
  };

  const clearCart = async (): Promise<void> => {
    setItems([]);
    setTotalCount(0);
    setSubtotalInMinorUnits(0);
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
