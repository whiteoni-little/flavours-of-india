import React, { useEffect, useState } from "react";
import {
  Bell,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Package,
  PackageCheck,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAdminAuth();
  const [productCount, setProductCount] = useState<number | null>(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/products?pageSize=1")
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && typeof data.total === "number") {
          setProductCount(data.total);
        }
      })
      .catch(() => {});

    fetch("/api/admin/dashboard/summary")
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) {
          const pending = (data.pendingCodOrders || 0) + (data.pendingUpiOrders || 0);
          setPendingOrdersCount(pending > 0 ? pending : null);
        }
      })
      .catch(() => {});
  }, [location]);

  const handleLogout = async () => {
    await logout();
    setLocation("/admin/login");
  };

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    {
      href: "/admin/products",
      label: "Products",
      icon: Package,
      badge: productCount,
    },
    {
      href: "/admin/orders",
      label: "Orders & Verification",
      icon: PackageCheck,
      badge: pendingOrdersCount,
      badgeColor: "var(--terracotta)",
    },
    {
      href: "/admin/import",
      label: "Spreadsheet Import",
      icon: FileSpreadsheet,
    },
    { href: "/admin/carts", label: "Abandoned Carts", icon: ShoppingBag },
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
    { href: "/admin/users", label: "Users & Roles", icon: Users },
  ];

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand">
          <span>FI</span>
          <div>
            <strong>Flavours of India</strong>
            <small>Operations workspace</small>
          </div>
        </Link>
        <nav>
          {navItems.map(({ href, label, icon: Icon, badge, badgeColor }) => (
            <Link
              href={href}
              className={location === href ? "admin-nav active" : "admin-nav"}
              key={label}
            >
              <Icon size={17} />
              {label}
              {badge !== null && badge !== undefined && (
                <span
                  className="nav-badge"
                  style={badgeColor ? { background: badgeColor, color: "#fff" } : undefined}
                >
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div>
              <span className="status-dot" /> Supabase Connected
              <br />
              <small>{user?.name || "Administrator"} ({user?.role || "admin"})</small>
            </div>
            <button
              onClick={handleLogout}
              className="table-action"
              title="Log out"
              style={{
                color: "#E4DCC9",
                padding: "6px",
                display: "grid",
                placeItems: "center",
                background: "rgba(255,255,255,0.06)",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
              }}
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
