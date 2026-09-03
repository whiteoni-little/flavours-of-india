import { useEffect, useState } from "react";
import {
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  Package,
  PackageCheck,
  ShoppingBag,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

export default function AdminDashboard() {
  const { user } = useAdminAuth();
  const [summary, setSummary] = useState<{
    cartsStarted: number;
    cartsAbandoned: number;
    cartsConverted: number;
    conversionRate: number;
    totalProducts: number;
    draftProducts: number;
    publishedProducts: number;
    totalOrders?: number;
    pendingCodOrders?: number;
    pendingUpiOrders?: number;
    pendingPackingTasks?: number;
    inTransitShipments?: number;
    totalRevenueInMinorUnits?: number;
    recentActivities: Array<{
      id: string;
      title: string;
      subtitle: string;
      time: string;
      type: string;
    }>;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard/summary")
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) setSummary(data);
      })
      .catch(err => console.error("Failed to load dashboard summary:", err));
  }, []);

  const todayStr = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "FOI";

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">{todayStr}</p>
          <h1>
            Good morning, {user?.name ? user.name.split(" ")[0] : "team"}.
          </h1>
        </div>
        <div className="admin-user" title={user?.email}>
          {userInitials}
          <span>{user?.name || "Admin"}</span>
        </div>
      </div>

      <div className="sample-banner">
        Supabase production workspace active. Single source of truth for products, orders, COD/UPI verification, packing, and shipments.
      </div>

      <section className="metric-grid">
        <div className="metric-card">
          <span>Live published products</span>
          <strong>{summary ? summary.publishedProducts : "—"}</strong>
          <small>{summary?.totalProducts || 0} total SKUs in catalogue</small>
        </div>

        <div className="metric-card">
          <span>Pending verification</span>
          <strong style={{ color: "var(--terracotta)" }}>
            {summary ? (summary.pendingCodOrders || 0) + (summary.pendingUpiOrders || 0) : "—"}
          </strong>
          <small>
            {summary?.pendingCodOrders || 0} COD + {summary?.pendingUpiOrders || 0} UPI
          </small>
        </div>

        <div className="metric-card">
          <span>Packing & Shipments</span>
          <strong style={{ color: "var(--gold)" }}>
            {summary?.pendingPackingTasks || 0}
          </strong>
          <small>
            {summary?.inTransitShipments || 0} orders in transit
          </small>
        </div>

        <div className="metric-card">
          <span>Cart conversion rate</span>
          <strong>{summary ? `${summary.conversionRate}%` : "—"}</strong>
          <small style={{ color: "var(--olive)" }}>
            {summary?.cartsConverted || 0} converted carts
          </small>
        </div>
      </section>

      <section className="admin-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Catalogue & Order Health</p>
              <h2>Operational Status</h2>
            </div>
            <Link href="/admin/orders" className="quiet-button">
              View orders <ChevronRight size={15} />
            </Link>
          </div>

          <div
            className="chart-placeholder"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              background: "var(--sunken)",
              padding: "24px",
            }}
          >
            <div style={{ width: "100%", maxWidth: "380px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  marginBottom: "8px",
                }}
              >
                <span>Published Catalogue</span>
                <strong>
                  {summary?.publishedProducts || 0} /{" "}
                  {summary?.totalProducts || 0} items
                </strong>
              </div>
              <div
                style={{
                  height: "8px",
                  background: "var(--border)",
                  width: "100%",
                  borderRadius: "4px",
                  overflow: "hidden",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: "var(--olive)",
                    width: `${summary?.totalProducts ? (summary.publishedProducts / summary.totalProducts) * 100 : 0}%`,
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  marginBottom: "8px",
                }}
              >
                <span>Cart Conversion Health</span>
                <strong>{summary?.conversionRate || 0}%</strong>
              </div>
              <div
                style={{
                  height: "8px",
                  background: "var(--border)",
                  width: "100%",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: "var(--gold)",
                    width: `${summary?.conversionRate || 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="panel quick-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Workspace</p>
              <h2>Quick Actions</h2>
            </div>
          </div>
          <Link href="/admin/orders" className="quick-action">
            <span>
              <PackageCheck size={18} />
            </span>
            <div>
              <strong>Verify orders & payments</strong>
              <small>Confirm COD & verify manual UPI references</small>
            </div>
            <ChevronRight size={16} />
          </Link>
          <Link href="/admin/import" className="quick-action">
            <span>
              <FileSpreadsheet size={18} />
            </span>
            <div>
              <strong>Import spreadsheet</strong>
              <small>Upload catalogue or reconciliation files with dry-run</small>
            </div>
            <ChevronRight size={16} />
          </Link>
          <Link href="/admin/products" className="quick-action">
            <span>
              <Package size={18} />
            </span>
            <div>
              <strong>Manage products</strong>
              <small>Add, edit, publish, or archive items</small>
            </div>
            <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      <section className="panel activity-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Latest Events</p>
            <h2>What Needs Attention</h2>
          </div>
          <Link href="/admin/orders" className="quiet-button">
            View all <ChevronRight size={15} />
          </Link>
        </div>

        {summary?.recentActivities && summary.recentActivities.length > 0 ? (
          summary.recentActivities.map(act => (
            <div className="activity-row" key={act.id}>
              <span className="activity-icon">
                {act.type === "order" || act.type === "payment" ? (
                  <PackageCheck size={16} />
                ) : act.type === "cart" ? (
                  <WalletCards size={16} />
                ) : (
                  <ClipboardList size={16} />
                )}
              </span>
              <div>
                <strong>{act.title}</strong>
                <small>{act.subtitle}</small>
              </div>
              <span className="activity-time">{act.time}</span>
            </div>
          ))
        ) : (
          <div className="activity-row">
            <span className="activity-icon">
              <ClipboardList size={16} />
            </span>
            <div>
              <strong>Workspace is active</strong>
              <small>No critical pending alerts</small>
            </div>
            <span className="activity-time">Now</span>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
