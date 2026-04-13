"use client";

import { useActionState } from "react";
import { sendAdminEmailCampaignAction } from "@/lib/admin/actions";
import type { AdminEmailCampaign, AdminOrder } from "@/lib/admin/data";
import { Mail, Send, ReceiptText, TicketPercent, Megaphone, AlertCircle, CheckCircle2 } from "lucide-react";

type ActionState = { error?: string; success?: string } | null;

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
  currentUserId,
}: {
  campaigns: AdminEmailCampaign[];
  orders: AdminOrder[];
  currentUserId: string;
}) {
  const [state, action, pending] = useActionState(
    async (_prev: ActionState, fd: FormData): Promise<ActionState> => sendAdminEmailCampaignAction(fd),
    null,
  );

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
              <select name="kind" defaultValue="promotion" required>
                {KIND_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Audience</label>
              <select name="audience" defaultValue="all_users" required>
                {AUDIENCE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Subject</label>
              <input name="subject" required placeholder="e.g. Exclusive offer for RauVei Circle" />
            </div>
            <div className="admin-form-group">
              <label>Preview text (optional)</label>
              <input name="preview_text" placeholder="Snippet shown in inbox preview" />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Single recipient email (if audience = single)</label>
              <input name="recipient_email" type="email" placeholder="customer@example.com" />
            </div>
            <div className="admin-form-group">
              <label>Order (for invoice/order user)</label>
              <select name="order_id" defaultValue="">
                <option value="">Select order</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    #{order.id.slice(0, 8)} - {order.user_email ?? "unknown"} - N${Number(order.total_amount).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Coupon code (optional)</label>
              <input name="coupon_code" placeholder="RAUVEI20" />
            </div>
            <div className="admin-form-group">
              <label>CTA label / URL (optional)</label>
              <div className="admin-form-row" style={{ gap: "8px" }}>
                <input name="cta_label" placeholder="Shop now" />
                <input name="cta_url" placeholder="https://www.rauvei.com/collections/women" />
              </div>
            </div>
          </div>

          <div className="admin-form-group">
            <label>Message</label>
            <textarea
              name="message"
              rows={6}
              required
              placeholder="Write your campaign message. Use blank lines for paragraph breaks."
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
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-td-muted">No campaigns yet.</td>
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
