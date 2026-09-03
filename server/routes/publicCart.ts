import { Router } from "express";
import { z } from "zod";
import { db } from "../db";

export const publicCartRouter = Router();

const CART_COOKIE_NAME = "foi_cart_id";
const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

async function resolveCart(req: any, res: any) {
  let cartId = req.cookies?.[CART_COOKIE_NAME] || req.headers["x-cart-id"];

  if (cartId) {
    const existing = await db.getCartById(cartId);
    if (existing && existing.cart.status === "active") {
      return existing;
    }
  }

  // Create new cart
  const newCart = await db.getOrCreateCart(null, null);
  res.cookie(CART_COOKIE_NAME, newCart.id, {
    httpOnly: false, // Accessible to client cart helpers if needed
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ONE_YEAR_MS,
    path: "/",
  });

  return { cart: newCart, items: [] };
}

publicCartRouter.get("/", async (req, res) => {
  try {
    const data = await resolveCart(req, res);
    const subtotal = data.items.reduce((sum, item) => {
      const price =
        item.product?.priceInMinorUnits || item.unitPriceInMinorUnits || 0;
      return sum + price * item.quantity;
    }, 0);

    const totalCount = data.items.reduce((sum, item) => sum + item.quantity, 0);

    return res.json({
      cart: data.cart,
      items: data.items,
      totalCount,
      subtotalInMinorUnits: subtotal,
      currency: data.cart.currency || "INR",
    });
  } catch (err: any) {
    console.error("Error retrieving cart:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not retrieve cart",
    });
  }
});

const addItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1).default(1),
});

publicCartRouter.post("/items", async (req, res) => {
  try {
    const parseResult = addItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation error",
        details: parseResult.error.issues,
      });
    }

    const { productId, quantity } = parseResult.data;
    const product =
      (await db.getPublicProductBySlug(productId)) ||
      (await db.getAdminProductById(productId));

    if (!product || product.deletedAt || !product.isPublished) {
      return res.status(404).json({
        error: "Not Found",
        message: "Product is not available for purchase",
      });
    }

    const { cart } = await resolveCart(req, res);
    await db.addCartItem(cart.id, product.id, quantity);

    const updated = await db.getCartById(cart.id);
    const subtotal = (updated?.items || []).reduce((sum, item) => {
      const price =
        item.product?.priceInMinorUnits || item.unitPriceInMinorUnits || 0;
      return sum + price * item.quantity;
    }, 0);
    const totalCount = (updated?.items || []).reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    return res.json({
      cart: updated!.cart,
      items: updated!.items,
      totalCount,
      subtotalInMinorUnits: subtotal,
      currency: "INR",
    });
  } catch (err: any) {
    console.error("Error adding item to cart:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not add item to cart",
    });
  }
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(0),
});

publicCartRouter.patch("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = updateItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation error",
        details: parseResult.error.issues,
      });
    }

    const { cart } = await resolveCart(req, res);
    await db.updateCartItemQuantity(cart.id, id, parseResult.data.quantity);

    const updated = await db.getCartById(cart.id);
    const subtotal = (updated?.items || []).reduce((sum, item) => {
      const price =
        item.product?.priceInMinorUnits || item.unitPriceInMinorUnits || 0;
      return sum + price * item.quantity;
    }, 0);
    const totalCount = (updated?.items || []).reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    return res.json({
      cart: updated!.cart,
      items: updated!.items,
      totalCount,
      subtotalInMinorUnits: subtotal,
      currency: "INR",
    });
  } catch (err: any) {
    console.error("Error updating cart item:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not update item quantity",
    });
  }
});

publicCartRouter.delete("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { cart } = await resolveCart(req, res);
    await db.removeCartItem(cart.id, id);

    const updated = await db.getCartById(cart.id);
    const subtotal = (updated?.items || []).reduce((sum, item) => {
      const price =
        item.product?.priceInMinorUnits || item.unitPriceInMinorUnits || 0;
      return sum + price * item.quantity;
    }, 0);
    const totalCount = (updated?.items || []).reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    return res.json({
      cart: updated!.cart,
      items: updated!.items,
      totalCount,
      subtotalInMinorUnits: subtotal,
      currency: "INR",
    });
  } catch (err: any) {
    console.error("Error deleting cart item:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Could not remove cart item",
    });
  }
});
