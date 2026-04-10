"use client";

import { useState, useTransition, useActionState, useRef } from "react";
import {
  saveProductAction,
  deleteProductAction,
  toggleProductActiveAction,
  toggleProductFeaturedAction,
} from "@/lib/admin/actions";
import {
  Plus, Edit2, Trash2, X, AlertCircle, Eye, EyeOff, Star, StarOff, Upload, Image,
} from "lucide-react";
import type { Product } from "@/lib/data/products";
import { formatPrice } from "@/lib/data/products";

type FormResult = { error?: string; success?: boolean } | null;

const COLLECTIONS = [
  { value: "women",          label: "Women" },
  { value: "men",            label: "Men" },
  { value: "accessories",    label: "Accessories" },
  { value: "limited-edition",label: "Limited Edition" },
];

const COLLECTION_COLORS: Record<string, string> = {
  "women":           "#e879a0",
  "men":             "#4a90d9",
  "accessories":     "#c8956c",
  "limited-edition": "#8b5cf6",
};

export default function ProductsClient({ products }: { products: Product[] }) {
  const [editing, setEditing]       = useState<Product | null>(null);
  const [creating, setCreating]     = useState(false);
  const [, startTransition]         = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [imagePreview, setImagePreview]   = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formState, formAction, formPending] = useActionState(
    async (_prev: FormResult, fd: FormData): Promise<FormResult> => {
      const result = await saveProductAction(fd);
      if (result?.success) {
        setEditing(null);
        setCreating(false);
        setImagePreview("");
      }
      return result;
    },
    null,
  );

  const openCreate = () => {
    setEditing(null);
    setImagePreview("");
    setCreating(true);
  };

  const openEdit = (p: Product) => {
    setCreating(false);
    setImagePreview(p.image_url);
    setEditing(p);
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
    setImagePreview("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImagePreview(e.target.value);
  };

  const handleToggleActive = (p: Product) => {
    setTogglingId(p.id + "_active");
    startTransition(async () => {
      await toggleProductActiveAction(p.id, !p.active);
      setTogglingId(null);
    });
  };

  const handleToggleFeatured = (p: Product) => {
    setTogglingId(p.id + "_featured");
    startTransition(async () => {
      await toggleProductFeaturedAction(p.id, !p.featured);
      setTogglingId(null);
    });
  };

  const handleDelete = (productId: string) => {
    startTransition(async () => {
      await deleteProductAction(productId);
      setConfirmDelete(null);
    });
  };

  const showForm = editing || creating;

  return (
    <div>
      {!showForm && (
        <button className="admin-btn admin-btn--primary" onClick={openCreate} style={{ marginBottom: "24px" }}>
          <Plus size={16} /> Add New Product
        </button>
      )}

      {/* ── Product Form ─────────────────────────────────────────────────── */}
      {showForm && (
        <div className="admin-form-card" style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 className="admin-section-title" style={{ margin: 0 }}>
              {editing ? "Edit Product" : "New Product"}
            </h2>
            <button className="admin-btn admin-btn--icon" onClick={closeForm}><X size={18} /></button>
          </div>

          {formState?.error && (
            <div className="admin-alert admin-alert--error" style={{ marginBottom: "20px" }}>
              <AlertCircle size={16} /> {formState.error}
            </div>
          )}

          <form action={formAction}>
            {editing && <input type="hidden" name="id" value={editing.id} />}

            <div style={{ display: "grid", gap: "20px" }}>
              {/* Row 1: name + category */}
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Product Name *</label>
                  <input name="name" required defaultValue={editing?.name} placeholder="e.g. Elegant Silk Dress" />
                </div>
                <div className="admin-form-group">
                  <label>Category *</label>
                  <input name="category" required defaultValue={editing?.category} placeholder="e.g. Evening Wear" />
                </div>
              </div>

              {/* Row 2: collection + price + sort */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: "16px" }}>
                <div className="admin-form-group">
                  <label>Collection *</label>
                  <select name="collection" defaultValue={editing?.collection ?? "women"}>
                    {COLLECTIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Price (N$) *</label>
                  <input name="price" type="number" step="0.01" min="0" required
                    defaultValue={editing?.price} placeholder="0.00" />
                </div>
                <div className="admin-form-group">
                  <label>Sort Order</label>
                  <input name="sort_order" type="number" defaultValue={editing?.sort_order ?? 0} />
                </div>
              </div>

              {/* Image section */}
              <div className="admin-form-group">
                <label>Product Image</label>
                <div className="product-image-upload-wrap">
                  {/* File upload */}
                  <div
                    className="product-upload-drop"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={20} style={{ color: "#c8956c" }} />
                    <span>Click to upload image file</span>
                    <span style={{ fontSize: "0.75rem", color: "#aaa" }}>JPG, PNG, WEBP up to 5MB</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="image_file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="product-upload-or">or enter URL</div>
                  <input
                    name="image_url"
                    defaultValue={editing?.image_url}
                    placeholder="https://... or /image.jpg"
                    onChange={handleUrlChange}
                    style={{ padding: "10px 14px", border: "1px solid #e8ddd0", borderRadius: "8px", fontSize: "0.9rem" }}
                  />
                </div>
                {imagePreview && (
                  <div style={{ marginTop: "12px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e8ddd0" }}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <button type="button" className="admin-btn admin-btn--ghost"
                      onClick={() => { setImagePreview(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="admin-form-group">
                <label>Alt Text (for accessibility)</label>
                <input name="alt_text" defaultValue={editing?.alt_text} placeholder="Describe the image" />
              </div>

              {/* Flags */}
              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
                  <input type="checkbox" name="active" value="true"
                    defaultChecked={editing ? editing.active : true} />
                  Active (visible on storefront)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
                  <input type="checkbox" name="featured" value="true"
                    defaultChecked={editing?.featured ?? false} />
                  Featured (show in New Arrivals)
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={closeForm}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={formPending}>
                  {formPending ? "Saving…" : editing ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Products Grid ────────────────────────────────────────────────── */}
      {!showForm && (
        products.length === 0 ? (
          <div className="admin-empty">
            <Image size={48} />
            <p>No products yet. Add your first product above.</p>
          </div>
        ) : (
          <div className="admin-products-grid">
            {products.map((product) => (
              <div key={product.id} className={`admin-product-card ${!product.active ? "admin-product-card--inactive" : ""}`}>
                <div className="admin-product-card__img">
                  {product.image_url
                    ? <img src={product.image_url} alt={product.alt_text || product.name} />
                    : <div className="admin-product-card__img-placeholder"><Image size={32} /></div>
                  }
                  <div className="admin-product-card__badges">
                    {product.featured && (
                      <span className="admin-product-badge admin-product-badge--featured">Featured</span>
                    )}
                    {!product.active && (
                      <span className="admin-product-badge admin-product-badge--inactive">Hidden</span>
                    )}
                  </div>
                </div>

                <div className="admin-product-card__body">
                  <p className="admin-product-card__name">{product.name}</p>
                  <p className="admin-product-card__meta">
                    <span className="admin-badge" style={{
                      background: `${COLLECTION_COLORS[product.collection]}22`,
                      color: COLLECTION_COLORS[product.collection],
                      marginRight: "6px",
                    }}>
                      {product.collection}
                    </span>
                    {product.category}
                  </p>
                  <p className="admin-product-card__price">{formatPrice(product.price)}</p>
                </div>

                <div className="admin-product-card__actions">
                  <button
                    className="admin-btn admin-btn--icon"
                    title={product.featured ? "Remove from featured" : "Mark as featured"}
                    disabled={togglingId === product.id + "_featured"}
                    onClick={() => handleToggleFeatured(product)}
                  >
                    {product.featured ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                  </button>
                  <button
                    className="admin-btn admin-btn--icon"
                    title={product.active ? "Hide from storefront" : "Show on storefront"}
                    disabled={togglingId === product.id + "_active"}
                    onClick={() => handleToggleActive(product)}
                  >
                    {product.active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    className="admin-btn admin-btn--icon"
                    title="Edit"
                    onClick={() => openEdit(product)}
                  >
                    <Edit2 size={14} />
                  </button>
                  {confirmDelete === product.id ? (
                    <>
                      <button className="admin-btn admin-btn--danger" style={{ padding: "5px 10px", fontSize: "0.75rem" }}
                        onClick={() => handleDelete(product.id)}>
                        Delete
                      </button>
                      <button className="admin-btn admin-btn--ghost" style={{ padding: "5px 10px", fontSize: "0.75rem" }}
                        onClick={() => setConfirmDelete(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="admin-btn admin-btn--icon"
                      title="Delete"
                      onClick={() => setConfirmDelete(product.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
