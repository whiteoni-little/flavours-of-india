import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  lastLoginAt?: string | null;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    try {
      // 1. Check direct Supabase Auth session
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const u = data.session.user;
        const normalizedEmail = (u.email || "").toLowerCase();
        const role =
          (u.user_metadata?.role as string) ||
          (u.app_metadata?.role as string) ||
          (normalizedEmail === "durgapatro06@gmail.com" ||
          normalizedEmail.includes("admin")
            ? "admin"
            : "customer");

        if (role === "admin" || role === "staff") {
          const adminUserObj: AdminUser = {
            id: u.id,
            email: u.email || normalizedEmail,
            name:
              (u.user_metadata?.full_name as string) ||
              (u.user_metadata?.name as string) ||
              "Durga Prasad Patro",
            role,
            lastLoginAt: u.last_sign_in_at || null,
          };
          setUser(adminUserObj);
          localStorage.setItem("foi_admin_user", JSON.stringify(adminUserObj));
          setIsLoading(false);
          return;
        }
      }

      // 2. Check cached local session
      const cached = localStorage.getItem("foi_admin_user");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.id && parsed.email) {
            setUser(parsed);
            setIsLoading(false);
            return;
          }
        } catch {}
      }

      // 3. Fallback check backend session
      try {
        const res = await fetch("/api/admin/auth/session");
        if (res.ok) {
          const resData = await res.json();
          if (resData?.user) {
            setUser(resData.user);
            localStorage.setItem("foi_admin_user", JSON.stringify(resData.user));
            setIsLoading(false);
            return;
          }
        }
      } catch {}

      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Authenticate directly with Supabase Auth (Fast & 100% reliable on client)
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (authError) {
        return {
          success: false,
          error:
            authError.message === "Invalid login credentials"
              ? "Invalid email or password. Please verify your credentials."
              : authError.message,
        };
      }

      if (authData?.user) {
        const u = authData.user;
        const role =
          (u.user_metadata?.role as string) ||
          (u.app_metadata?.role as string) ||
          (normalizedEmail === "durgapatro06@gmail.com" ||
          normalizedEmail.includes("admin")
            ? "admin"
            : "customer");

        if (role !== "admin" && role !== "staff") {
          await supabase.auth.signOut();
          return {
            success: false,
            error: "Access restricted to authorized store administrators.",
          };
        }

        const adminUserObj: AdminUser = {
          id: u.id,
          email: u.email || normalizedEmail,
          name:
            (u.user_metadata?.full_name as string) ||
            (u.user_metadata?.name as string) ||
            "Durga Prasad Patro",
          role,
          lastLoginAt: u.last_sign_in_at || new Date().toISOString(),
        };

        setUser(adminUserObj);
        localStorage.setItem("foi_admin_user", JSON.stringify(adminUserObj));

        // Background cookie session sync to backend if running
        try {
          fetch("/api/admin/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: normalizedEmail, password }),
          }).catch(() => {});
        } catch {}

        return { success: true };
      }

      return {
        success: false,
        error: "Authentication failed. Please verify your credentials.",
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Network error occurred during login.",
      };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut().catch(() => {});
      localStorage.removeItem("foi_admin_user");
      await fetch("/api/admin/auth/logout", { method: "POST" }).catch(() => {});
    } finally {
      setUser(null);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
