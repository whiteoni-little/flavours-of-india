import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  MessageCircle,
  MessageSquare,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";

export default function AdminCarts() {
  const [carts, setCarts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Notes Modal state
  const [activeCartForNotes, setActiveCartForNotes] = useState<any | null>(
    null
  );
  const [notes, setNotes] = useState<any[]>([]);
  const [newNoteBody, setNewNoteBody] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Reminder notification banner
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  const fetchCarts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      params.set("pageSize", "50");

      const res = await fetch(`/api/admin/carts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCarts(data.carts || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load carts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
  }, [selectedStatus]);

  const handleMarkContacted = async (cartId: string) => {
    try {
      const res = await fetch(`/api/admin/carts/${cartId}/contacted`, {
        method: "POST",
      });
      if (res.ok) {
        fetchCarts();
      }
    } catch (err) {
      console.error("Failed to update cart status:", err);
    }
  };

  const handleOpenNotes = async (cart: any) => {
    setActiveCartForNotes(cart);
    setNewNoteBody("");
    try {
      const res = await fetch(`/api/admin/carts/${cart.id}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (err) {
      console.error("Failed to load notes:", err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteBody.trim() || !activeCartForNotes) return;

    setSavingNote(true);
    try {
      const res = await fetch(
        `/api/admin/carts/${activeCartForNotes.id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: newNoteBody.trim() }),
        }
      );

      if (res.ok) {
        const note = await res.json();
        setNotes(prev => [note, ...prev]);
        setNewNoteBody("");
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleReminderClick = async (cartId: string) => {
    try {
      const res = await fetch(`/api/admin/carts/${cartId}/remind-email`, {
        method: "POST",
      });
      const data = await res.json();
      setReminderToast(
        data.message || "Messaging provider not configured in this environment."
      );
      setTimeout(() => setReminderToast(null), 5000);
    } catch {
      setReminderToast(
        "Messaging provider not configured in this environment."
      );
      setTimeout(() => setReminderToast(null), 5000);
    }
  };

  const formatPrice = (minorUnits: number) => {
    if (!minorUnits) return "—";
    return `₹${(minorUnits / 100).toFixed(0)}`;
  };

  const formatTimeAgo = (isoDate: string) => {
    if (!isoDate) return "—";
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const filteredCarts = carts.filter(c => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      c.customerName?.toLowerCase().includes(term) ||
      c.customerEmail?.toLowerCase().includes(term) ||
      c.itemsDescription?.toLowerCase().includes(term)
    );
  });

  return (
    <AdminLayout>
      <div className="admin-topbar product-topbar">
        <div>
          <Link href="/admin" className="admin-back">
            <ArrowLeft size={15} /> Overview
          </Link>
          <p className="eyebrow">Customer recovery</p>
          <h1>Abandoned carts</h1>
        </div>
        <button
          className="admin-primary"
          onClick={() => {
            setReminderToast(
              "Email and WhatsApp reminder automation is unconfigured in this environment."
            );
            setTimeout(() => setReminderToast(null), 5000);
          }}
        >
          <MessageCircle size={17} /> Reminder settings
        </button>
      </div>

      {reminderToast && (
        <div
          style={{
            background: "var(--sunken)",
            border: "1px solid var(--gold)",
            color: "#765C37",
            padding: "12px 16px",
            fontSize: "13px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{reminderToast}</span>
          <button
            onClick={() => setReminderToast(null)}
            style={{
              background: "none",
              border: 0,
              color: "var(--muted)",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="sample-banner">
        Customer carts CRM connected. Review session items, mark recovery
        contacts, and log customer interactions.
      </div>

      <div className="product-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search by customer, email, or snack items"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ position: "relative" }}>
          <select
            className="filter-button"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            style={{
              appearance: "none",
              paddingRight: "30px",
              height: "42px",
              outline: 0,
            }}
          >
            <option value="all">All statuses</option>
            <option value="abandoned">Abandoned</option>
            <option value="contacted">Contacted</option>
            <option value="recovered">Recovered</option>
            <option value="active">Active</option>
          </select>
          <ChevronDown
            size={15}
            style={{
              position: "absolute",
              right: "10px",
              top: "14px",
              pointerEvents: "none",
              color: "var(--muted)",
            }}
          />
        </div>
      </div>

      <section className="admin-table-panel">
        <div className="table-caption">
          <span>{total} customer cart records</span>
          <span>Sorted by recent shopper activity</span>
        </div>

        {loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            Loading carts...
          </div>
        ) : filteredCarts.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <p
              style={{ font: "600 20px var(--font-serif)", margin: "0 0 8px" }}
            >
              No carts found
            </p>
            <p style={{ color: "var(--secondary)", fontSize: "14px" }}>
              No carts matching your current filter. As customers add items to
              their bags on the storefront, carts appear here automatically.
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Items in bag</th>
                <th>Cart value</th>
                <th>Last activity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCarts.map((c, idx) => {
                const initial = c.customerName
                  ? c.customerName.charAt(0).toUpperCase()
                  : "G";
                const toneClass = `tone-0${(idx % 4) + 1}`;

                return (
                  <tr key={c.id}>
                    <td>
                      <div className="table-product">
                        <span className={`table-thumb ${toneClass}`}>
                          {initial}
                        </span>
                        <div>
                          <strong>{c.customerName}</strong>
                          <small>{c.customerEmail}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", color: "var(--ink)" }}>
                        {c.itemsDescription}
                      </span>
                      <small
                        style={{ display: "block", color: "var(--muted)" }}
                      >
                        {c.itemsCount} total items
                      </small>
                    </td>
                    <td className="gold-text">
                      {formatPrice(c.totalValueInMinorUnits)}
                    </td>
                    <td>{formatTimeAgo(c.lastActivityAt)}</td>
                    <td>
                      <span
                        className={`stock-pill ${
                          c.status === "recovered" || c.status === "converted"
                            ? "in"
                            : c.status === "contacted"
                              ? "draft"
                              : ""
                        }`}
                        style={
                          c.status === "contacted"
                            ? { background: "#EFE0C9", color: "#765C37" }
                            : undefined
                        }
                      >
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="table-action"
                          title="View & add CRM notes"
                          onClick={() => handleOpenNotes(c)}
                          aria-label="View CRM notes"
                        >
                          <MessageSquare size={15} />
                        </button>
                        {c.status === "abandoned" && (
                          <button
                            className="table-action"
                            title="Mark as contacted"
                            onClick={() => handleMarkContacted(c.id)}
                            aria-label="Mark as contacted"
                          >
                            <Check size={15} />
                          </button>
                        )}
                        <button
                          className="table-action"
                          title="Send recovery reminder (Stub)"
                          onClick={() => handleReminderClick(c.id)}
                          aria-label="Send reminder"
                        >
                          <MessageCircle size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Cart Notes Modal */}
      {activeCartForNotes && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(32, 27, 22, 0.65)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: "16px",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notes-dialog-title"
        >
          <div
            style={{
              background: "var(--raised)",
              border: "1px solid var(--border)",
              maxWidth: "520px",
              width: "100%",
              padding: "32px",
              boxShadow: "0 20px 40px rgba(32, 27, 22, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
              }}
            >
              <div>
                <p className="eyebrow" style={{ margin: "0 0 4px" }}>
                  Customer Notes
                </p>
                <h2
                  id="notes-dialog-title"
                  style={{ font: "600 24px var(--font-serif)", margin: 0 }}
                >
                  {activeCartForNotes.customerName}
                </h2>
              </div>
              <button
                onClick={() => setActiveCartForNotes(null)}
                style={{
                  background: "none",
                  border: 0,
                  color: "var(--muted)",
                  padding: "4px",
                  cursor: "pointer",
                }}
                aria-label="Close notes"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNote} style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--muted)",
                  marginBottom: "6px",
                }}
              >
                Add follow-up note
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. Called customer regarding mango pickle discount..."
                  value={newNoteBody}
                  onChange={e => setNewNoteBody(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid var(--border)",
                    background: "var(--sunken)",
                    fontSize: "13px",
                  }}
                />
                <button
                  type="submit"
                  disabled={savingNote}
                  className="primary-button"
                  style={{
                    minHeight: "36px",
                    padding: "0 14px",
                    fontSize: "12px",
                  }}
                >
                  <Plus size={14} /> Add note
                </button>
              </div>
            </form>

            <div style={{ maxHeight: "240px", overflowY: "auto" }}>
              {notes.length === 0 ? (
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: "13px",
                    textAlign: "center",
                    padding: "16px 0",
                  }}
                >
                  No internal notes recorded yet.
                </p>
              ) : (
                notes.map(note => (
                  <div
                    key={note.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      padding: "10px 0",
                      fontSize: "13px",
                    }}
                  >
                    <p style={{ margin: "0 0 4px", color: "var(--ink)" }}>
                      {note.body}
                    </p>
                    <small style={{ color: "var(--muted)", fontSize: "11px" }}>
                      By {note.authorName || "Admin"} ·{" "}
                      {new Date(note.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: "24px", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setActiveCartForNotes(null)}
                style={{
                  background: "var(--sunken)",
                  color: "var(--secondary)",
                  padding: "8px 16px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
