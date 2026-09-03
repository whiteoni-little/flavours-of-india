import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Clock, RefreshCw, Send, XCircle } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  orderId: string | null;
  channel: string;
  notificationType: string;
  recipient: string;
  title: string;
  body: string;
  status: "queued" | "sent" | "failed";
  retryCount: number;
  errorMessage: string | null;
  createdAt: string;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/notifications?page=1&pageSize=50");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
      toast.error("Failed to load notifications log");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      const res = await fetch(`/api/admin/notifications/${id}/retry`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Notification delivery re-attempt queued successfully");
        loadNotifications();
      } else {
        toast.error("Failed to retry notification");
      }
    } catch (err) {
      toast.error("Network error retrying notification");
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "sent") {
      return (
        <span className="status-badge" style={{ background: "#DCFCE7", color: "#166534" }}>
          <CheckCircle2 size={12} style={{ marginRight: "4px" }} /> Delivered
        </span>
      );
    }
    if (status === "failed") {
      return (
        <span className="status-badge" style={{ background: "#FEE2E2", color: "#991B1B" }}>
          <XCircle size={12} style={{ marginRight: "4px" }} /> Failed
        </span>
      );
    }
    return (
      <span className="status-badge" style={{ background: "#FEF3C7", color: "#92400E" }}>
        <Clock size={12} style={{ marginRight: "4px" }} /> Queued
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">Transactional Messaging & Audits</p>
          <h1>Notifications Queue</h1>
        </div>
        <button onClick={loadNotifications} className="quiet-button" style={{ fontSize: "13px" }}>
          <RefreshCw size={14} /> Refresh Log
        </button>
      </div>

      <div className="panel" style={{ padding: 0, overflowX: "auto" }}>
        {isLoading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)" }}>
            Loading notification records...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)" }}>
            <Bell size={32} strokeWidth={1.5} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <p>No notifications queued yet. Actions like COD confirmation or shipment will appear here.</p>
          </div>
        ) : (
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--sunken)", borderBottom: "1px solid var(--border)", textAlign: "left", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                <th style={{ padding: "12px 16px" }}>Event Type</th>
                <th style={{ padding: "12px 16px" }}>Recipient & Channel</th>
                <th style={{ padding: "12px 16px" }}>Message Preview</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Time</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(notif => (
                <tr key={notif.id} style={{ borderBottom: "1px solid var(--border)", fontSize: "13px" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <strong style={{ color: "var(--ink)", textTransform: "capitalize" }}>
                      {notif.notificationType.replace(/_/g, " ")}
                    </strong>
                    {notif.orderId && (
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>Order: {notif.orderId.slice(0, 8)}...</div>
                    )}
                  </td>

                  <td style={{ padding: "14px 16px" }}>
                    <div>{notif.recipient}</div>
                    <small style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: "10px", fontWeight: 600 }}>
                      {notif.channel}
                    </small>
                  </td>

                  <td style={{ padding: "14px 16px", maxWidth: "320px" }}>
                    <strong style={{ display: "block", color: "var(--ink)" }}>{notif.title}</strong>
                    <span style={{ color: "var(--secondary)", fontSize: "12px" }}>{notif.body}</span>
                  </td>

                  <td style={{ padding: "14px 16px" }}>
                    {getStatusBadge(notif.status)}
                    {notif.retryCount > 0 && (
                      <small style={{ display: "block", color: "var(--muted)", fontSize: "10px" }}>
                        Retried {notif.retryCount} time(s)
                      </small>
                    )}
                  </td>

                  <td style={{ padding: "14px 16px", color: "var(--muted)", fontSize: "12px" }}>
                    {new Date(notif.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    {notif.status !== "sent" && (
                      <button
                        onClick={() => handleRetry(notif.id)}
                        className="quiet-button"
                        style={{ padding: "4px 8px", fontSize: "12px" }}
                        disabled={retryingId === notif.id}
                      >
                        <Send size={12} /> {retryingId === notif.id ? "Sending..." : "Retry"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
