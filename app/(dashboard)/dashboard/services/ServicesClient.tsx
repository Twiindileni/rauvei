"use client";

import { useActionState } from "react";
import { requestServiceAction } from "@/lib/dashboard/actions";
import {
  Scissors,
  Star,
  Ruler,
  ShoppingBag,
  Gift,
  Sparkles,
  CheckCircle,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import type { BoutiqueService } from "@/lib/data/boutiqueServices";

type ActionResult = { error?: string; success?: string } | null;

const ICONS: Record<string, LucideIcon> = {
  star: Star,
  ruler: Ruler,
  scissors: Scissors,
  "shopping-bag": ShoppingBag,
  gift: Gift,
  sparkles: Sparkles,
};

function serviceIcon(key: string): LucideIcon {
  return ICONS[key] ?? Star;
}

export default function ServicesClient({
  services,
  defaultName,
  defaultEmail,
}: {
  services: BoutiqueService[];
  defaultName: string;
  defaultEmail: string;
}) {
  const [state, dispatch, pending] = useActionState(
    async (_prev: ActionResult, fd: FormData): Promise<ActionResult> => requestServiceAction(fd),
    null,
  );

  return (
    <div>
      <div className="dash-page-header">
        <h1 className="dash-page-title">Boutique Services</h1>
        <p className="dash-page-subtitle">Exclusive services crafted for the LauVei Circle</p>
      </div>

      {services.length === 0 ? (
        <div className="dash-card">
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            No services are listed at the moment. Please check back soon.
          </p>
        </div>
      ) : (
        <div className="dash-services-grid">
          {services.map(({ id, icon_key: iconKey, title, description, price_label, duration_label, tag }) => {
            const Icon = serviceIcon(iconKey);
            return (
              <div key={id} className="dash-service-card">
                {tag && <span className="dash-service-tag">{tag}</span>}
                <div className="dash-service-icon">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="dash-service-title">{title}</h3>
                <p className="dash-service-desc">{description}</p>
                <div className="dash-service-meta">
                  <span className="dash-service-price">{price_label}</span>
                  <span className="dash-service-duration">{duration_label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="dash-card" style={{ marginTop: "40px" }}>
        <div className="dash-card-header">
          <h2>Request a Service</h2>
        </div>
        <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "0.9rem" }}>
          Fill in the form below and our team will contact you within 24 hours to confirm your booking.
        </p>

        {services.length === 0 ? (
          <p style={{ color: "var(--text-muted)", margin: 0 }}>There are no services to request right now.</p>
        ) : (
          <>
            {state?.success && (
              <div className="dash-alert dash-alert-success" style={{ marginBottom: "24px" }}>
                <CheckCircle size={18} /> {state.success}
              </div>
            )}
            {state?.error && (
              <div className="dash-alert dash-alert-error" style={{ marginBottom: "24px" }}>
                <AlertCircle size={18} /> {state.error}
              </div>
            )}

            <form action={dispatch}>
              <div className="dash-form-grid">
                <div className="dash-form-group">
                  <label>Your Name</label>
                  <input type="text" name="name" defaultValue={defaultName} required />
                </div>
                <div className="dash-form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" defaultValue={defaultEmail} required />
                </div>
                <div className="dash-form-group dash-span-2">
                  <label>Service Requested</label>
                  <select name="service_id" required className="dash-select">
                    <option value="">Select a service…</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="dash-form-group dash-span-2">
                  <label>Message / Preferences</label>
                  <textarea
                    name="message"
                    rows={4}
                    placeholder="Tell us about your preferences, occasion, or any special requirements…"
                    required
                    style={{ resize: "vertical" }}
                  />
                </div>
              </div>
              <div className="dash-form-actions">
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? "Sending Request…" : "Submit Service Request"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
