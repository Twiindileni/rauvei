"use client";

import { useActionState } from "react";
import { requestServiceAction } from "@/lib/dashboard/actions";
import { Scissors, Star, Ruler, ShoppingBag, Gift, Sparkles, CheckCircle, AlertCircle } from "lucide-react";

type ActionResult = { error?: string; success?: string } | null;

const SERVICES = [
  {
    id: "styling-consultation",
    icon: Star,
    title: "Personal Styling Consultation",
    description: "A one-on-one session with our style expert Rauna Amutenya. She will curate a personal wardrobe plan, recommend pieces from our collection, and help you define your signature look.",
    price: "N$500",
    duration: "1 hour",
    tag: "Most Popular",
  },
  {
    id: "custom-tailoring",
    icon: Ruler,
    title: "Custom Tailoring",
    description: "Have any LauVei garment tailored to your exact measurements for a perfect fit. Our master tailor ensures every seam, hem, and silhouette is crafted to your body.",
    price: "From N$200",
    duration: "3–5 days",
    tag: null,
  },
  {
    id: "alterations",
    icon: Scissors,
    title: "Alterations & Repairs",
    description: "Breathe new life into your wardrobe. We offer expert alterations — hemming, resizing, zipper replacements, and general repairs — on LauVei and non-LauVei garments.",
    price: "From N$100",
    duration: "1–3 days",
    tag: null,
  },
  {
    id: "personal-shopping",
    icon: ShoppingBag,
    title: "Personal Shopping",
    description: "Let our team shop on your behalf. Tell us your occasion, budget, and style preferences and we will curate a selection delivered directly to your door.",
    price: "N$300",
    duration: "Same day",
    tag: null,
  },
  {
    id: "gift-wrapping",
    icon: Gift,
    title: "Premium Gift Wrapping",
    description: "Elevate your gift with our luxury packaging service. Each item is hand-wrapped in signature LauVei tissue, sealed with a wax stamp, and presented in a branded gift box.",
    price: "N$150",
    duration: "Included at pickup",
    tag: null,
  },
  {
    id: "exclusive-preview",
    icon: Sparkles,
    title: "New Arrival Preview Access",
    description: "Be the first to see and reserve pieces from our upcoming collections. Exclusive members receive private preview invitations before items are listed publicly.",
    price: "Free for members",
    duration: "Seasonal",
    tag: "Members Only",
  },
];

export default function ServicesClient({ defaultName, defaultEmail }: { defaultName: string; defaultEmail: string }) {
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

      <div className="dash-services-grid">
        {SERVICES.map(({ id, icon: Icon, title, description, price, duration, tag }) => (
          <div key={id} className="dash-service-card">
            {tag && <span className="dash-service-tag">{tag}</span>}
            <div className="dash-service-icon"><Icon size={24} strokeWidth={1.5} /></div>
            <h3 className="dash-service-title">{title}</h3>
            <p className="dash-service-desc">{description}</p>
            <div className="dash-service-meta">
              <span className="dash-service-price">{price}</span>
              <span className="dash-service-duration">{duration}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-card" style={{ marginTop: "40px" }}>
        <div className="dash-card-header"><h2>Request a Service</h2></div>
        <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "0.9rem" }}>
          Fill in the form below and our team will contact you within 24 hours to confirm your booking.
        </p>

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
              <select name="service" required className="dash-select">
                <option value="">Select a service…</option>
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.title}>{s.title}</option>
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
      </div>
    </div>
  );
}
