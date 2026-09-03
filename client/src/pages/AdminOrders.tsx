import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Package,
  QrCode,
  RotateCcw,
  Search,
  Truck,
  X,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  productTitleSnapshot: string;
  packSizeSnapshot: string | null;
  unitPriceInMinorUnits: number;
  quantity: number;
  subtotalInMinorUnits: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingAddressLine1: string;
  shippingAddressLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  shippingLandmark: string | null;
  subtotalInMinorUnits: number;
  shippingFeeInMinorUnits: number;
  totalInMinorUnits: number;
  currency: string;
  paymentMethod: "cod" | "manual_upi" | "gateway";
  paymentStatus: string;
  orderStatus: string;
  customerNotes: string | null;
  adminNotes: string | null;
  createdAt: string;
  items: OrderItem[];
  payment?: {
    upiReference: string | null;
    screenshotUrl?: string | null;
    status: string;
    verifiedAt: string | null;
    notes: string | null;
  } | null;
  packingTask?: {
    status: string;
    packingNotes: string | null;
    startedAt: string | null;
    completedAt: string | null;
  } | null;
  shipment?: {
    courierName: string;
    trackingNumber: string;
    shippingStatus: string;
    shippingDate: string;
    expectedDeliveryDate: string | null;
    deliveredAt: string | null;
  } | null;
  returnRequest?: {
    id: string;
    customerReason: string;
    internalDecision: string | null;
    status: string;
    refundAmountInMinorUnits: number | null;
    refundReference: string | null;
  } | null;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Modal Action States
  const [activeModal, setActiveModal] = useState<
    "details" | "confirm_cod" | "verify_upi" | "packing" | "shipment" | "return" | null
  >(null);

  const [codNote, setCodNote] = useState("");
  const [upiRefInput, setUpiRefInput] = useState("");
  const [upiNote, setUpiNote] = useState("");
  const [packingStatus, setPackingStatus] = useState<"pending" | "in_progress" | "completed">("in_progress");
  const [packingNote, setPackingNote] = useState("");
  const [courierName, setCourierName] = useState("Delhivery");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState<"in_transit" | "out_for_delivery" | "delivered">("in_transit");
  const [returnDecision, setReturnDecision] = useState<"approved" | "rejected" | "received" | "refunded">("approved");
  const [returnNote, setReturnNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundRef, setRefundRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      let url = `/api/admin/orders?page=1&pageSize=50`;
      if (activeTab === "cod_pending") url += `&status=cod_confirmation_pending`;
      else if (activeTab === "upi_pending") url += `&paymentStatus=upi_pending_verification`;
      else if (activeTab === "packing") url += `&status=confirmed`;
      else if (activeTab === "shipped") url += `&status=shipped`;
      else if (activeTab === "delivered") url += `&status=delivered`;
      else if (activeTab === "returns") url += `&status=return_requested`;

      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  // Open Actions
  const openConfirmCod = (order: Order) => {
    setSelectedOrder(order);
    setCodNote(order.adminNotes || "");
    setActiveModal("confirm_cod");
  };

  const openVerifyUpi = (order: Order) => {
    setSelectedOrder(order);
    setUpiRefInput(order.payment?.upiReference || "");
    setUpiNote("");
    setActiveModal("verify_upi");
  };

  const openPackingModal = (order: Order) => {
    setSelectedOrder(order);
    setPackingStatus(order.packingTask?.status === "in_progress" ? "completed" : "in_progress");
    setPackingNote(order.packingTask?.packingNotes || "");
    setActiveModal("packing");
  };

  const openShipmentModal = (order: Order) => {
    setSelectedOrder(order);
    setCourierName(order.shipment?.courierName || "Delhivery");
    setTrackingNumber(order.shipment?.trackingNumber || "");
    setExpectedDeliveryDate(order.shipment?.expectedDeliveryDate || "");
    setShipmentStatus("in_transit");
    setActiveModal("shipment");
  };

  const openReturnModal = (order: Order) => {
    setSelectedOrder(order);
    setReturnDecision("approved");
    setReturnNote("");
    setRefundAmount(order.returnRequest?.refundAmountInMinorUnits ? (order.returnRequest.refundAmountInMinorUnits / 100).toString() : (order.totalInMinorUnits / 100).toString());
    setRefundRef("");
    setActiveModal("return");
  };

  // Action Submissions
  const submitConfirmCod = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/confirm-cod`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: codNote }),
      });
      if (res.ok) {
        toast.success(`COD Order #${selectedOrder.orderNumber} confirmed! Packing task created.`);
        setActiveModal(null);
        loadOrders();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to confirm COD");
      }
    } catch (err) {
      toast.error("Network error confirming COD");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitVerifyUpi = async () => {
    if (!selectedOrder || !upiRefInput.trim()) {
      toast.error("Please enter the verified UPI reference (UTR)");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/verify-upi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upiReference: upiRefInput.trim(),
          notes: upiNote.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success(`Payment verified for order #${selectedOrder.orderNumber}! Packing task created.`);
        setActiveModal(null);
        loadOrders();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to verify UPI");
      }
    } catch (err) {
      toast.error("Network error verifying UPI");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPacking = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/packing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: packingStatus, notes: packingNote }),
      });
      if (res.ok) {
        toast.success(`Packing updated to '${packingStatus}'`);
        setActiveModal(null);
        loadOrders();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update packing");
      }
    } catch (err) {
      toast.error("Network error updating packing");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitShipment = async () => {
    if (!selectedOrder || !courierName.trim() || !trackingNumber.trim()) {
      toast.error("Courier name and tracking number are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/shipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courierName: courierName.trim(),
          trackingNumber: trackingNumber.trim(),
          expectedDeliveryDate: expectedDeliveryDate || null,
          shippingStatus: shipmentStatus,
        }),
      });
      if (res.ok) {
        toast.success(`Shipment recorded for order #${selectedOrder.orderNumber}`);
        setActiveModal(null);
        loadOrders();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update shipment");
      }
    } catch (err) {
      toast.error("Network error recording shipment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReturnReview = async () => {
    if (!selectedOrder || !selectedOrder.returnRequest) return;
    if (!returnNote.trim()) {
      toast.error("Please provide a decision note");
      return;
    }
    setIsSubmitting(true);
    try {
      const parsedRefundPaise = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : null;
      const res = await fetch(`/api/admin/returns/${selectedOrder.returnRequest.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: returnDecision,
          internalDecisionNote: returnNote.trim(),
          refundAmountInMinorUnits: parsedRefundPaise,
          refundMethod: "Bank Transfer / UPI",
          refundReference: refundRef.trim() || null,
        }),
      });
      if (res.ok) {
        toast.success(`Return decision recorded: ${returnDecision}`);
        setActiveModal(null);
        loadOrders();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to process return decision");
      }
    } catch (err) {
      toast.error("Network error processing return");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string, paymentMethod: string, paymentStatus: string) => {
    if (status === "cod_confirmation_pending") {
      return <span className="status-badge" style={{ background: "#FEF3C7", color: "#92400E" }}>COD Review Pending</span>;
    }
    if (paymentStatus === "upi_pending_verification") {
      return <span className="status-badge" style={{ background: "#FEF3C7", color: "#92400E" }}>UPI UTR Verification</span>;
    }
    if (status === "confirmed") {
      return <span className="status-badge" style={{ background: "#E0E7FF", color: "#3730A3" }}>Confirmed — In Queue</span>;
    }
    if (status === "packing") {
      return <span className="status-badge" style={{ background: "#FDE68A", color: "#78350F" }}>Packing in Progress</span>;
    }
    if (status === "packed") {
      return <span className="status-badge" style={{ background: "#DBEAFE", color: "#1E40AF" }}>Packed — Awaiting Dispatch</span>;
    }
    if (status === "shipped") {
      return <span className="status-badge" style={{ background: "#E0F2FE", color: "#0369A1" }}>In Transit</span>;
    }
    if (status === "delivered") {
      return <span className="status-badge" style={{ background: "#DCFCE7", color: "#166534" }}>Delivered</span>;
    }
    if (status === "return_requested") {
      return <span className="status-badge" style={{ background: "#FEE2E2", color: "#991B1B" }}>Return Requested</span>;
    }
    if (status === "refunded") {
      return <span className="status-badge" style={{ background: "#F3F4F6", color: "#374151" }}>Refunded</span>;
    }
    return <span className="status-badge">{status}</span>;
  };

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">Order Fulfillment & Verification</p>
          <h1>Orders Management</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs" style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border)", marginBottom: "20px", overflowX: "auto" }}>
        {[
          { id: "all", label: "All Orders" },
          { id: "cod_pending", label: "COD Pending Verification" },
          { id: "upi_pending", label: "UPI Pending Verification" },
          { id: "packing", label: "Packing Queue" },
          { id: "shipped", label: "In Transit" },
          { id: "delivered", label: "Delivered" },
          { id: "returns", label: "Returns & Refunds" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 16px",
              border: "none",
              background: "none",
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              fontWeight: activeTab === tab.id ? 600 : 500,
              color: activeTab === tab.id ? "var(--terracotta)" : "var(--secondary)",
              borderBottom: activeTab === tab.id ? "2px solid var(--terracotta)" : "2px solid transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "16px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", flex: 1, maxWidth: "450px" }}>
          <input
            type="text"
            placeholder="Search by order #, customer name, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              fontSize: "13px",
              fontFamily: "var(--font-sans)",
            }}
          />
          <button type="submit" className="primary-button" style={{ padding: "8px 16px", fontSize: "13px" }}>
            <Search size={15} /> Search
          </button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="panel" style={{ padding: 0, overflowX: "auto" }}>
        {isLoading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)" }}>
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)" }}>
            <Package size={32} strokeWidth={1.5} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <p>No orders found matching this view.</p>
          </div>
        ) : (
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--sunken)", borderBottom: "1px solid var(--border)", textAlign: "left", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                <th style={{ padding: "12px 16px" }}>Order Ref</th>
                <th style={{ padding: "12px 16px" }}>Customer & Location</th>
                <th style={{ padding: "12px 16px" }}>Payment Method</th>
                <th style={{ padding: "12px 16px" }}>Total</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Workflow Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: "1px solid var(--border)", fontSize: "13px" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <strong style={{ color: "var(--ink)", display: "block" }}>{order.orderNumber}</strong>
                    <small style={{ color: "var(--muted)" }}>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </small>
                  </td>

                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>{order.customerName}</div>
                    <div style={{ color: "var(--secondary)", fontSize: "12px" }}>{order.customerPhone}</div>
                    <div style={{ color: "var(--muted)", fontSize: "11px" }}>{order.shippingCity}, {order.shippingState}</div>
                  </td>

                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
                      {order.paymentMethod === "cod" ? "Cash On Delivery" : order.paymentMethod === "manual_upi" ? "Manual UPI / QR" : "Gateway"}
                    </span>
                    {order.payment?.upiReference && (
                      <div style={{ fontSize: "11px", color: "var(--gold)", fontFamily: "monospace" }}>
                        UTR: {order.payment.upiReference}
                      </div>
                    )}
                    {order.payment?.screenshotUrl && (
                      <a
                        href={order.payment.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "11px", color: "#166534", background: "#DCFCE7", padding: "1px 6px", borderRadius: "3px", marginTop: "2px", textDecoration: "none" }}
                      >
                        Receipt Attached ↗
                      </a>
                    )}
                  </td>

                  <td style={{ padding: "14px 16px" }}>
                    <strong style={{ color: "var(--terracotta)" }}>₹{(order.totalInMinorUnits / 100).toFixed(0)}</strong>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{order.items.length} item(s)</div>
                  </td>

                  <td style={{ padding: "14px 16px" }}>
                    {getStatusBadge(order.orderStatus, order.paymentMethod, order.paymentStatus)}
                  </td>

                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                      {/* Action 1: Confirm COD */}
                      {order.paymentMethod === "cod" && order.orderStatus === "cod_confirmation_pending" && (
                        <button
                          onClick={() => openConfirmCod(order)}
                          className="primary-button"
                          style={{ padding: "6px 12px", fontSize: "12px", background: "var(--olive)" }}
                        >
                          Confirm COD
                        </button>
                      )}

                      {/* Action 2: Verify UPI */}
                      {order.paymentMethod === "manual_upi" && order.paymentStatus === "upi_pending_verification" && (
                        <button
                          onClick={() => openVerifyUpi(order)}
                          className="primary-button"
                          style={{ padding: "6px 12px", fontSize: "12px", background: "var(--gold)" }}
                        >
                          Verify UPI
                        </button>
                      )}

                      {/* Action 3: Packing */}
                      {(order.orderStatus === "confirmed" || order.orderStatus === "packing") && (
                        <button
                          onClick={() => openPackingModal(order)}
                          className="quiet-button"
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                        >
                          <Package size={14} /> Packing
                        </button>
                      )}

                      {/* Action 4: Dispatch / Ship */}
                      {(order.orderStatus === "packed" || order.orderStatus === "shipped") && (
                        <button
                          onClick={() => openShipmentModal(order)}
                          className="quiet-button"
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                        >
                          <Truck size={14} /> Dispatch / Track
                        </button>
                      )}

                      {/* Action 5: Returns */}
                      {order.orderStatus === "return_requested" && (
                        <button
                          onClick={() => openReturnModal(order)}
                          className="primary-button"
                          style={{ padding: "6px 12px", fontSize: "12px", background: "var(--terracotta)" }}
                        >
                          <RotateCcw size={14} /> Review Return
                        </button>
                      )}

                      {/* View Details */}
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setActiveModal("details");
                        }}
                        className="quiet-button"
                        style={{ padding: "6px 10px", fontSize: "12px" }}
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ========================================================================= */}
      {/* Action Modals */}
      {/* ========================================================================= */}

      {/* 1. Confirm COD Modal */}
      {activeModal === "confirm_cod" && selectedOrder && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 100 }}>
          <div className="modal-card" style={{ background: "#fff", padding: "24px", borderRadius: "8px", maxWidth: "480px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ font: "600 18px var(--font-serif)", margin: 0 }}>Confirm Cash on Delivery Order</h2>
              <button onClick={() => setActiveModal(null)} style={{ background: "none", border: 0, cursor: "pointer" }}><X size={18} /></button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--secondary)", lineHeight: "1.6", marginBottom: "16px" }}>
              Please verify that the customer's phone number (<strong>{selectedOrder.customerPhone}</strong>) and delivery address in <strong>{selectedOrder.shippingCity}</strong> are valid before confirming for packing.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Admin Confirmation Notes (Optional)</label>
              <textarea
                value={codNote}
                onChange={e => setCodNote(e.target.value)}
                placeholder="e.g. Verified via WhatsApp call on 02-Sep. Customer confirmed address."
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px", height: "70px", fontFamily: "var(--font-sans)" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setActiveModal(null)} className="quiet-button" disabled={isSubmitting}>Cancel</button>
              <button onClick={submitConfirmCod} className="primary-button" style={{ background: "var(--olive)" }} disabled={isSubmitting}>
                {isSubmitting ? "Confirming..." : "Confirm & Queue for Packing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Verify UPI Modal */}
      {activeModal === "verify_upi" && selectedOrder && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 100 }}>
          <div className="modal-card" style={{ background: "#fff", padding: "24px", borderRadius: "8px", maxWidth: "480px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ font: "600 18px var(--font-serif)", margin: 0 }}>Verify Manual UPI Payment</h2>
              <button onClick={() => setActiveModal(null)} style={{ background: "none", border: 0, cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ background: "var(--sunken)", padding: "12px", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Order Total:</span>
                <strong>₹{(selectedOrder.totalInMinorUnits / 100).toFixed(0)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Customer Entered UTR:</span>
                <strong style={{ color: "var(--terracotta)", fontFamily: "monospace" }}>{selectedOrder.payment?.upiReference || "None submitted"}</strong>
              </div>
            </div>

            {selectedOrder.payment?.screenshotUrl && (
              <div style={{ marginBottom: "16px", background: "var(--sunken)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                    Payment Screenshot Receipt
                  </span>
                  <a
                    href={selectedOrder.payment.screenshotUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "11px", color: "var(--terracotta)", textDecoration: "underline", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    Open Full Size <ExternalLink size={11} />
                  </a>
                </div>
                <a href={selectedOrder.payment.screenshotUrl} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                  <img
                    src={selectedOrder.payment.screenshotUrl}
                    alt="Customer Payment Receipt"
                    style={{ width: "100%", maxHeight: "180px", objectFit: "contain", background: "#111", borderRadius: "4px" }}
                  />
                </a>
              </div>
            )}

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Verified UPI Reference / UTR Number *</label>
              <input
                type="text"
                value={upiRefInput}
                onChange={e => setUpiRefInput(e.target.value)}
                placeholder="12-digit Bank Reference (e.g. 423891002341)"
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px", fontFamily: "monospace" }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Verification Notes (Optional)</label>
              <input
                type="text"
                value={upiNote}
                onChange={e => setUpiNote(e.target.value)}
                placeholder="e.g. Matched in HDFC Bank UPI merchant statement"
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setActiveModal(null)} className="quiet-button" disabled={isSubmitting}>Cancel</button>
              <button onClick={submitVerifyUpi} className="primary-button" style={{ background: "var(--gold)" }} disabled={isSubmitting}>
                {isSubmitting ? "Verifying..." : "Verify & Queue for Packing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Packing Modal */}
      {activeModal === "packing" && selectedOrder && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 100 }}>
          <div className="modal-card" style={{ background: "#fff", padding: "24px", borderRadius: "8px", maxWidth: "480px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ font: "600 18px var(--font-serif)", margin: 0 }}>Packing Task for #{selectedOrder.orderNumber}</h2>
              <button onClick={() => setActiveModal(null)} style={{ background: "none", border: 0, cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Items to Pack:</label>
              <div style={{ background: "var(--sunken)", padding: "10px", borderRadius: "6px", fontSize: "12px" }}>
                {selectedOrder.items.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>{item.productTitleSnapshot} ({item.packSizeSnapshot || "Standard"})</span>
                    <strong>× {item.quantity}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Packing Status</label>
              <select
                value={packingStatus}
                onChange={e => setPackingStatus(e.target.value as any)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
              >
                <option value="in_progress">In Progress (Currently Packing)</option>
                <option value="completed">Completed (Box Sealed & Labelled)</option>
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Packing Notes</label>
              <input
                type="text"
                value={packingNote}
                onChange={e => setPackingNote(e.target.value)}
                placeholder="e.g. Added extra bubble wrap for glass pickle jars"
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setActiveModal(null)} className="quiet-button" disabled={isSubmitting}>Cancel</button>
              <button onClick={submitPacking} className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Update Packing State"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Shipment / Dispatch Modal */}
      {activeModal === "shipment" && selectedOrder && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 100 }}>
          <div className="modal-card" style={{ background: "#fff", padding: "24px", borderRadius: "8px", maxWidth: "480px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ font: "600 18px var(--font-serif)", margin: 0 }}>Dispatch & Tracking Details</h2>
              <button onClick={() => setActiveModal(null)} style={{ background: "none", border: 0, cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Courier Partner *</label>
              <input
                type="text"
                value={courierName}
                onChange={e => setCourierName(e.target.value)}
                placeholder="e.g. Delhivery, BlueDart, DTDC, India Post"
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Tracking Number / AWB *</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="e.g. DEL123891048"
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px", fontFamily: "monospace" }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={e => setExpectedDeliveryDate(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Shipping Status</label>
              <select
                value={shipmentStatus}
                onChange={e => setShipmentStatus(e.target.value as any)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
              >
                <option value="in_transit">In Transit (Dispatched)</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered (Completed)</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setActiveModal(null)} className="quiet-button" disabled={isSubmitting}>Cancel</button>
              <button onClick={submitShipment} className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Shipment & Queue Tracking Notification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Returns Review Modal */}
      {activeModal === "return" && selectedOrder && selectedOrder.returnRequest && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 100 }}>
          <div className="modal-card" style={{ background: "#fff", padding: "24px", borderRadius: "8px", maxWidth: "480px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ font: "600 18px var(--font-serif)", margin: 0 }}>Review Return Request</h2>
              <button onClick={() => setActiveModal(null)} style={{ background: "none", border: 0, cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ background: "var(--sunken)", padding: "12px", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>
              <strong style={{ display: "block", marginBottom: "4px" }}>Customer Reason:</strong>
              <p style={{ margin: 0, color: "var(--secondary)" }}>{selectedOrder.returnRequest.customerReason}</p>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Decision</label>
              <select
                value={returnDecision}
                onChange={e => setReturnDecision(e.target.value as any)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
              >
                <option value="approved">Approve Return (Send return instructions)</option>
                <option value="rejected">Reject Return (Food safety / perishable policy)</option>
                <option value="received">Package Received at Warehouse</option>
                <option value="refunded">Refund Completed</option>
              </select>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Decision Notes *</label>
              <input
                type="text"
                value={returnNote}
                onChange={e => setReturnNote(e.target.value)}
                placeholder="e.g. Jar seal broken during transit, approved replacement or refund"
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
              />
            </div>

            {returnDecision === "refunded" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Refund Amount (₹)</label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={e => setRefundAmount(e.target.value)}
                    style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Refund Ref (UTR)</label>
                  <input
                    type="text"
                    value={refundRef}
                    onChange={e => setRefundRef(e.target.value)}
                    placeholder="Bank Ref"
                    style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setActiveModal(null)} className="quiet-button" disabled={isSubmitting}>Cancel</button>
              <button onClick={submitReturnReview} className="primary-button" style={{ background: "var(--terracotta)" }} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Return Decision"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Order Details Drawer Modal */}
      {activeModal === "details" && selectedOrder && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 100 }}>
          <div className="modal-card" style={{ background: "#fff", padding: "24px", borderRadius: "8px", maxWidth: "600px", width: "90%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>Order Summary</p>
                <h2 style={{ font: "600 20px var(--font-serif)", margin: "2px 0 0" }}>{selectedOrder.orderNumber}</h2>
              </div>
              <button onClick={() => setActiveModal(null)} style={{ background: "none", border: 0, cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px", background: "var(--sunken)", padding: "16px", borderRadius: "6px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "var(--muted)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>Customer</span>
                <strong>{selectedOrder.customerName}</strong>
                <div>{selectedOrder.customerPhone}</div>
                {selectedOrder.customerEmail && <div>{selectedOrder.customerEmail}</div>}
              </div>
              <div>
                <span style={{ color: "var(--muted)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>Delivery Address</span>
                <div>{selectedOrder.shippingAddressLine1}</div>
                {selectedOrder.shippingAddressLine2 && <div>{selectedOrder.shippingAddressLine2}</div>}
                <div>{selectedOrder.shippingCity}, {selectedOrder.shippingState} - {selectedOrder.shippingPincode}</div>
              </div>
            </div>

            <div style={{ background: "var(--sunken)", padding: "14px", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Payment Method:</span>
                <strong>{selectedOrder.paymentMethod === "manual_upi" ? "Manual UPI / QR" : selectedOrder.paymentMethod.toUpperCase()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Payment Status:</span>
                <strong>{selectedOrder.paymentStatus}</strong>
              </div>
              {selectedOrder.payment?.upiReference && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>UPI Reference (UTR):</span>
                  <strong style={{ fontFamily: "monospace", color: "var(--terracotta)" }}>{selectedOrder.payment.upiReference}</strong>
                </div>
              )}
              {selectedOrder.payment?.screenshotUrl && (
                <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600 }}>Payment Receipt Screenshot</span>
                    <a href={selectedOrder.payment.screenshotUrl} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "var(--terracotta)", textDecoration: "underline" }}>
                      Open Original ↗
                    </a>
                  </div>
                  <a href={selectedOrder.payment.screenshotUrl} target="_blank" rel="noreferrer">
                    <img
                      src={selectedOrder.payment.screenshotUrl}
                      alt="Payment Receipt"
                      style={{ width: "100%", maxHeight: "160px", objectFit: "contain", background: "#000", borderRadius: "4px" }}
                    />
                  </a>
                </div>
              )}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <h3 style={{ font: "600 14px var(--font-sans)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>Items Ordered</h3>
              <div style={{ borderTop: "1px solid var(--border)" }}>
                {selectedOrder.items.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: "13px" }}>
                    <div>
                      <strong>{item.productTitleSnapshot}</strong>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>{item.packSizeSnapshot || "Standard Pack"} × {item.quantity}</div>
                    </div>
                    <strong>₹{(item.subtotalInMinorUnits / 100).toFixed(0)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "var(--sunken)", padding: "12px", borderRadius: "6px", marginBottom: "20px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Subtotal</span>
                <span>₹{(selectedOrder.subtotalInMinorUnits / 100).toFixed(0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Shipping Fee</span>
                <span>₹{(selectedOrder.shippingFeeInMinorUnits / 100).toFixed(0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "15px", borderTop: "1px solid var(--border)", paddingTop: "6px", marginTop: "6px" }}>
                <span>Total Amount</span>
                <span style={{ color: "var(--terracotta)" }}>₹{(selectedOrder.totalInMinorUnits / 100).toFixed(0)}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setActiveModal(null)} className="primary-button">Close</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
