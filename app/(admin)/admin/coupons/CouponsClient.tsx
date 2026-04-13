"use client";

import { useActionState, useState, useTransition } from "react";
import { deleteCouponAction, saveCouponAction, toggleCouponActiveAction } from "@/lib/admin/actions";
import type { AdminCoupon } from "@/lib/admin/data";
import type { Product } from "@/lib/data/productModel";
import { Plus, Edit2, Trash2, Eye, EyeOff, TicketPercent, X, AlertCircle } from "lucide-react";

type FormState = { error?: string; success?: boolean } | null;
type ScopeType = "all" | "collection" | "product";

const COLLECTIONS = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "accessories", label: "Accessories" },
  { value: "limited-edition", label: "Limited Edition" },
];

function scopeLabel(coupon: AdminCoupon, products: Product[]): string {
  const target = coupon.coupon_targets?.[0];
  if (!target) return "All products";
  if (target.target_type === "all") return "All products";
  if (target.target_type === "collection") return `Collection: ${target.collection ?? "Unknown"}`;
  const p = products.find((x) => x.id === target.product_id);
  return p ? `Product: ${p.name}` : "Specific product";
}

export default function CouponsClient({ coupons, products }: { coupons: AdminCoupon[]; products: Product[] }) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [scopeType, setScopeType] = useState<ScopeType>("all");

  const [formState, formAction, formPending] = useActionState(
    async (_prev: FormState, fd: FormData): Promise<FormState> => {
      const result = await saveCouponAction(fd);
      if (result?.success) {
        setEditing(null);
        setCreating(false);
        setScopeType("all");
      }
      return result;
    },
    null,
  );

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setScopeType("all");
  };

  const openEdit = (coupon: AdminCoupon) => {
    setCreating(false);
    setEditing(coupon);
    const target = coupon.coupon_targets?.[0];
    setScopeType((target?.target_type as ScopeType) ?? "all");
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
    setScopeType("all");
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteCouponAction(id);
      setConfirmDelete(null);
    });
  };

  const handleToggleActive = (coupon: AdminCoupon) => {
    setTogglingId(coupon.id);
    startTransition(async () => {
      await toggleCouponActiveAction(coupon.id, !coupon.active);
      setTogglingId(null);
    });
  };

  const activeTarget = editing?.coupon_targets?.[0];
  const showForm = creating || !!editing;

  return (
    <div>
      {!showForm && (
        <button className="admin-btn admin-btn--primary" onClick={openCreate} style={{ marginBottom: "24px" }}>
          <Plus size={16} /> Add Coupon
        </button>
      )}

      {showForm && (
        <div className="admin-form-card" style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
            <h2 className="admin-section-title" style={{ margin: 0 }}>
              {editing ? "Edit Coupon" : "New Coupon"}
            </h2>
            <button type="button" className="admin-btn admin-btn--icon" onClick={closeForm}>
              <X size={18} />
            </button>
          </div>

          {formState?.error && (
            <div className="admin-alert admin-alert--error" style={{ marginBottom: "18px" }}>
              <AlertCircle size={16} /> {formState.error}
            </div>
          )}

          <form action={formAction}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Coupon Code *</label>
                <input name="code" required defaultValue={editing?.code ?? ""} placeholder="RAUVEI20" />
              </div>
              <div className="admin-form-group">
                <label>Description</label>
                <input name="description" defaultValue={editing?.description ?? ""} placeholder="Winter promotion" />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Discount Type</label>
                <select name="discount_type" defaultValue={editing?.discount_type ?? "percent"}>
                  <option value="percent">Percent (%)</option>
                  <option value="fixed_amount">Fixed amount (N$)</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Discount Value *</label>
                <input
                  name="discount_value"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  defaultValue={editing?.discount_value ?? ""}
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Starts At</label>
                <input
                  name="starts_at"
                  type="date"
                  defaultValue={editing?.starts_at ? editing.starts_at.slice(0, 10) : ""}
                />
              </div>
              <div className="admin-form-group">
                <label>Expires At (optional)</label>
                <input
                  name="expires_at"
                  type="date"
                  defaultValue={editing?.expires_at ? editing.expires_at.slice(0, 10) : ""}
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Usage Limit (optional)</label>
                <input
                  name="usage_limit"
                  type="number"
                  min={1}
                  step="1"
                  defaultValue={editing?.usage_limit ?? ""}
                  placeholder="e.g. 100"
                />
              </div>
              <div className="admin-form-group">
                <label>Scope</label>
                <select
                  name="scope_type"
                  value={scopeType}
                  onChange={(e) => setScopeType(e.target.value as ScopeType)}
                >
                  <option value="all">All Products</option>
                  <option value="collection">Specific Collection</option>
                  <option value="product">Specific Product</option>
                </select>
              </div>
            </div>

            {scopeType === "collection" && (
              <div className="admin-form-group">
                <label>Collection</label>
                <select name="scope_collection" defaultValue={activeTarget?.collection ?? "women"}>
                  {COLLECTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            )}

            {scopeType === "product" && (
              <div className="admin-form-group">
                <label>Product</label>
                <select name="scope_product_id" defaultValue={activeTarget?.product_id ?? ""}>
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="admin-form-group" style={{ marginBottom: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input type="checkbox" name="active" value="true" defaultChecked={editing ? editing.active : true} />
                Coupon is active
              </label>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" className="admin-btn admin-btn--ghost" onClick={closeForm}>Cancel</button>
              <button type="submit" className="admin-btn admin-btn--primary" disabled={formPending}>
                {formPending ? "Saving..." : "Save Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}

      {coupons.length === 0 && !showForm ? (
        <div className="admin-empty">
          <TicketPercent size={48} />
          <p>No coupons created yet.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Scope</th>
                <th>Usage</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} style={{ opacity: coupon.active ? 1 : 0.55 }}>
                  <td>
                    <strong>{coupon.code}</strong>
                    {coupon.description && (
                      <span className="admin-td-muted" style={{ display: "block", marginTop: "3px" }}>
                        {coupon.description}
                      </span>
                    )}
                  </td>
                  <td>
                    {coupon.discount_type === "percent"
                      ? `${Number(coupon.discount_value).toFixed(0)}%`
                      : `N$${Number(coupon.discount_value).toFixed(2)}`}
                  </td>
                  <td className="admin-td-muted">{scopeLabel(coupon, products)}</td>
                  <td className="admin-td-muted">
                    {coupon.used_count}
                    {coupon.usage_limit ? ` / ${coupon.usage_limit}` : " / unlimited"}
                  </td>
                  <td className="admin-td-muted">
                    {new Date(coupon.starts_at).toLocaleDateString("en-GB")}
                    {coupon.expires_at ? ` → ${new Date(coupon.expires_at).toLocaleDateString("en-GB")}` : " → no expiry"}
                  </td>
                  <td>
                    <span className="admin-badge">
                      {coupon.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn--icon"
                        title={coupon.active ? "Deactivate" : "Activate"}
                        disabled={togglingId === coupon.id}
                        onClick={() => handleToggleActive(coupon)}
                      >
                        {coupon.active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button type="button" className="admin-btn admin-btn--icon" onClick={() => openEdit(coupon)} title="Edit">
                        <Edit2 size={14} />
                      </button>
                      {confirmDelete === coupon.id ? (
                        <>
                          <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(coupon.id)}>Confirm</button>
                          <button className="admin-btn admin-btn--ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
                        </>
                      ) : (
                        <button className="admin-btn admin-btn--icon" onClick={() => setConfirmDelete(coupon.id)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
