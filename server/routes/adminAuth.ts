import { Router } from "express";
import { z } from "zod";
import { COOKIE_NAME } from "../../shared/const";
import {
  clearAdminSessionCookie,
  requireStaffOrAdminAuth,
  setAdminSessionCookie,
  verifyPassword,
  type AuthenticatedRequest,
} from "../auth";
import { db } from "../db";
import {
  getSupabaseAdmin,
  getSupabaseAnon,
  isSupabaseConfigured,
} from "../db/supabaseClient";

export const adminAuthRouter = Router();

const loginSchema = z.object({
  email: z.string().email("A valid email address is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

adminAuthRouter.post("/login", async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation error",
        details: parseResult.error.issues,
      });
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[AUTH DEBUG] Attempting login for: ${normalizedEmail}`);

    // 1. Supabase Auth login (Production)
    if (isSupabaseConfigured()) {
      const supabaseAnon = getSupabaseAnon();
      const supabaseAdmin = getSupabaseAdmin();

      if (supabaseAnon && supabaseAdmin) {
        const { data: authData, error: authError } =
          await supabaseAnon.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

        if (!authError && authData?.user && authData.session) {
          const user = authData.user;

          // Check user role in profiles table or user_metadata
          let role = "customer";
          try {
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .maybeSingle();

            if (profile?.role) {
              role = profile.role;
            }
          } catch {
            // profiles table might be created via migration
          }

          if (role === "customer") {
            role =
              user.user_metadata?.role ||
              user.app_metadata?.role ||
              (normalizedEmail.includes("admin") ||
              normalizedEmail === "durgapatro06@gmail.com"
                ? "admin"
                : "customer");
          }

          if (role !== "admin" && role !== "staff") {
            return res.status(403).json({
              error: "Forbidden",
              message: "Access restricted to authorized administrative personnel",
            });
          }

          // Set session cookie for web clients
          const expiresAt = new Date(authData.session.expires_at! * 1000);
          const localSession = await db.createAdminSession(user.id, expiresAt, {
            email: user.email,
            name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              "Admin",
            role: role as any,
          });
          setAdminSessionCookie(res, localSession.id);

          return res.json({
            success: true,
            token: authData.session.access_token,
            user: {
              id: user.id,
              email: user.email,
              name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                "Admin",
              role,
            },
          });
        }
      }
    }

    // 2. Local database verification (Offline development / fallback)
    const user = await db.getAdminUserByEmail(normalizedEmail);
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid email or password",
      });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid email or password",
      });
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const session = await db.createAdminSession(user.id, expiresAt);
    setAdminSessionCookie(res, session.id);
    await db.updateAdminUserLastLogin(user.id);

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred during authentication",
    });
  }
});

adminAuthRouter.post("/logout", async (req: AuthenticatedRequest, res) => {
  try {
    const sessionId =
      req.cookies?.[COOKIE_NAME] ||
      req.cookies?.foi_admin_session ||
      req.adminSessionId;
    if (sessionId) {
      await db.deleteAdminSession(sessionId);
    }
    clearAdminSessionCookie(res);
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (err: any) {
    console.error("Logout error:", err);
    clearAdminSessionCookie(res);
    return res.json({ success: true });
  }
});

adminAuthRouter.get(
  "/session",
  requireStaffOrAdminAuth,
  async (req: AuthenticatedRequest, res) => {
    return res.json({
      authenticated: true,
      user: req.adminUser,
    });
  }
);
