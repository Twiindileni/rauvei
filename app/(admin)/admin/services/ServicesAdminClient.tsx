"use client";

import { useState, useTransition, useActionState } from "react";
import {
  saveBoutiqueServiceAction,
  deleteBoutiqueServiceAction,
  toggleBoutiqueServiceActiveAction,
  updateServiceRequestStatusAction,
  deleteServiceRequestAction,
} from "@/lib/admin/actions";
import type { BoutiqueService } from "@/lib/data/boutiqueServices";
import type { AdminServiceRequest } from "@/lib/admin/data";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from "lucide-react";

type FormResult = { error?: string; success?: boolean } | null;

const ICON_OPTIONS: { value: string; label: string }[] = [
  { value: "star", label: "Star" },
  { value: "ruler", label: "Ruler" },
  { value: "scissors", label: "Scissors" },
  { value: "shopping-bag", label: "Shopping bag" },
  { value: "gift", label: "Gift" },
  { value: "sparkles", label: "Sparkles" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "contacted", label: "Contacted" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function statusStyle(status: string): { bg: string; color: string } {
  switch (status) {
    case "pending":
      return { bg: "#fef3c7", color: "#92400e" };
    case "contacted":
      return { bg: "#dbeafe", color: "#1e40af" };
    case "completed":
      return { bg: "#d1fae5", color: "#065f46" };
    case "cancelled":
      return { bg: "#f3f4f6", color: "#4b5563" };
    default:
      return { bg: "#f3f4f6", color: "#374151" };
  }
}

type Props = {
  services: BoutiqueService[];
  requests: AdminServiceRequest[];
};

export default function ServicesAdminClient({ services, requests }: Props) {
  const [, startTransition] = useTransition();

  const [editing, setEditing] = useState<BoutiqueService | null>(null);
  const [creating, setCreating] = useState(false);
  const [reqExpanded, setReqExpanded] = useState<string | null>(null);
  const [confirmDeleteService, setConfirmDeleteService] = useState<string | null>(null);
  const [confirmDeleteRequest, setConfirmDeleteRequest] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [formState, formAction, formPending] = useActionState(
    async (_prev: FormResult, fd: FormData): Promise<FormResult> => {
      const result = await saveBoutiqueServiceAction(fd);
      if (result?.success) {
        setEditing(null);
        setCreating(false);
      }
      return result;
    },
    null,
  );

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (s: BoutiqueService) => {
    setCreating(false);
    setEditing(s);
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
  };

  const handleToggleActive = (s: BoutiqueService) => {
    setTogglingId(s.id);
    startTransition(async () => {
      await toggleBoutiqueServiceActiveAction(s.id, !s.active);
      setTogglingId(null);
    });
  };

  const handleDeleteService = (id: string) => {
    startTransition(async () => {
      await deleteBoutiqueServiceAction(id);
      setConfirmDeleteService(null);
    });
  };

  const handleDeleteRequest = (id: string) => {
    startTransition(async () => {
      await deleteServiceRequestAction(id);
      setConfirmDeleteRequest(null);
    });
  };

  const handleStatusChange = (requestId: string, status: string) => {
    startTransition(async () => {
      await updateServiceRequestStatusAction(requestId, status);
    });
  };

  return (
    <>
      <h2 className="admin-section-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <ClipboardList size={22} />
        Service requests
      </h2>
      <p className="admin-page-subtitle" style={{ marginTop: "-8px", marginBottom: "20px" }}>
        Submissions from the user dashboard. Reply by email and update the status as you go.
      </p>

      {requests.length === 0 ? (
        <div className="admin-empty" style={{ marginBottom: "48px" }}>
          <Mail size={48} />
          <p>No service requests yet.</p>
        </div>
      ) : (
        <div className="admin-table-wrap" style={{ marginBottom: "48px" }}>
          {requests.map((req) => {
            const st = statusStyle(req.status);
            return (
              <div key={req.id} className="admin-message-card">
                <div
                  className="admin-message-card__head"
                  onClick={() => setReqExpanded(reqExpanded === req.id ? null : req.id)}
                >
                  <div className="admin-message-card__meta">
                    <span className="admin-message-card__name">{req.customer_name}</span>
                    <span className="admin-message-card__email">{req.customer_email}</span>
                    <span className="admin-td-muted" style={{ fontSize: "0.8rem", display: "block", marginTop: "4px" }}>
                      {req.service_title}
                    </span>
                  </div>
                  <div
                    className="admin-message-card__actions"
                    style={{ alignItems: "center", gap: "10px", flexWrap: "wrap" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span
                      className="admin-badge"
                      style={{
                        background: st.bg,
                        color: st.color,
                        fontSize: "0.75rem",
                        textTransform: "capitalize",
                      }}
                    >
                      {req.status}
                    </span>
                    <select
                      className="admin-select-like"
                      value={req.status}
                      onChange={(e) => handleStatusChange(req.id, e.target.value)}
                      style={{
                        fontSize: "0.8rem",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        border: "1px solid var(--admin-border, #e5e7eb)",
                        background: "var(--admin-surface, #fff)",
                      }}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <span className="admin-td-muted" style={{ fontSize: "0.8rem" }}>
                      {new Date(req.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {confirmDeleteRequest === req.id ? (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button type="button" className="admin-btn admin-btn--danger" onClick={() => handleDeleteRequest(req.id)}>
                          Delete
                        </button>
                        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setConfirmDeleteRequest(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="admin-btn admin-btn--icon"
                        title="Delete"
                        onClick={() => setConfirmDeleteRequest(req.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    {reqExpanded === req.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {reqExpanded === req.id && (
                  <div className="admin-message-card__body">
                    <a href={`mailto:${req.customer_email}`} className="admin-reply-link">
                      Reply to {req.customer_email}
                    </a>
                    <p className="admin-message-card__text">{req.message}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <h2 className="admin-section-title">Service catalog</h2>
      <p className="admin-page-subtitle" style={{ marginTop: "-8px", marginBottom: "20px" }}>
        These entries power the Services page in the user dashboard. Inactive items are hidden from members.
      </p>

      <button type="button" className="admin-btn admin-btn--primary" onClick={openCreate} style={{ marginBottom: "24px" }}>
        <Plus size={18} style={{ marginRight: "8px", verticalAlign: "middle" }} />
        Add service
      </button>

      {(creating || editing) && (
        <div className="admin-form-card" style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 className="admin-section-title" style={{ margin: 0 }}>
              {editing ? "Edit service" : "New service"}
            </h2>
            <button type="button" className="admin-btn admin-btn--icon" onClick={closeForm}>
              <X size={18} />
            </button>
          </div>

          {formState?.error && (
            <div className="admin-alert admin-alert--error" style={{ marginBottom: "20px" }}>
              <AlertCircle size={18} style={{ marginRight: "8px", verticalAlign: "middle" }} />
              {formState.error}
            </div>
          )}

          <form action={formAction}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>URL slug</label>
                <input
                  type="text"
                  name="slug"
                  key={editing?.id ?? "new"}
                  defaultValue={editing?.slug ?? ""}
                  placeholder="e.g. custom-tailoring"
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Sort order</label>
                <input
                  type="number"
                  name="sort_order"
                  key={`so-${editing?.id ?? "new"}`}
                  defaultValue={editing?.sort_order ?? 0}
                />
              </div>
            </div>
            <div className="admin-form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                key={`t-${editing?.id ?? "new"}`}
                defaultValue={editing?.title ?? ""}
                required
              />
            </div>
            <div className="admin-form-group">
              <label>Description</label>
              <textarea
                name="description"
                rows={4}
                key={`d-${editing?.id ?? "new"}`}
                defaultValue={editing?.description ?? ""}
                required
              />
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Price label</label>
                <input
                  type="text"
                  name="price_label"
                  key={`p-${editing?.id ?? "new"}`}
                  defaultValue={editing?.price_label ?? ""}
                  placeholder="N$500 or From N$200"
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Duration label</label>
                <input
                  type="text"
                  name="duration_label"
                  key={`du-${editing?.id ?? "new"}`}
                  defaultValue={editing?.duration_label ?? ""}
                  placeholder="1 hour"
                  required
                />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Tag (optional)</label>
                <input
                  type="text"
                  name="tag"
                  key={`tag-${editing?.id ?? "new"}`}
                  defaultValue={editing?.tag ?? ""}
                  placeholder="Most Popular"
                />
              </div>
              <div className="admin-form-group">
                <label>Icon</label>
                <select name="icon_key" key={`i-${editing?.id ?? "new"}`} defaultValue={editing?.icon_key ?? "star"}>
                  {ICON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="admin-form-group" style={{ marginBottom: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="active"
                  value="true"
                  defaultChecked={editing ? editing.active : true}
                />
                Visible on the user dashboard
              </label>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" className="admin-btn admin-btn--ghost" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" className="admin-btn admin-btn--primary" disabled={formPending}>
                {formPending ? "Saving…" : "Save service"}
              </button>
            </div>
          </form>
        </div>
      )}

      {services.length === 0 && !creating ? (
        <div className="admin-empty">
          <p>No services in the catalog. Add one to get started.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Order</th>
                <th>Status</th>
                <th style={{ width: "140px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} style={{ opacity: s.active ? 1 : 0.55 }}>
                  <td>
                    <strong>{s.title}</strong>
                    {s.tag && (
                      <span className="admin-td-muted" style={{ display: "block", fontSize: "0.8rem" }}>
                        {s.tag}
                      </span>
                    )}
                  </td>
                  <td className="admin-td-muted">{s.slug}</td>
                  <td>{s.price_label}</td>
                  <td className="admin-td-muted">{s.duration_label}</td>
                  <td>{s.sort_order}</td>
                  <td>
                    <span className="admin-badge" style={{ fontSize: "0.75rem" }}>
                      {s.active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn--icon"
                        title={s.active ? "Hide from dashboard" : "Show on dashboard"}
                        disabled={togglingId === s.id}
                        onClick={() => handleToggleActive(s)}
                      >
                        {s.active ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button type="button" className="admin-btn admin-btn--icon" title="Edit" onClick={() => openEdit(s)}>
                        <Edit2 size={15} />
                      </button>
                      {confirmDeleteService === s.id ? (
                        <>
                          <button type="button" className="admin-btn admin-btn--danger" onClick={() => handleDeleteService(s.id)}>
                            Confirm
                          </button>
                          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setConfirmDeleteService(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="admin-btn admin-btn--icon"
                          title="Delete"
                          onClick={() => setConfirmDeleteService(s.id)}
                        >
                          <Trash2 size={15} />
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
    </>
  );
}
