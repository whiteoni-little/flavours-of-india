import React from "react";
import { ArrowLeft, ArrowRight, BookOpen, Clock, Heart, Share2, Sparkles, Tag } from "lucide-react";
import { Link, useRoute } from "wouter";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { BLOG_POSTS } from "@/data/blogData";
import NotFound from "./NotFound";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug;

  const post = BLOG_POSTS.find(p => p.slug === slug);

  if (!post) {
    return <NotFound />;
  }

  const otherPosts = BLOG_POSTS.filter(p => p.id !== post.id).slice(0, 2);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Article link copied to clipboard!");
    }
  };

  return (
    <div className="site-shell">
      <SiteHeader announcement={`Pantry Journal: ${post.category} • Flavours of India`} />

      <main style={{ background: "var(--ivory)", minHeight: "85vh", paddingBottom: "96px" }}>
        {/* Article Header */}
        <article className="container" style={{ maxWidth: "820px", paddingTop: "48px" }}>
          <div style={{ marginBottom: "24px" }}>
            <Link
              href="/blog"
              className="text-link"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}
            >
              <ArrowLeft size={16} /> Back to All Stories
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--terracotta)",
                  background: "rgba(224, 122, 95, 0.12)",
                  padding: "4px 10px",
                  borderRadius: "4px",
                }}
              >
                {post.category}
              </span>
              <span style={{ fontSize: "13px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Clock size={13} /> {post.readTime}
              </span>
            </div>
            <h1
              style={{
                font: "600 40px/1.2 var(--font-serif)",
                color: "var(--ink)",
                margin: "0 0 16px",
              }}
            >
              {post.title}
            </h1>
            <p
              style={{
                fontSize: "18px",
                lineHeight: "1.6",
                color: "var(--secondary)",
                margin: "0 0 24px",
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
              }}
            >
              {post.subtitle}
            </p>

            {/* Author bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 0",
                borderTop: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
                marginBottom: "32px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "var(--terracotta)",
                    color: "#FFF",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                >
                  DP
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "14px", color: "var(--ink)" }}>
                    {post.author.name}
                  </strong>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                    {post.author.role} • {post.publishedDate}
                  </span>
                </div>
              </div>
              <button
                onClick={handleShare}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "var(--sunken)",
                  border: "1px solid var(--border)",
                  padding: "8px 14px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  cursor: "pointer",
                  color: "var(--ink)",
                }}
              >
                <Share2 size={15} /> Share Story
              </button>
            </div>
          </div>

          {/* Cover Hero Image */}
          <div
            style={{
              width: "100%",
              height: "420px",
              borderRadius: "10px",
              overflow: "hidden",
              marginBottom: "40px",
              boxShadow: "0 12px 32px rgba(32, 27, 22, 0.08)",
            }}
          >
            <img
              src={post.coverImage}
              alt={post.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>

          {/* Article Sections */}
          <div
            style={{
              fontSize: "16px",
              lineHeight: "1.85",
              color: "var(--ink)",
              display: "flex",
              flexDirection: "column",
              gap: "32px",
            }}
          >
            {post.content.map((sec, idx) => (
              <section key={idx}>
                {sec.sectionHeading && (
                  <h2
                    style={{
                      font: "600 24px/1.3 var(--font-serif)",
                      color: "var(--ink)",
                      margin: "0 0 16px",
                    }}
                  >
                    {sec.sectionHeading}
                  </h2>
                )}
                <p style={{ margin: "0 0 16px", color: "var(--ink)" }}>{sec.body}</p>
                {sec.highlight && (
                  <blockquote
                    style={{
                      background: "var(--raised)",
                      borderLeft: "4px solid var(--terracotta)",
                      margin: "24px 0",
                      padding: "20px 24px",
                      borderRadius: "0 8px 8px 0",
                      fontFamily: "var(--font-serif)",
                      fontStyle: "italic",
                      fontSize: "18px",
                      lineHeight: "1.6",
                      color: "#4A3B32",
                    }}
                  >
                    "{sec.highlight}"
                  </blockquote>
                )}
              </section>
            ))}
          </div>

          {/* Tags */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "40px",
              paddingTop: "24px",
              borderTop: "1px solid var(--border)",
            }}
          >
            {post.tags.map(t => (
              <span
                key={t}
                style={{
                  background: "var(--sunken)",
                  border: "1px solid var(--border)",
                  color: "var(--secondary)",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                }}
              >
                #{t}
              </span>
            ))}
          </div>

          {/* Call to action: Explore Shop */}
          <div
            style={{
              background: "linear-gradient(135deg, #2E2520 0%, #1E1A16 100%)",
              color: "#FFF",
              padding: "40px",
              borderRadius: "10px",
              marginTop: "48px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px",
            }}
          >
            <div>
              <p className="eyebrow light" style={{ margin: "0 0 8px", color: "#E07A5F" }}>
                Authentic Taste from Ganjam, Odisha
              </p>
              <h3 style={{ font: "600 24px var(--font-serif)", margin: "0 0 8px", color: "#FFF" }}>
                Ready to taste the real thing?
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: "#B8B0A4", maxWidth: "440px" }}>
                Order small-batch pickles, crispy murukku, and handmade papads packed with love.
              </p>
            </div>
            <Link
              href="/collection"
              className="primary-button"
              style={{ background: "#E07A5F", color: "#FFF", border: "none" }}
            >
              Shop Pantry <ArrowRight size={17} />
            </Link>
          </div>

          {/* Related Articles */}
          {otherPosts.length > 0 && (
            <div style={{ marginTop: "64px" }}>
              <h3 style={{ font: "600 24px var(--font-serif)", color: "var(--ink)", marginBottom: "24px" }}>
                More from the Pantry Journal
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                {otherPosts.map(op => (
                  <Link
                    key={op.id}
                    href={`/blog/${op.slug}`}
                    style={{
                      background: "var(--raised)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "20px",
                      textDecoration: "none",
                      color: "inherit",
                      display: "block",
                    }}
                  >
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--terracotta)", textTransform: "uppercase" }}>
                      {op.category}
                    </span>
                    <h4 style={{ font: "600 17px/1.3 var(--font-serif)", color: "var(--ink)", margin: "8px 0" }}>
                      {op.title}
                    </h4>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>{op.readTime}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
