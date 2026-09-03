import React, { useState } from "react";
import { ArrowRight, BookOpen, Clock, Filter, Sparkles, Tag } from "lucide-react";
import { Link } from "wouter";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { BLOG_POSTS, type BlogPost } from "@/data/blogData";

const categories = ["All Stories", "Heritage Recipes", "Snack Culture", "Health & Ingredients", "Regional Stories"];

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All Stories");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = BLOG_POSTS.filter(post => {
    const matchesCat =
      activeCategory === "All Stories" || post.category === activeCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const featuredPost = BLOG_POSTS[0];

  return (
    <div className="site-shell">
      <SiteHeader announcement="Stories of Spice, Tradition & Everyday Joy from Ganjam, Odisha" />

      <main style={{ background: "var(--ivory)", minHeight: "85vh", paddingBottom: "96px" }}>
        {/* Hero Section */}
        <section
          style={{
            background: "linear-gradient(180deg, #F5F0E6 0%, var(--ivory) 100%)",
            padding: "64px 0 48px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="container" style={{ maxWidth: "1000px", textAlign: "center" }}>
            <p className="eyebrow" style={{ justifyContent: "center" }}>
              <BookOpen size={14} /> Pantry Journal &amp; Regional Heritage
            </p>
            <h1
              style={{
                font: "600 48px/1.1 var(--font-serif)",
                color: "var(--ink)",
                margin: "0 0 18px",
              }}
            >
              The Pantry Chronicle
            </h1>
            <p
              style={{
                color: "var(--secondary)",
                fontSize: "17px",
                maxWidth: "620px",
                margin: "0 auto 32px",
                lineHeight: "1.7",
              }}
            >
              Stories behind small-batch pickling, the artisanal geometry of regional savouries, and recipes preserved through generations in Ganjam, Odisha.
            </p>

            {/* Category Filter Pills */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "30px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: activeCategory === cat ? "var(--terracotta)" : "var(--border)",
                    background: activeCategory === cat ? "var(--terracotta)" : "var(--raised)",
                    color: activeCategory === cat ? "#FFF" : "var(--ink)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="container" style={{ maxWidth: "1100px", paddingTop: "48px" }}>
          {/* Spotlight Featured Article (When on All Stories) */}
          {activeCategory === "All Stories" && !searchQuery && (
            <div
              style={{
                background: "var(--raised)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "56px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                boxShadow: "0 12px 32px rgba(32, 27, 22, 0.05)",
              }}
            >
              <div style={{ height: "100%", minHeight: "320px", overflow: "hidden" }}>
                <img
                  src={featuredPost.coverImage}
                  alt={featuredPost.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
              <div
                style={{
                  padding: "40px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      background: "rgba(224, 122, 95, 0.12)",
                      color: "var(--terracotta)",
                      padding: "4px 10px",
                      borderRadius: "4px",
                    }}
                  >
                    Featured Story
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                    <Clock size={12} style={{ display: "inline", marginRight: "4px" }} />
                    {featuredPost.readTime}
                  </span>
                </div>
                <h2
                  style={{
                    font: "600 28px/1.2 var(--font-serif)",
                    color: "var(--ink)",
                    margin: "0 0 14px",
                  }}
                >
                  <Link href={`/blog/${featuredPost.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {featuredPost.title}
                  </Link>
                </h2>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--secondary)",
                    lineHeight: "1.7",
                    margin: "0 0 24px",
                  }}
                >
                  {featuredPost.excerpt}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "var(--terracotta)",
                        color: "#FFF",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "13px",
                        fontWeight: 700,
                      }}
                    >
                      DP
                    </div>
                    <div>
                      <strong style={{ display: "block", fontSize: "13px", color: "var(--ink)" }}>
                        {featuredPost.author.name}
                      </strong>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                        {featuredPost.publishedDate}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="primary-button"
                    style={{ padding: "10px 18px", fontSize: "13px" }}
                  >
                    Read Story <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Grid of Articles */}
          <div style={{ marginBottom: "28px" }}>
            <h3 style={{ font: "600 22px var(--font-serif)", color: "var(--ink)", margin: 0 }}>
              {activeCategory === "All Stories" ? "Recent Pantry Dispatches" : activeCategory}
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "28px",
            }}
          >
            {filteredPosts.map(post => (
              <article
                key={post.id}
                style={{
                  background: "var(--raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  boxShadow: "0 4px 16px rgba(32, 27, 22, 0.03)",
                }}
              >
                <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none", display: "block", height: "200px", overflow: "hidden" }}>
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.4s ease",
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)")}
                    onMouseLeave={e => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1)")}
                  />
                </Link>
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "var(--terracotta)",
                      }}
                    >
                      {post.category}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} /> {post.readTime}
                    </span>
                  </div>
                  <h3
                    style={{
                      font: "600 20px/1.3 var(--font-serif)",
                      color: "var(--ink)",
                      margin: "0 0 10px",
                    }}
                  >
                    <Link href={`/blog/${post.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                      {post.title}
                    </Link>
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--secondary)",
                      lineHeight: "1.6",
                      margin: "0 0 20px",
                      flex: 1,
                    }}
                  >
                    {post.excerpt}
                  </p>
                  <div
                    style={{
                      borderTop: "1px solid var(--border)",
                      paddingTop: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                      {post.publishedDate}
                    </span>
                    <Link
                      href={`/blog/${post.slug}`}
                      style={{
                        color: "var(--terracotta)",
                        fontSize: "13px",
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      Read Story <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
