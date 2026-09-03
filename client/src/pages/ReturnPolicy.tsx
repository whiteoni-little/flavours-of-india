import React from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, HelpCircle, PackageX, RefreshCw, ShieldAlert, Video } from "lucide-react";
import { Link } from "wouter";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function ReturnPolicy() {
  return (
    <div className="site-shell">
      <SiteHeader announcement="Transparent & Fair Customer Return, Refund & Cancellation Policy" />

      <main style={{ padding: "48px 0 80px", background: "var(--ivory)", minHeight: "80vh" }}>
        <div className="container" style={{ maxWidth: "860px" }}>
          <div style={{ marginBottom: "32px" }}>
            <Link href="/" className="text-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
              <ArrowLeft size={16} /> Back to Storefront
            </Link>
            <p className="eyebrow">Customer Protection & Store Guidelines</p>
            <h1 style={{ font: "600 38px/1.15 var(--font-serif)", color: "var(--ink)", margin: "0 0 16px" }}>
              Return, Refund &amp; Cancellation Policy
            </h1>
            <p style={{ color: "var(--secondary)", fontSize: "15px", lineHeight: "1.7" }}>
              Last Updated: September 2026 • Flavours of India, Ganjam, Odisha
            </p>
          </div>

          {/* Quick Summary Highlights Banner */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                background: "var(--raised)",
                border: "1px solid var(--border)",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(32,27,22,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--terracotta)", marginBottom: "8px" }}>
                <Clock size={20} />
                <strong style={{ fontSize: "16px", color: "var(--ink)" }}>3-Day Return Window</strong>
              </div>
              <p style={{ fontSize: "13px", color: "var(--secondary)", margin: 0, lineHeight: 1.5 }}>
                Return/replacement requests must be submitted within <strong>3 days</strong> of courier delivery.
              </p>
            </div>

            <div
              style={{
                background: "var(--raised)",
                border: "1px solid var(--border)",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(32,27,22,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#2E7D32", marginBottom: "8px" }}>
                <RefreshCw size={20} />
                <strong style={{ fontSize: "16px", color: "var(--ink)" }}>7 Working Days Refund</strong>
              </div>
              <p style={{ fontSize: "13px", color: "var(--secondary)", margin: 0, lineHeight: 1.5 }}>
                Approved refunds are credited directly to your bank/UPI account within <strong>7 working days</strong>.
              </p>
            </div>

            <div
              style={{
                background: "var(--raised)",
                border: "1px solid var(--border)",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(32,27,22,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#C5221F", marginBottom: "8px" }}>
                <PackageX size={20} />
                <strong style={{ fontSize: "16px", color: "var(--ink)" }}>Pre-Shipping Cancellation</strong>
              </div>
              <p style={{ fontSize: "13px", color: "var(--secondary)", margin: 0, lineHeight: 1.5 }}>
                Cancellations are accepted prior to dispatch. <strong>No cancellation once package is shipped</strong>.
              </p>
            </div>
          </div>

          {/* CRITICAL MANDATORY VIDEO REQUIREMENT ALERT */}
          <div
            style={{
              background: "#FFF8F0",
              border: "2px solid #E07A5F",
              padding: "24px 28px",
              borderRadius: "8px",
              marginBottom: "40px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div
                style={{
                  background: "#E07A5F",
                  color: "#FFF",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Video size={18} />
              </div>
              <h3 style={{ margin: 0, font: "600 20px var(--font-serif)", color: "#7F2D17" }}>
                Mandatory Package Opening Video Requirement
              </h3>
            </div>
            <p style={{ fontSize: "14px", color: "#5C3A21", lineHeight: 1.7, margin: "0 0 14px" }}>
              Because all our items are authentic food products, pickles, and artisanal snacks packaged under strict hygiene protocols, <strong>a continuous, uncut video recording of opening the courier package from its sealed condition is strictly mandatory</strong> for all return, damage, transit leakage, or missing item claims.
            </p>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#5C3A21", lineHeight: 1.8 }}>
              <li><strong>Seal Visibility:</strong> The video must clearly show the courier shipping label, barcode, and the fully sealed outer courier box / polybag prior to cutting or unsealing.</li>
              <li><strong>Uninterrupted Footage:</strong> The camera must capture the entire unboxing without any cuts, pauses, fast-forwarding, or video edits.</li>
              <li><strong>Item Inspection:</strong> Clearly reveal the condition of the inner seal, bottle cap, or snack pouch in front of the lens.</li>
              <li><strong>Timeframe:</strong> Claims without a continuous opening video recorded at the time of delivery cannot be entertained under our food safety guidelines.</li>
            </ul>
          </div>

          {/* Detailed Policy Sections */}
          <div
            style={{
              background: "var(--raised)",
              border: "1px solid var(--border)",
              padding: "36px",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "32px",
            }}
          >
            {/* Section 1 */}
            <section>
              <h2 style={{ font: "600 22px var(--font-serif)", color: "var(--ink)", margin: "0 0 12px" }}>
                1. Return &amp; Replacement Policy
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--secondary)", margin: "0 0 12px" }}>
                We take extreme pride in the quality and freshness of our pantry items. If you receive an item that is damaged during transit, has a broken seal upon opening, is defective, or is not what you ordered:
              </p>
              <ul style={{ paddingLeft: "20px", fontSize: "14px", color: "var(--secondary)", lineHeight: "1.7", margin: 0 }}>
                <li>You must notify us and raise a claim within <strong>3 calendar days of delivery</strong>.</li>
                <li>Submit your claim along with your Order Number and the mandatory unboxing video via our <Link href="/track-order" style={{ color: "var(--terracotta)", fontWeight: 600 }}>Order Tracking &amp; Returns Portal</Link>.</li>
                <li>Due to FSSAI food safety regulations, items that have been opened, consumed, or stored improperly cannot be returned for taste preference reasons.</li>
              </ul>
            </section>

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: 0 }} />

            {/* Section 2 */}
            <section>
              <h2 style={{ font: "600 22px var(--font-serif)", color: "var(--ink)", margin: "0 0 12px" }}>
                2. Refund Timeline &amp; Method
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--secondary)", margin: "0 0 12px" }}>
                Once your return claim and package opening video are inspected and approved by our fulfillment team:
              </p>
              <ul style={{ paddingLeft: "20px", fontSize: "14px", color: "var(--secondary)", lineHeight: "1.7", margin: 0 }}>
                <li>The approved refund will be processed within <strong>7 working days</strong>.</li>
                <li>Refunds are credited directly to the original payment method (UPI account or bank transfer used at checkout).</li>
                <li>You will receive a notification and bank reference number as soon as the transfer is executed.</li>
              </ul>
            </section>

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: 0 }} />

            {/* Section 3 */}
            <section>
              <h2 style={{ font: "600 22px var(--font-serif)", color: "var(--ink)", margin: "0 0 12px" }}>
                3. Order Cancellation Policy
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--secondary)", margin: "0 0 12px" }}>
                Orders placed on Flavours of India can be cancelled under the following strict terms:
              </p>
              <ul style={{ paddingLeft: "20px", fontSize: "14px", color: "var(--secondary)", lineHeight: "1.7", margin: "0 0 14px" }}>
                <li><strong>Before Dispatch:</strong> You may cancel your order free of charge at any time while the status is <em>Pending</em> or <em>Packed</em> before the courier pickup is executed.</li>
                <li><strong>After Dispatch:</strong> Once your package has been shipped and handed over to our courier partner with a generated tracking airway bill (AWB), <strong>cancellation is strictly not permitted</strong>.</li>
              </ul>
            </section>

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: 0 }} />

            {/* Section 4 */}
            <section>
              <h2 style={{ font: "600 22px var(--font-serif)", color: "var(--ink)", margin: "0 0 12px" }}>
                4. How to Submit a Claim
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "16px" }}>
                <div style={{ background: "var(--sunken)", padding: "16px", borderRadius: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--terracotta)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Step 1
                  </span>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", margin: "6px 0 4px" }}>
                    Record Video
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--secondary)", margin: 0 }}>
                    Record an unedited video opening the parcel from sealed state.
                  </p>
                </div>

                <div style={{ background: "var(--sunken)", padding: "16px", borderRadius: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--terracotta)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Step 2
                  </span>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", margin: "6px 0 4px" }}>
                    Go to Tracking Page
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--secondary)", margin: 0 }}>
                    Enter your order number on our <Link href="/track-order" style={{ color: "var(--terracotta)" }}>tracking page</Link>.
                  </p>
                </div>

                <div style={{ background: "var(--sunken)", padding: "16px", borderRadius: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--terracotta)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Step 3
                  </span>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", margin: "6px 0 4px" }}>
                    Resolution &amp; Refund
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--secondary)", margin: 0 }}>
                    Our team reviews the claim and issues a replacement or 7-day refund.
                  </p>
                </div>
              </div>
            </section>

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: 0 }} />

            {/* Section 5: Store Contact */}
            <section>
              <h2 style={{ font: "600 22px var(--font-serif)", color: "var(--ink)", margin: "0 0 12px" }}>
                5. Operations &amp; Grievance Office
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--secondary)", margin: "0 0 8px" }}>
                For any questions regarding cancellations or returns, reach out to our team:
              </p>
              <div style={{ background: "var(--sunken)", padding: "16px 20px", borderRadius: "6px", fontSize: "13px", color: "var(--ink)", lineHeight: "1.7" }}>
                <strong>Flavours of India</strong><br />
                Address: Berhampur, Ganjam, Odisha - 760001, India<br />
                Email: <a href="mailto:durgapatro06@gmail.com" style={{ color: "var(--terracotta)" }}>durgapatro06@gmail.com</a><br />
                Operating Hours: Monday – Saturday, 9:30 AM – 6:30 PM IST
              </div>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
