import "dotenv/config";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { app } from "./app";
import { hashPassword } from "./auth";
import { db } from "./db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrapDefaultAdminIfNeeded() {
  const count = await db.countAdminUsers();
  if (count === 0) {
    const email =
      process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@flavoursofindia.com";
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || "Admin@12345";
    const name = "Flavours Admin";

    const passwordHash = await hashPassword(password);
    await db.createAdminUser({ email, passwordHash, name, role: "admin" });
    console.log(`[BOOTSTRAP] Created initial admin user: ${email}`);
  }
}

async function startServer() {
  await bootstrapDefaultAdminIfNeeded();

  const server = createServer(app);

  // Serve static assets
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));
  app.use(
    "/manus-storage",
    express.static(
      path.resolve(process.cwd(), "client", "public", "manus-storage")
    )
  );

  // Handle client-side routing in production (serve index.html for non-API routes)
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(staticPath, "index.html"), err => {
      if (err) {
        // Fallback for dev mode where index.html might be at client/index.html
        res.sendFile(
          path.resolve(process.cwd(), "client", "index.html"),
          () => {
            res.status(200).send("Flavours of India API Server");
          }
        );
      }
    });
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(
      `Flavours of India server running on http://localhost:${port}/`
    );
  });
}

startServer().catch(console.error);
