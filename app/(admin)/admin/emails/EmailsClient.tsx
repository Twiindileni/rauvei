"use client";

import { useActionState, useState, useTransition } from "react";
import { sendAdminEmailCampaignAction, deleteEmailCampaignAction } from "@/lib/admin/actions";
import type { AdminCoupon, AdminEmailCampaign, AdminOrder } from "@/lib/admin/data";
import { Mail, Send, ReceiptText, TicketPercent, Megaphone, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";

type ActionState = { error?: string; success?: string } | null;
type KindValue = "promotion" | "coupon" | "invoice" | "announcement";
type Preset = { id: string; label: string; subject: string; preview: string; message: string };

const KIND_OPTIONS = [
  { value: "promotion", label: "Promotion", icon: Megaphone },
  { value: "coupon", label: "Coupon", icon: TicketPercent },
  { value: "invoice", label: "Invoice", icon: ReceiptText },
  { value: "announcement", label: "Announcement", icon: Mail },
] as const;

const AUDIENCE_OPTIONS = [
  { value: "all_users", label: "All users" },
  { value: "single", label: "Single email" },
  { value: "order_user", label: "Customer from order" },
] as const;

const MESSAGE_PRESETS: Record<KindValue, Preset[]> = {
  promotion: [
    {
      id: "promo-early-access",
      label: "Early access drop",
      subject: "Early Access: New RauVei Collection",
      preview: "Shop our latest pieces before public release.",
      message:
        "You are invited to early access for our latest RauVei collection.\n\nFor the next 48 hours, you can shop selected new arrivals before they are released publicly.\n\nStock is limited, so we recommend placing your order as soon as possible.",
    },
    {
      id: "promo-weekend-edit",
      label: "Weekend style edit",
      subject: "Weekend Style Edit Is Live",
      preview: "Fresh curated looks for your weekend plans.",
      message:
        "Our weekend style edit is now live.\n\nWe selected standout pieces designed for effortless elegance across day and evening looks.\n\nTap below to explore and secure your favorites.",
    },
  ],
  coupon: [
    {
      id: "coupon-thank-you",
      label: "Thank-you reward",
      subject: "A Private Thank-You Offer for You",
      preview: "Your saved coupon is ready to use at checkout.",
      message:
        "As a thank-you for supporting RauVei, we are sharing an exclusive coupon with you.\n\nUse the code shown in this email during checkout to unlock your discount.\n\nPlease redeem before it expires.",
    },
    {
      id: "coupon-member",
      label: "Member exclusive",
      subject: "Member Exclusive Coupon Inside",
      preview: "Enjoy your private member discount on selected pieces.",
      message:
        "This is your member-exclusive coupon for a limited period.\n\nApply it at checkout on eligible products and enjoy your private discount.\n\nIf you need help choosing sizes or styles, reply to this email and we will assist.",
    },
  ],
  invoice: [
    {
      id: "invoice-standard",
      label: "Standard invoice note",
      subject: "Your RauVei Invoice",
      preview: "Invoice and order summary for your records.",
      message:
        "Thank you for your order.\n\nYour invoice is provided below with your itemized order summary and total amount.\n\nPlease keep this email for your records, and contact us if you need any billing adjustments.",
    },
    {
      id: "invoice-payment-reminder",
      label: "Payment reminder",
      subject: "Invoice Payment Reminder",
      preview: "Friendly reminder for your outstanding invoice.",
      message:
        "This is a friendly reminder regarding your invoice.\n\nPlease review the details below and complete payment by the due date.\n\nIf payment has already been made, please disregard this notice.",
    },
  ],
  announcement: [
    {
      id: "announce-hours",
      label: "Store hours update",
      subject: "Important Update: Store & Support Hours",
      preview: "Updated operating hours for this week.",
      message:
        "We are sharing an update to our store and support operating hours.\n\nPlease review the latest schedule before placing new service or delivery requests.\n\nThank you for your understanding and continued support.",
    },
    {
      id: "announce-delivery",
      label: "Delivery timeline update",
      subject: "Delivery Timeline Update",
      preview: "Service and shipping timelines have been updated.",
      message:
        "We have updated delivery timelines due to current shipment volumes.\n\nExisting orders remain active and our team is working to keep delays minimal.\n\nYou can continue tracking your orders in your dashboard.",
    },
  ],
};

function badgeColor(status: string): { bg: string; fg: string } {
  switch (status) {
    case "sent":
      return { bg: "#d1fae5", fg: "#065f46" };
    case "failed":
      return { bg: "#fee2e2", fg: "#991b1b" };
    default:
      return { bg: "#f3f4f6", fg: "#374151" };
  }
}

export default function EmailsClient({
  campaigns,
  orders,
  coupons,
  currentUserId,
}: {
  campaigns: AdminEmailCampaign[];
  orders: AdminOrder[];
  coupons: AdminCoupon[];
  currentUserId: string;
}) {
  const [, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<string>("promotion");
  const [selectedAudience, setSelectedAudience] = useState<string>("all_users");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [message, setMessage] = useState("");
  const [state, action, pending] = useActionState(
    async (_prev: ActionState, fd: FormData): Promise<ActionState> => sendAdminEmailCampaignAction(fd),
    null,
  );

  const presetOptions = MESSAGE_PRESETS[selectedKind as KindValue] ?? [];

  const applyPreset = () => {
    if (!selectedPresetId) return;
    const preset = presetOptions.find((p) => p.id === selectedPresetId);
    if (!preset) return;
    setSubject(preset.subject);
    setPreviewText(preset.preview);
    setMessage(preset.message);
  };

  return (
    <>
      <div className="admin-form-card" style={{ marginBottom: "26px" }}>
        <h2 className="admin-section-title" style={{ marginBottom: "8px" }}>Compose Campaign</h2>
        <p className="admin-page-subtitle" style={{ marginBottom: "22px" }}>
          Uses the connected Resend account. Set `RESEND_API_KEY` and `ADMIN_FROM_EMAIL` in env.
        </p>

        {state?.error && (
          <div className="admin-alert admin-alert--error" style={{ marginBottom: "16px" }}>
            <AlertCircle size={16} style={{ marginRight: "8px", verticalAlign: "middle" }} />
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="admin-alert admin-alert--success" style={{ marginBottom: "16px" }}>
            <CheckCircle2 size={16} style={{ marginRight: "8px", verticalAlign: "middle" }} />
            {state.success}
          </div>
        )}

        <form action={action} className="admin-email-form">
          <input type="hidden" name="created_by" value={currentUserId} />

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Email type</label>
              <select
                name="kind"
                value={selectedKind}
                onChange={(e) => {
                  setSelectedKind(e.target.value);
                  setSelectedPresetId("");
                }}
                required
              >
                {KIND_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Audience</label>
              <select
                name="audience"
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                required
              >
                {AUDIENCE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Subject</label>
              <input
                name="subject"
                required
                placeholder="e.g. Exclusive offer for RauVei Circle"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="admin-form-group">
              <label>Preview text (optional)</label>
              <input
                name="preview_text"
                placeholder="Snippet shown in inbox preview"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Quick message presets</label>
              <div className="admin-form-row" style={{ gap: "8px" }}>
                <select
                  value={selectedPresetId}
                  onChange={(e) => setSelectedPresetId(e.target.value)}
                >
                  <option value="">Choose preset (optional)</option>
                  {presetOptions.map((preset) => (
                    <option key={preset.id} value={preset.id}>{preset.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={applyPreset}
                  disabled={!selectedPresetId}
                >
                  Use preset
                </button>
              </div>
              <span className="admin-td-muted" style={{ display: "block", marginTop: "6px", fontSize: "0.78rem" }}>
                Presets auto-fill subject, preview, and message. You can edit everything after loading.
              </span>
            </div>
          </div>

          {(selectedAudience === "single" || selectedKind === "invoice" || selectedAudience === "order_user") && (
            <div className="admin-form-row">
              {selectedAudience === "single" ? (
                <div className="admin-form-group">
                  <label>Recipient email</label>
                  <input
                    name="recipient_email"
                    type="email"
                    placeholder="customer@example.com"
                    required={selectedAudience === "single"}
                  />
                </div>
              ) : (
                <div className="admin-form-group">
                  <label>Recipient email</label>
                  <input
                    name="recipient_email"
                    type="email"
                    placeholder="customer@example.com"
                    disabled
                  />
                </div>
              )}
              {(selectedKind === "invoice" || selectedAudience === "order_user") && (
                <div className="admin-form-group">
                  <label>Order</label>
                  <select
                    name="order_id"
                    defaultValue=""
                    required={selectedKind === "invoice" || selectedAudience === "order_user"}
                  >
                    <option value="">Select order</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        #{order.id.slice(0, 8)} - {order.user_email ?? "unknown"} - N${Number(order.total_amount).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {selectedKind === "coupon" && (
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Select coupon</label>
                <select name="coupon_id" defaultValue="" required={selectedKind === "coupon"}>
                  <option value="">Choose saved coupon</option>
                  {coupons.map((coupon) => (
                    <option key={coupon.id} value={coupon.id}>
                      {coupon.code} · {coupon.discount_type === "percent"
                        ? `${Number(coupon.discount_value).toFixed(0)}%`
                        : `N$${Number(coupon.discount_value).toFixed(2)}`}
                      {coupon.expires_at ? ` · expires ${new Date(coupon.expires_at).toLocaleDateString("en-GB")}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {selectedKind !== "invoice" && (
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>CTA label / URL (optional)</label>
                <div className="admin-form-row" style={{ gap: "8px" }}>
                  <input name="cta_label" placeholder="Shop now" />
                  <input name="cta_url" placeholder="https://www.rauvei.com/collections/women" />
                </div>
              </div>
            </div>
          )}

          {selectedKind === "invoice" && (
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Invoice due date (optional)</label>
                <input name="invoice_due_at" type="date" />
              </div>
              <div className="admin-form-group">
                <label>Payment CTA (optional)</label>
                <div className="admin-form-row" style={{ gap: "8px" }}>
                  <input name="cta_label" placeholder="Pay now" />
                  <input name="cta_url" placeholder="https://www.rauvei.com/dashboard/orders" />
                </div>
              </div>
            </div>
          )}

          <div className="admin-form-group">
            <label>Message</label>
            <textarea
              name="message"
              rows={6}
              required
              placeholder="Write your campaign message. Use blank lines for paragraph breaks."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button type="submit" className="admin-btn admin-btn--primary" disabled={pending}>
            <Send size={15} style={{ marginRight: "8px", verticalAlign: "middle" }} />
            {pending ? "Sending..." : "Send campaign"}
          </button>
        </form>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Subject</th>
              <th>Audience</th>
              <th>Result</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-td-muted">No campaigns yet.</td>
              </tr>
            ) : (
              campaigns.map((campaign) => {
                const tone = badgeColor(campaign.status);
                const Icon = KIND_OPTIONS.find((k) => k.value === campaign.kind)?.icon ?? Mail;
                return (
                  <tr key={campaign.id}>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Icon size={14} />
                        {campaign.kind}
                      </span>
                    </td>
                    <td>
                      <strong>{campaign.subject}</strong>
                      {campaign.preview_text && (
                        <span className="admin-td-muted" style={{ display: "block", marginTop: "2px" }}>
                          {campaign.preview_text}
                        </span>
                      )}
                      {campaign.metadata?.coupon_code && (
                        <span className="admin-td-muted" style={{ display: "block", marginTop: "2px" }}>
                          Coupon: {campaign.metadata.coupon_code}
                        </span>
                      )}
                      {campaign.metadata?.invoice_number && (
                        <span className="admin-td-muted" style={{ display: "block", marginTop: "2px" }}>
                          Invoice: {campaign.metadata.invoice_number}
                        </span>
                      )}
                    </td>
                    <td className="admin-td-muted">{campaign.audience}</td>
                    <td>
                      <span className="admin-badge" style={{ background: tone.bg, color: tone.fg }}>
                        {campaign.status}
                      </span>
                      <span className="admin-td-muted" style={{ display: "block", marginTop: "4px" }}>
                        {campaign.sent_count} sent · {campaign.failed_count} failed
                      </span>
                    </td>
                    <td className="admin-td-muted">
                      {new Date(campaign.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      {confirmDelete === campaign.id ? (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            className="admin-btn admin-btn--danger"
                            onClick={() =>
                              startTransition(async () => {
                                await deleteEmailCampaignAction(campaign.id);
                                setConfirmDelete(null);
                              })
                            }
                          >
                            Confirm
                          </button>
                          <button className="admin-btn admin-btn--ghost" onClick={() => setConfirmDelete(null)}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="admin-btn admin-btn--icon"
                          title="Delete campaign"
                          onClick={() => setConfirmDelete(campaign.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
