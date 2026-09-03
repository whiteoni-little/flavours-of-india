import React, { useState } from "react";
import { AlertCircle, ArrowRight, Lock, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const logo = "/manus-storage/flavours-of-india-logo_4e9a9073.png";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to /admin
  React.useEffect(() => {
    if (isAuthenticated) {
      setLocation("/admin");
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await login(email.trim(), password);
    setIsLoading(false);

    if (result.success) {
      setLocation("/admin");
    } else {
      setError(
        result.error || "Authentication failed. Please check your credentials."
      );
    }
  };

  return (
    <div
      className="site-shell"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <div className="announcement">
        <Sparkles size={13} /> Flavours of India — Administrative Portal
      </div>

      <header className="site-header container">
        <Link href="/" className="brand-lockup">
          <img src={logo} className="brand-logo" alt="Flavours of India" />
          <span className="brand-tagline">Goodness from home</span>
        </Link>
        <Link href="/" className="text-link">
          ← Return to Storefront
        </Link>
      </header>

      <main
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          padding: "48px 16px 96px",
        }}
      >
        <div
          style={{
            maxWidth: "440px",
            width: "100%",
            background: "var(--raised)",
            border: "1px solid var(--border)",
            padding: "40px",
            boxShadow: "0 16px 36px rgba(32, 27, 22, 0.08)",
            borderRadius: "8px",
          }}
        >
          <div style={{ marginBottom: "28px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "var(--sunken)",
                color: "var(--terracotta)",
                display: "grid",
                placeItems: "center",
                marginBottom: "16px",
                borderRadius: "6px",
              }}
            >
              <Lock size={20} />
            </div>
            <p className="eyebrow" style={{ margin: "0 0 8px" }}>
              Authorized Access Only
            </p>
            <h1
              style={{
                font: "600 32px/1.1 var(--font-serif)",
                margin: 0,
              }}
            >
              Admin Workspace
            </h1>
            <p
              style={{
                color: "var(--secondary)",
                fontSize: "14px",
                margin: "10px 0 0",
                lineHeight: 1.6,
              }}
            >
              Secure administrative access for pantry operations, fulfillment, and catalogue management.
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "#FCE8E6",
                border: "1px solid #FAD2CF",
                color: "#C5221F",
                padding: "12px 16px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "20px",
                borderRadius: "4px",
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="admin-email"
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--muted)",
                  marginBottom: "8px",
                }}
              >
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your administrative email"
                autoComplete="email"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid var(--border)",
                  background: "var(--sunken)",
                  color: "var(--ink)",
                  fontSize: "14px",
                  borderRadius: "4px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="admin-password"
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--muted)",
                  marginBottom: "8px",
                }}
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid var(--border)",
                  background: "var(--sunken)",
                  color: "var(--ink)",
                  fontSize: "14px",
                  borderRadius: "4px",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="primary-button"
              style={{
                width: "100%",
                justifyContent: "center",
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
                padding: "14px",
              }}
            >
              {isLoading ? "Authenticating..." : "Sign in to workspace"}
              <ArrowRight size={17} />
            </button>
          </form>
        </div>
      </main>

      <footer
        className="site-footer container"
        style={{ marginTop: "auto", borderTop: "1px solid var(--border)", padding: "20px 0" }}
      >
        <div className="footer-brand" style={{ textAlign: "center", width: "100%" }}>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>© 2026 Flavours of India. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
