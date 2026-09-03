import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { db } from "./db";
import type { AdminUser, UserProfile, UserRole } from "./db/schema";
import { getSupabaseAdmin, isSupabaseConfigured } from "./db/supabaseClient";

export interface AuthenticatedRequest extends Request {
  adminUser?: AdminUser;
  adminSessionId?: string;
  userProfile?: UserProfile;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Middleware: Requires Admin role ('admin' only).
 */
export async function requireAdminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  return authenticateUserWithRoles(req, res, next, ["admin"]);
}

/**
 * Middleware: Requires Staff or Admin role ('admin' or 'staff').
 */
export async function requireStaffOrAdminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  return authenticateUserWithRoles(req, res, next, ["admin", "staff"]);
}

async function authenticateUserWithRoles(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  allowedRoles: UserRole[]
) {
  // 1. Check Authorization Bearer Token
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

  const cookieSessionId = req.cookies?.[COOKIE_NAME];

  if (!token && !cookieSessionId) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Admin authentication credentials required",
    });
  }

  // 2. If Supabase is configured, verify with Supabase Auth
  if (isSupabaseConfigured() && token) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data: userData, error: authError } =
          await supabase.auth.getUser(token);

        if (authError || !userData?.user) {
          return res.status(401).json({
            error: "Unauthorized",
            message: "Invalid or expired Supabase authentication token",
          });
        }

        const authUser = userData.user;

        // Fetch profile to verify role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        const role: UserRole = (profile?.role as UserRole) || "customer";

        if (!allowedRoles.includes(role)) {
          return res.status(403).json({
            error: "Forbidden",
            message: `Insufficient permissions. Role required: ${allowedRoles.join(" or ")}`,
          });
        }

        req.adminUser = {
          id: authUser.id,
          email: authUser.email || "",
          name: profile?.full_name || authUser.user_metadata?.full_name || "Admin",
          role,
          createdAt: authUser.created_at,
          updatedAt: profile?.updated_at || authUser.created_at,
          lastLoginAt: authUser.last_sign_in_at || null,
        };
        req.userProfile = profile || undefined;
        return next();
      } catch (err: any) {
        console.error("Supabase auth error:", err);
        return res.status(500).json({
          error: "Internal Server Error",
          message: "Failed to authenticate session with Supabase Auth",
        });
      }
    }
  }

  // 3. Fallback / Cookie Session verification (Offline development and tests)
  if (cookieSessionId) {
    try {
      const result = await db.getAdminSession(cookieSessionId);
      if (!result) {
        res.clearCookie(COOKIE_NAME);
        return res.status(401).json({
          error: "Unauthorized",
          message: "Session expired or invalid",
        });
      }

      if (!allowedRoles.includes(result.user.role)) {
        return res.status(403).json({
          error: "Forbidden",
          message: `Insufficient permissions. Role required: ${allowedRoles.join(" or ")}`,
        });
      }

      req.adminUser = result.user;
      req.adminSessionId = cookieSessionId;
      return next();
    } catch (err: any) {
      console.error("Auth verification error:", err);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to authenticate session",
      });
    }
  }

  return res.status(401).json({
    error: "Unauthorized",
    message: "Valid authentication credentials required",
  });
}

export function setAdminSessionCookie(res: Response, sessionId: string) {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: ONE_YEAR_MS,
    path: "/",
  });
}

export function clearAdminSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}
