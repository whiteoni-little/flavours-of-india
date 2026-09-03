import React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function TermsConditions() {
  return (
    <div className="site-shell">
      <SiteHeader announcement="Terms of Service & Operational Guidelines • Flavours of India" />

      <main style={{ padding: "48px 0 80px", background: "var(--ivory)", minHeight: "80vh" }}>
        <div className="container" style={{ maxWidth: "860px" }}>
          <div style={{ marginBottom: "32px" }}>
            <Link href="/" className="text-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
              <ArrowLeft size={16} /> Back to Storefront
            </Link>
            <p className="eyebrow">Legal & Operational Terms</p>
            <h1 style={{ font: "600 38px/1.15 var(--font-serif)", color: "var(--ink)", margin: "0 0 16px" }}>
              Terms &amp; Conditions
            </h1>
            <p style={{ color: "var(--secondary)", fontSize: "15px", lineHeight: "1.7" }}>
              Last Revised: September 2026 • Flavours of India, Ganjam, Odisha
            </p>
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
                1. Agreement to Terms
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--secondary)", margin: 0 }}>
                By accessing, browsing, or purchasing from Flavours of India, you agree to comply with and be bound by these Terms and Conditions and our associated Return, Refund, Cancellation, and Privacy Policies.
              </p>
            </section>

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: 0 }} />

            <section>
              <h2 style={{ font: "600 20px var(--font-serif)", color: "var(--ink)", margin: "0 0 10px" }}>
                2. Product Freshness &amp; Food Quality
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--secondary)", margin: 0 }}>
                All our products are crafted in small batches using authentic regional spices and traditional preparation methods. Natural variations in colour, texture, and aroma are inherent to small-batch handmade foods and are proof of authentic artisanal production.
              </p>
            </section>

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: 0 }} />

            <section>
              <h2 style={{ font: "600 20px var(--font-serif)", color: "var(--ink)", margin: "0 0 10px" }}>
                3. Pricing and Payment
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--secondary)", margin: 0 }}>
                All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes. Orders become valid once UPI payment verification or pre-authorized transaction reference is confirmed by our operations team.
              </p>
            </section>

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: 0 }} />

            <section>
              <h2 style={{ font: "600 20px var(--font-serif)", color: "var(--ink)", margin: "0 0 10px" }}>
                4. Jurisdiction &amp; Dispute Resolution
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--secondary)", margin: 0 }}>
                These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any legal disputes arising in relation to transactions on this platform shall be subject to the exclusive jurisdiction of the courts located in Berhampur / Ganjam district, Odisha, India.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
