import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";

interface ProductImage {
  id?: string;
  storageKey: string;
  publicUrl: string;
  altText?: string;
  sortOrder: number;
  file?: File;
}

export interface AdminProductData {
  id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  longDescription?: string | null;
  category: string;
  priceInMinorUnits?: number | null;
  currency: string;
  stockStatus: "in_stock" | "out_of_stock" | "draft";
  isPublished: boolean;
  sourcingNote?: string | null;
  ingredients?: string | null;
  shelfLife?: string | null;
  images?: ProductImage[];
}

interface AdminProductModalProps {
  isOpen: boolean;
  product?: AdminProductData | null;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = ["Pickles", "Papad", "Roasted snacks", "Sweet things"];

export default function AdminProductModal({
  isOpen,
  product,
  onClose,
  onSaved,
}: AdminProductModalProps) {
  const isEditing = Boolean(product?.id);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [category, setCategory] = useState("Pickles");
  const [customCategory, setCustomCategory] = useState("");
  const [priceInRupees, setPriceInRupees] = useState("");
  const [stockStatus, setStockStatus] = useState<
    "in_stock" | "out_of_stock" | "draft"
  >("in_stock");
  const [isPublished, setIsPublished] = useState(false);
  const [sourcingNote, setSourcingNote] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [shelfLife, setShelfLife] = useState("");
  const [images, setImages] = useState<ProductImage[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualSlug, setManualSlug] = useState(false);

  useEffect(() => {
    if (product) {
      setTitle(product.title || "");
      setSlug(product.slug || "");
      setShortDescription(product.shortDescription || "");
      setLongDescription(product.longDescription || "");
      if (CATEGORIES.includes(product.category)) {
        setCategory(product.category);
        setCustomCategory("");
      } else {
        setCategory("Other");
        setCustomCategory(product.category || "");
      }
      setPriceInRupees(
        product.priceInMinorUnits !== null &&
          product.priceInMinorUnits !== undefined
          ? (product.priceInMinorUnits / 100).toString()
          : ""
      );
      setStockStatus(product.stockStatus || "in_stock");
      setIsPublished(Boolean(product.isPublished));
      setSourcingNote(product.sourcingNote || "");
      setIngredients(product.ingredients || "");
      setShelfLife(product.shelfLife || "");
      setImages(product.images || []);
      setManualSlug(true);
    } else {
      // Reset form
      setTitle("");
      setSlug("");
      setShortDescription("");
      setLongDescription("");
      setCategory("Pickles");
      setCustomCategory("");
      setPriceInRupees("");
      setStockStatus("in_stock");
      setIsPublished(false);
      setSourcingNote("");
      setIngredients("");
      setShelfLife("");
      setImages([]);
      setManualSlug(false);
    }
    setErrorMessage(null);
  }, [product, isOpen]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!manualSlug && !isEditing) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generated);
    }
  };

  const handleImageFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setErrorMessage(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // If editing existing product, upload directly to backend
      if (product?.id) {
        try {
          const presignRes = await fetch(
            `/api/admin/products/${product.id}/images/presign`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
              }),
            }
          );

          if (!presignRes.ok) throw new Error("Could not get upload URL");
          const presignData = await presignRes.json();

          if (presignData.method === "PUT") {
            await fetch(presignData.uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": file.type },
              body: file,
            });
          } else {
            // Local fallback upload
            const formData = new FormData();
            formData.append("file", file);
            await fetch(presignData.uploadUrl, {
              method: "POST",
              body: formData,
            });
          }

          const completeRes = await fetch(
            `/api/admin/products/${product.id}/images/complete`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                storageKey: presignData.storageKey,
                publicUrl: presignData.publicUrl,
                altText: `${title || "Product"} image`,
                sortOrder: images.length,
              }),
            }
          );

          if (completeRes.ok) {
            const savedImage = await completeRes.json();
            setImages(prev => [...prev, savedImage]);
          }
        } catch (err: any) {
          console.error("Image upload failed:", err);
          setErrorMessage("Failed to upload image: " + err.message);
        }
      } else {
        // For new product creation: create local preview object and upload during submit or handle preview
        const reader = new FileReader();
        reader.onload = () => {
          const previewUrl = reader.result as string;
          setImages(prev => [
            ...prev,
            {
              storageKey: `local_${Date.now()}_${file.name}`,
              publicUrl: previewUrl,
              altText: `${title || "Product"} image`,
              sortOrder: prev.length,
              file,
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    }

    setUploadingImage(false);
    e.target.value = "";
  };

  const handleRemoveImage = async (index: number, img: ProductImage) => {
    if (product?.id && img.id) {
      try {
        await fetch(`/api/admin/products/${product.id}/images/${img.id}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Failed to delete image:", err);
      }
    }
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const finalCategory =
      category === "Other" ? customCategory.trim() : category;

    if (!title.trim()) {
      setErrorMessage("Product title is required");
      return;
    }
    if (!slug.trim()) {
      setErrorMessage("Product slug is required");
      return;
    }
    if (!shortDescription.trim()) {
      setErrorMessage("Short description is required");
      return;
    }
    if (!finalCategory) {
      setErrorMessage("Category is required");
      return;
    }

    const priceNum = priceInRupees ? parseFloat(priceInRupees) : null;
    const priceInMinorUnits =
      priceNum !== null && !isNaN(priceNum) ? Math.round(priceNum * 100) : null;

    if (isPublished) {
      if (priceInMinorUnits === null || priceInMinorUnits <= 0) {
        setErrorMessage("A product cannot be published without a price in ₹");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        shortDescription: shortDescription.trim(),
        longDescription: longDescription.trim() || null,
        category: finalCategory,
        priceInMinorUnits,
        currency: "INR",
        stockStatus,
        isPublished,
        sourcingNote: sourcingNote.trim() || null,
        ingredients: ingredients.trim() || null,
        shelfLife: shelfLife.trim() || null,
      };

      let res: Response;
      let savedProduct: any;

      if (isEditing) {
        res = await fetch(`/api/admin/products/${product!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        savedProduct = await res.json();
      } else {
        res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        savedProduct = await res.json();

        // Upload any pending new files for this new product
        if (res.ok && savedProduct?.id && images.length > 0) {
          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (img.file) {
              try {
                const presignRes = await fetch(
                  `/api/admin/products/${savedProduct.id}/images/presign`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      filename: img.file.name,
                      contentType: img.file.type,
                    }),
                  }
                );
                if (presignRes.ok) {
                  const presignData = await presignRes.json();
                  const formData = new FormData();
                  formData.append("file", img.file);
                  await fetch(presignData.uploadUrl, {
                    method: "POST",
                    body: formData,
                  });

                  await fetch(
                    `/api/admin/products/${savedProduct.id}/images/complete`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        storageKey: presignData.storageKey,
                        publicUrl: presignData.publicUrl,
                        altText: `${title} image`,
                        sortOrder: i,
                      }),
                    }
                  );
                }
              } catch (e) {
                console.error("Error attaching image to new product:", e);
              }
            }
          }
        }
      }

      if (!res.ok) {
        throw new Error(
          savedProduct.message || savedProduct.error || "Failed to save product"
        );
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(32, 27, 22, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        zIndex: 90,
        overflowY: "auto",
        padding: "32px 16px",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        style={{
          background: "var(--raised)",
          border: "1px solid var(--border)",
          maxWidth: "760px",
          width: "100%",
          padding: "36px",
          boxShadow: "0 24px 48px rgba(32, 27, 22, 0.25)",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "24px",
          }}
        >
          <div>
            <p className="eyebrow" style={{ margin: "0 0 4px" }}>
              {isEditing ? "Edit Catalogue Item" : "New Catalogue Item"}
            </p>
            <h2
              id="modal-title"
              style={{ font: "600 28px var(--font-serif)", margin: 0 }}
            >
              {isEditing ? "Update Product" : "Add a New Product"}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: 0,
              color: "var(--muted)",
              padding: "6px",
              cursor: "pointer",
            }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              background: "#FCE8E6",
              border: "1px solid #FAD2CF",
              color: "#C5221F",
              padding: "12px 16px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title & Slug */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
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
                Product Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. Handmade Mango Pickle"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  background: "var(--sunken)",
                  color: "var(--ink)",
                  fontSize: "14px",
                }}
              />
            </div>

            <div>
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
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={e => {
                  setManualSlug(true);
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                  );
                }}
                placeholder="handmade-mango-pickle"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  background: "var(--sunken)",
                  color: "var(--secondary)",
                  fontSize: "13px",
                  fontFamily: "monospace",
                }}
              />
            </div>
          </div>

          {/* Category, Price & Stock Status */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
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
                Category *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  background: "var(--sunken)",
                  color: "var(--ink)",
                  fontSize: "14px",
                }}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Other">Other / Custom</option>
              </select>
              {category === "Other" && (
                <input
                  type="text"
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: "6px",
                    padding: "8px 12px",
                    border: "1px solid var(--border)",
                    background: "var(--sunken)",
                    fontSize: "13px",
                  }}
                />
              )}
            </div>

            <div>
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
                Price in INR (₹)
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "10px",
                    color: "var(--muted)",
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceInRupees}
                  onChange={e => setPriceInRupees(e.target.value)}
                  placeholder="250.00"
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 28px",
                    border: "1px solid var(--border)",
                    background: "var(--sunken)",
                    color: "var(--ink)",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            <div>
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
                Stock Status
              </label>
              <select
                value={stockStatus}
                onChange={e => setStockStatus(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  background: "var(--sunken)",
                  color: "var(--ink)",
                  fontSize: "14px",
                }}
              >
                <option value="in_stock">In stock</option>
                <option value="out_of_stock">Out of stock</option>
                <option value="draft">Draft only</option>
              </select>
            </div>
          </div>

          {/* Published Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              background: isPublished ? "#E2E7D8" : "var(--sunken)",
              border: "1px solid var(--border)",
              marginBottom: "20px",
            }}
          >
            <input
              type="checkbox"
              id="isPublishedToggle"
              checked={isPublished}
              onChange={e => setIsPublished(e.target.checked)}
              style={{
                width: "18px",
                height: "18px",
                accentColor: "var(--olive)",
                cursor: "pointer",
              }}
            />
            <label
              htmlFor="isPublishedToggle"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--ink)",
                cursor: "pointer",
              }}
            >
              Publish to Customer Storefront
              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 400,
                  color: "var(--secondary)",
                  marginTop: "2px",
                }}
              >
                When published, this product appears in /collection and product
                detail pages. (Requires title, category, and price).
              </span>
            </label>
          </div>

          {/* Short Description */}
          <div style={{ marginBottom: "16px" }}>
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
              Short Description (Card Descriptor) *
            </label>
            <textarea
              required
              rows={2}
              value={shortDescription}
              onChange={e => setShortDescription(e.target.value)}
              placeholder="e.g. Bright, tangy, sun-warmed mango pickle made with slow-roasted spices."
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border)",
                background: "var(--sunken)",
                color: "var(--ink)",
                fontSize: "13px",
                resize: "vertical",
              }}
            />
          </div>

          {/* Long Description */}
          <div style={{ marginBottom: "16px" }}>
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
              Full Editorial Description
            </label>
            <textarea
              rows={3}
              value={longDescription}
              onChange={e => setLongDescription(e.target.value)}
              placeholder="Editorial story, heritage background, taste profile..."
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border)",
                background: "var(--sunken)",
                color: "var(--ink)",
                fontSize: "13px",
                resize: "vertical",
              }}
            />
          </div>

          {/* Sourcing, Ingredients & Shelf Life */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div>
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
                Sourcing Note
              </label>
              <input
                type="text"
                value={sourcingNote}
                onChange={e => setSourcingNote(e.target.value)}
                placeholder="e.g. Berhampur, Ganjam"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--border)",
                  background: "var(--sunken)",
                  fontSize: "13px",
                }}
              />
            </div>
            <div>
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
                Ingredients & Allergens
              </label>
              <input
                type="text"
                value={ingredients}
                onChange={e => setIngredients(e.target.value)}
                placeholder="e.g. Mango, mustard oil, salt"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--border)",
                  background: "var(--sunken)",
                  fontSize: "13px",
                }}
              />
            </div>
            <div>
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
                Shelf Life & Storage
              </label>
              <input
                type="text"
                value={shelfLife}
                onChange={e => setShelfLife(e.target.value)}
                placeholder="e.g. 12 months, store cool"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--border)",
                  background: "var(--sunken)",
                  fontSize: "13px",
                }}
              />
            </div>
          </div>

          {/* Product Images Section */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--muted)",
                }}
              >
                Product Imagery ({images.length})
              </label>
              <label
                style={{
                  background: "var(--sunken)",
                  border: "1px solid var(--border)",
                  color: "var(--terracotta)",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Upload size={14} />
                {uploadingImage ? "Uploading..." : "Upload image"}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageFileSelect}
                  style={{ display: "none" }}
                  disabled={uploadingImage}
                />
              </label>
            </div>

            {images.length === 0 ? (
              <div
                style={{
                  border: "1px dashed var(--border)",
                  padding: "24px",
                  textAlign: "center",
                  background: "var(--sunken)",
                  color: "var(--muted)",
                  fontSize: "13px",
                }}
              >
                <ImagePlus
                  size={24}
                  style={{ margin: "0 auto 8px", display: "block" }}
                />
                <span>
                  No images uploaded yet. Click "Upload image" above or drag
                  images here.
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                  gap: "12px",
                }}
              >
                {images.map((img, idx) => (
                  <div
                    key={img.id || img.storageKey || idx}
                    style={{
                      position: "relative",
                      border: "1px solid var(--border)",
                      background: "#fff",
                      aspectRatio: "1",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={img.publicUrl}
                      alt={img.altText || "Product photo"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "4px",
                        left: "4px",
                        background: "rgba(32, 27, 22, 0.75)",
                        color: "#fff",
                        fontSize: "9px",
                        padding: "2px 5px",
                        borderRadius: "2px",
                      }}
                    >
                      {idx === 0 ? "Cover" : `#${idx + 1}`}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx, img)}
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        background: "rgba(179, 64, 30, 0.9)",
                        color: "#fff",
                        border: 0,
                        width: "22px",
                        height: "22px",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                      }}
                      title="Remove image"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              borderTop: "1px solid var(--border)",
              paddingTop: "20px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                background: "var(--sunken)",
                color: "var(--secondary)",
                padding: "10px 20px",
                fontWeight: 500,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadingImage}
              style={{
                background: "var(--terracotta)",
                color: "var(--ivory)",
                padding: "10px 24px",
                fontWeight: 600,
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isEditing ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
