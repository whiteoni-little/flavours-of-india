import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Edit3,
  ImagePlus,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import AdminProductModal, {
  type AdminProductData,
} from "@/components/AdminProductModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStock, setSelectedStock] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProductData | null>(
    null
  );

  // Delete state
  const [deletingProduct, setDeletingProduct] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedStock !== "all") params.set("stockStatus", selectedStock);
      params.set("pageSize", "50");

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotal(data.total || 0);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Error fetching admin products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedStock]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deletingProduct.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeletingProduct(null);
        fetchProducts();
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPrice = (minorUnits: number | null) => {
    if (minorUnits === null || minorUnits === undefined) return "—";
    return `₹${(minorUnits / 100).toFixed(0)}`;
  };

  return (
    <AdminLayout>
      <div className="admin-topbar product-topbar">
        <div>
          <Link href="/admin" className="admin-back">
            <ArrowLeft size={15} /> Overview
          </Link>
          <p className="eyebrow">Catalogue management</p>
          <h1>Products</h1>
        </div>
        <button className="admin-primary" onClick={handleOpenAdd}>
          <Plus size={17} /> Add product
        </button>
      </div>

      <div className="sample-banner">
        Connected to persistent backend. Live changes synchronize directly with
        customer storefront.
      </div>

      <div className="product-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search by title, SKU, or category"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ position: "relative" }}>
          <select
            className="filter-button"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{
              appearance: "none",
              paddingRight: "30px",
              height: "42px",
              outline: 0,
            }}
          >
            <option value="all">All categories</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
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

        <div style={{ position: "relative" }}>
          <select
            className="filter-button"
            value={selectedStock}
            onChange={e => setSelectedStock(e.target.value)}
            style={{
              appearance: "none",
              paddingRight: "30px",
              height: "42px",
              outline: 0,
            }}
          >
            <option value="all">All stock statuses</option>
            <option value="in_stock">In stock</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="draft">Draft</option>
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
          <span>
            {total} product{total === 1 ? "" : "s"} found
          </span>
          <span>Live Operations Workspace</span>
        </div>

        {loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <p
              style={{ font: "600 20px var(--font-serif)", margin: "0 0 8px" }}
            >
              No products found
            </p>
            <p
              style={{
                color: "var(--secondary)",
                fontSize: "14px",
                margin: "0 0 20px",
              }}
            >
              {search || selectedCategory !== "all" || selectedStock !== "all"
                ? "Try clearing your search or filter options."
                : "Your catalogue is currently empty. Click 'Add product' to create your first item."}
            </p>
            <button className="primary-button" onClick={handleOpenAdd}>
              <Plus size={16} /> Add first product
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Storefront</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, idx) => {
                const primaryImg = p.images?.[0]?.publicUrl;
                const toneClass = `tone-0${(idx % 4) + 1}`;

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="table-product">
                        {primaryImg ? (
                          <img
                            src={primaryImg}
                            alt={p.title}
                            className="table-thumb"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <span className={`table-thumb ${toneClass}`}>
                            {p.title.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <strong>{p.title}</strong>
                          <small style={{ fontFamily: "monospace" }}>
                            /product/{p.slug}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td className="gold-text">
                      {formatPrice(p.priceInMinorUnits)}
                    </td>
                    <td>
                      <span
                        className={`stock-pill ${
                          p.stockStatus === "in_stock"
                            ? "in"
                            : p.stockStatus === "draft"
                              ? "draft"
                              : ""
                        }`}
                        style={
                          p.stockStatus === "draft"
                            ? { background: "#EFE0C9", color: "#765C37" }
                            : undefined
                        }
                      >
                        {p.stockStatus === "in_stock"
                          ? "In stock"
                          : p.stockStatus === "out_of_stock"
                            ? "Out of stock"
                            : "Draft"}
                      </span>
                    </td>
                    <td>
                      {p.isPublished ? (
                        <span
                          style={{
                            color: "var(--olive)",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          ● Published
                        </span>
                      ) : (
                        <span
                          style={{ color: "var(--muted)", fontSize: "12px" }}
                        >
                          ○ Hidden
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="table-action"
                        title="Edit product"
                        onClick={() => handleOpenEdit(p)}
                        aria-label={`Edit ${p.title}`}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        className="table-action"
                        title="Archive product"
                        onClick={() =>
                          setDeletingProduct({ id: p.id, title: p.title })
                        }
                        aria-label={`Archive ${p.title}`}
                      >
                        <Trash2 size={15} />
                      </button>
                      {p.isPublished && (
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          className="table-action"
                          title="View on storefront"
                          style={{
                            display: "inline-grid",
                            placeItems: "center",
                          }}
                        >
                          <MoreHorizontal size={15} />
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section
        className="add-product-preview"
        style={{ cursor: "pointer" }}
        onClick={handleOpenAdd}
      >
        <div>
          <p className="eyebrow">Catalogue actions</p>
          <h2>Add a product to expand your regional range.</h2>
          <p>
            Supports multi-image upload, SEO-friendly slugs, pricing in ₹, stock
            status controls, and rich ingredient/sourcing notes.
          </p>
        </div>
        <div className="dropzone">
          <ImagePlus size={24} />
          <strong>Click to add a new product</strong>
          <span>Multi-image upload · instant storefront synchronization</span>
        </div>
      </section>

      {/* Add / Edit Product Modal */}
      <AdminProductModal
        isOpen={isModalOpen}
        product={editingProduct}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSaved={fetchProducts}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingProduct)}
        productTitle={deletingProduct?.title || ""}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingProduct(null)}
      />
    </AdminLayout>
  );
}
