import React from "react";
import { ArrowLeft, Clock, MapPin, Package, Truck } from "lucide-react";
import { Link } from "wouter";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function ShippingPolicy() {
  return (
    <div className="site-shell">
      <SiteHeader announcement="Freshly Packed & Shipped Directly from Ganjam, Odisha Across India" />

      <main style={{ padding: "48px 0 80px", background: "var(--ivory)", minHeight: "80vh" }}>
        <div className="container" style={{ maxWidth: "860px" }}>
          <div style={{ marginBottom: "32px" }}>
            <Link href="/" className="text-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
              <ArrowLeft size={16} /> Back to Storefront
            </Link>
            <p className="eyebrow">Logistics & Delivery Timelines</p>
            <h1 style={{ font: "600 38px/1.15 var(--font-serif)", color: "var(--ink)", margin: "0 0 16px" }}>
              Shipping &amp; Delivery Policy
            </h1>
            <p style={{ color: "var(--secondary)", fontSize: "15px", lineHeight: "1.7" }}>
              Dispatched with care from Ganjam, Odisha to every pin code in India.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
              marginBottom: "36px",
            }}
          >
            <div style={{ background: "var(--raised)", border: "1px solid var(--border)", padding: "20px", borderRadius: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--terracotta)", marginBottom: "8px" }}>
                <Clock size={20} />
                <strong style={{ fontSize: "16px", color: "var(--ink)" }}>24-48 Hr Dispatch</strong>
              </div>
              <p style={{ fontSize: "13px", color: "var(--secondary)", margin: 0 }}>
                Orders are packed fresh and manifested within 24 to 48 business hours.
              </p>
            </div>

            <div style={{ background: "var(--raised)", border: "1px solid var(--border)", padding: "20px", borderRadius: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#2E7D32", marginBottom: "8px" }}>
                <Truck size={20} />
                <strong style={{ fontSize: "16px", color: "var(--ink)" }}>3 to 7 Days Delivery</strong>
              </div>
              <p style={{ fontSize: "13px", color: "var(--secondary)", margin: 0 }}>
                Pan-India standard delivery typically takes 3 to 7 business days depending on location.
              </p>
            </div>

            <div style={{ background: "var(--raised)", border: "1px solid var(--border)", padding: "20px", borderRadius: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--ink)", marginBottom: "8px" }}>
                <MapPin size={20} />
                <strong style={{ fontSize: "16px", color: "var(--ink)" }}>Ganjam Origin</strong>
              </div>
              <p style={{ fontSize: "13px", color: "var(--secondary)", margin: 0 }}>
                Shipped directly from our pantry operations in Berhampur, Ganjam, Odisha.
              </p>
            </div>
          </div>

          <div
            style={{
              background: "var(--raised)",
              border: "1px solid var(--border)",
              padding: "36px",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "28px",
            }}
          >
            <section>
              <h2 style={{ font: "600 20px var(--font-serif)", color: "var(--ink)", margin: "0 0 10px" }}>
                1. Order Tracking
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--secondary)", margin: 0 }}>
                As soon as your order is dispatched, you will receive an automated tracking link. You can also visit our <Link href="/track-order" style={{ color: "var(--terracotta)", fontWeight: 600 }}>Track Order Portal</Link> to check live courier status, manifest date, and expected delivery date anytime.
              </p>
            </section>

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: 0 }} />

            <section>
              <h2 style={{ font: "600 20px var(--font-serif)", color: "var(--ink)", margin: "0 0 10px" }}>
                2. Packaging Standards
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--secondary)", margin: 0 }}>
                Pickles and glass jars are double-bubble wrapped and enclosed in rigid corrugated shipping cartons to withstand interstate transit. All outer boxes are sealed with tamper-evident tape.
              </p>
            </section>

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: 0 }} />

            <section>
              <h2 style={{ font: "600 20px var(--font-serif)", color: "var(--ink)", margin: "0 0 10px" }}>
                3. Courier Partners
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--secondary)", margin: 0 }}>
                We partner with leading logistics providers including Delhivery, Blue Dart, DTDC, and India Post Speed Post to ensure reliable delivery across metro cities, tier-2 towns, and remote postal zones.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
