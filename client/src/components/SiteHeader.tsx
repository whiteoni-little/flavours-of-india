import React, { useState } from "react";
import { ArrowRight, BookOpen, Menu, Package, ShoppingBag, Sparkles, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";

const logo = "/manus-storage/flavours-of-india-logo_4e9a9073.png";

interface SiteHeaderProps {
  announcement?: string;
}

export default function SiteHeader({
  announcement = "A little taste of home, a lot of happiness. Handcrafted in Ganjam, Odisha.",
}: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { totalCount } = useCart();

  return (
    <>
      <div className="announcement">
        <Sparkles size={13} /> {announcement}
      </div>
      <header className="site-header container">
        <Link href="/" className="brand-lockup">
          <img src={logo} className="brand-logo" alt="Flavours of India" />
          <span className="brand-tagline">Goodness from home</span>
        </Link>
        <nav className={open ? "main-nav is-open" : "main-nav"}>
          <Link
            href="/collection"
            className={location === "/collection" ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            The Collection
          </Link>
          <Link
            href="/blog"
            className={location.startsWith("/blog") ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            Pantry Journal
          </Link>
          <Link
            href="/track-order"
            className={location === "/track-order" ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            Track Order
          </Link>
          <a href="/#story" onClick={() => setOpen(false)}>
            Our Story
          </a>
        </nav>
        <div className="header-actions">
          <Link href="/cart" className="icon-button" aria-label="Shopping bag">
            <ShoppingBag size={20} strokeWidth={1.6} />
            <span className="bag-count">{totalCount}</span>
          </Link>
          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>
    </>
  );
}
