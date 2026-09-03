import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import { adminAuthRouter } from "./routes/adminAuth";
import { adminDashboardRouter } from "./routes/adminDashboard";
import { adminNotificationsRouter } from "./routes/adminNotifications";
import { adminOrdersRouter } from "./routes/adminOrders";
import { adminProductsRouter } from "./routes/adminProducts";
import { adminReturnsRouter } from "./routes/adminReturns";
import { adminSpreadsheetRouter } from "./routes/adminSpreadsheet";
import { localStorageRouter } from "./routes/localStorage";
import { publicCartRouter } from "./routes/publicCart";
import { publicCheckoutRouter } from "./routes/publicCheckout";
import { publicProductsRouter } from "./routes/publicProducts";

export function createApp() {
  const app = express();

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Admin Operations Endpoints
  app.use("/api/admin/auth", adminAuthRouter);
  app.use("/api/admin/products", adminProductsRouter);
  app.use("/api/admin/orders", adminOrdersRouter);
  app.use("/api/admin/returns", adminReturnsRouter);
  app.use("/api/admin/spreadsheet", adminSpreadsheetRouter);
  app.use("/api/admin/notifications", adminNotificationsRouter);
  app.use("/api/admin", adminDashboardRouter);

  // Customer Storefront Endpoints
  app.use("/api/products", publicProductsRouter);
  app.use("/api/cart", publicCartRouter);
  app.use("/api/checkout", publicCheckoutRouter);
  app.use("/api/storage", localStorageRouter);

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      productionReady: true,
    });
  });

  return app;
}

export const app = createApp();
