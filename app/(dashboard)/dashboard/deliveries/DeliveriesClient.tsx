"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { confirmDeliveryReceivedAction } from "@/lib/dashboard/actions";
import type { Delivery } from "@/lib/dashboard/types";
import { formatCurrency } from "@/lib/dashboard/types";
import { Truck, MapPin, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";

// Labels align with admin order stages: Pending/Confirmed/Processing → Processing; Shipped → Shipped; etc.
const DELIVERY_STEPS = [
  { key: "preparing", label: "Processing" },
  { key: "dispatched", label: "Shipped" },
  { key: "in_transit", label: "On the way" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

const STATUS_LABELS: Record<string, string> = {
  preparing: "Processing",
  dispatched: "Shipped",
  in_transit: "On the way",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  failed: "Delivery failed",
  returned: "Returned",
};

function toNum(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function isTerminal(d: Delivery): boolean {
  return d.status === "delivered" || d.status === "failed" || d.status === "returned";
}

function canCustomerConfirm(d: Delivery): boolean {
  if (d.status === "delivered" && d.delivered_at) return false;
  return ["dispatched", "in_transit", "out_for_delivery"].includes(d.status);
}

function OsmMap({ lat, lng }: { lat: number; lng: number }) {
  const pad = 0.018;
  const bbox = `${lng - pad},${lat - pad},${lng + pad},${lat + pad}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;
  const openHref = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

  return (
    <div className="dash-delivery-map-block">
      <iframe title="Current delivery location" src={src} className="dash-delivery-map-frame" loading="lazy" />
      <a href={openHref} target="_blank" rel="noopener noreferrer" className="dash-delivery-map-link">
        <ExternalLink size={14} /> Open full map
      </a>
    </div>
  );
}

function DeliveryAutoRefresh({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => router.refresh(), 25000);
    return () => clearInterval(t);
  }, [enabled, router]);
  return null;
}

function ConfirmForm({ deliveryId }: { deliveryId: string }) {
  const [state, action, pending] = useActionState(confirmDeliveryReceivedAction, null);

  return (
    <form action={action} className="dash-delivery-confirm">
      <input type="hidden" name="delivery_id" value={deliveryId} />
      {state?.error && (
        <p className="dash-alert dash-alert-error" style={{ marginBottom: "12px" }}>
          <AlertCircle size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} />
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="dash-alert dash-alert-success" style={{ marginBottom: "12px" }}>
          <CheckCircle size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} />
          {state.success}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Confirming…" : "I have received my package"}
      </button>
      <p className="dash-delivery-confirm-hint">Tap this once your order has arrived. Live tracking will stop after you confirm.</p>
    </form>
  );
}

export default function DeliveriesClient({ deliveries }: { deliveries: Delivery[] }) {
  const liveRefresh = deliveries.some((d) => {
    if (isTerminal(d)) return false;
    const lat = toNum(d.current_latitude);
    const lng = toNum(d.current_longitude);
    return lat !== null && lng !== null;
  });

  return (
    <>
      <DeliveryAutoRefresh enabled={liveRefresh} />
      <div className="dash-orders-list">
        {deliveries.map((delivery) => {
          const stepIndex = DELIVERY_STEPS.findIndex((s) => s.key === delivery.status);
          const isFailed = delivery.status === "failed" || delivery.status === "returned";
          const lat = toNum(delivery.current_latitude);
          const lng = toNum(delivery.current_longitude);
          const showMap = !isTerminal(delivery) && lat !== null && lng !== null;
          const showConfirm = canCustomerConfirm(delivery);

          return (
            <div key={delivery.id} className="dash-card">
              <div className="dash-order-header">
                <div>
                  <p className="dash-order-id">
                    {delivery.tracking_number
                      ? `Tracking: ${delivery.tracking_number}`
                      : `Delivery #${delivery.id.slice(0, 8).toUpperCase()}`}
                  </p>
                  <p className="dash-order-date">
                    Ordered{" "}
                    {delivery.orders?.created_at
                      ? new Date(delivery.orders.created_at).toLocaleDateString("en-NA", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {delivery.orders?.total_amount != null && (
                    <span className="dash-order-total">
                      {formatCurrency(Number(delivery.orders.total_amount))}
                    </span>
                  )}
                  <span
                    className={`dash-badge ${
                      delivery.status === "delivered"
                        ? "dash-badge-green"
                        : isFailed
                          ? "dash-badge-red"
                          : "dash-badge-blue"
                    }`}
                  >
                    {STATUS_LABELS[delivery.status] ?? delivery.status}
                  </span>
                </div>
              </div>

              {!isFailed && (
                <div className="dash-timeline">
                  {DELIVERY_STEPS.map((step, idx) => {
                    const isDone = idx <= stepIndex;
                    const isCurrent = idx === stepIndex;
                    return (
                      <div key={step.key} className="dash-timeline-step">
                        <div className={`dash-timeline-dot ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`}>
                          {isDone && idx < stepIndex && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path
                                d="M2 6l3 3 5-5"
                                stroke="#fff"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        {idx < DELIVERY_STEPS.length - 1 && (
                          <div className={`dash-timeline-line ${idx < stepIndex ? "done" : ""}`} />
                        )}
                        <p className={`dash-timeline-label ${isCurrent ? "current" : ""}`}>{step.label}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {showMap && (
                <div className="dash-delivery-live" style={{ marginTop: "20px" }}>
                  <p className="dash-delivery-live-title">
                    <MapPin size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                    Current location
                    {delivery.location_updated_at && (
                      <span className="dash-delivery-live-updated">
                        Updated{" "}
                        {new Date(delivery.location_updated_at).toLocaleString("en-NA", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </p>
                  <OsmMap lat={lat!} lng={lng!} />
                </div>
              )}

              <div className="dash-delivery-details">
                <div className="dash-info-row">
                  <span className="dash-info-label">
                    <MapPin size={14} /> Shipping to
                  </span>
                  <span className="dash-info-value">{delivery.shipping_address}</span>
                </div>
                {delivery.courier && (
                  <div className="dash-info-row">
                    <span className="dash-info-label">Courier</span>
                    <span className="dash-info-value">{delivery.courier}</span>
                  </div>
                )}
                {delivery.estimated_delivery_date && (
                  <div className="dash-info-row">
                    <span className="dash-info-label">Est. Delivery</span>
                    <span className="dash-info-value">
                      {new Date(delivery.estimated_delivery_date).toLocaleDateString("en-NA", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </div>
                )}
                {delivery.delivered_at && (
                  <div className="dash-info-row">
                    <span className="dash-info-label">Delivered</span>
                    <span className="dash-badge dash-badge-green">
                      {new Date(delivery.delivered_at).toLocaleDateString("en-NA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {showConfirm && (
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-subtle, #eee)" }}>
                  <ConfirmForm deliveryId={delivery.id} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export function DeliveriesEmpty() {
  return (
    <div className="dash-empty-state">
      <Truck size={56} style={{ color: "#ddd", marginBottom: "24px" }} />
      <h2>No deliveries yet</h2>
      <p>Once your orders are dispatched, you can track them here.</p>
      <Link href="/dashboard/orders" className="btn btn-primary" style={{ marginTop: "32px" }}>
        View My Orders
      </Link>
    </div>
  );
}
