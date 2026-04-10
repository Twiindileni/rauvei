import Link from "next/link";
import { getDeliveries, formatCurrency } from "@/lib/dashboard/data";
import { Truck, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

const DELIVERY_STEPS = [
  { key: "preparing",        label: "Preparing" },
  { key: "dispatched",       label: "Dispatched" },
  { key: "in_transit",       label: "In Transit" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered",        label: "Delivered" },
];

const STATUS_LABELS: Record<string, string> = {
  preparing: "Preparing", dispatched: "Dispatched", in_transit: "In Transit",
  out_for_delivery: "Out for Delivery", delivered: "Delivered",
  failed: "Delivery Failed", returned: "Returned",
};

export default async function DeliveriesPage() {
  const deliveries = await getDeliveries();

  if (deliveries.length === 0) {
    return (
      <div>
        <div className="dash-page-header">
          <h1 className="dash-page-title">Deliveries</h1>
          <p className="dash-page-subtitle">Track your shipments in real-time</p>
        </div>
        <div className="dash-empty-state">
          <Truck size={56} style={{ color: "#ddd", marginBottom: "24px" }} />
          <h2>No deliveries yet</h2>
          <p>Once your orders are dispatched, you can track them here.</p>
          <Link href="/dashboard/orders" className="btn btn-primary" style={{ marginTop: "32px" }}>View My Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="dash-page-header">
        <h1 className="dash-page-title">Deliveries</h1>
        <p className="dash-page-subtitle">Track your shipments in real-time</p>
      </div>

      <div className="dash-orders-list">
        {deliveries.map((delivery) => {
          const stepIndex = DELIVERY_STEPS.findIndex((s) => s.key === delivery.status);
          const isFailed = delivery.status === "failed" || delivery.status === "returned";

          return (
            <div key={delivery.id} className="dash-card">
              <div className="dash-order-header">
                <div>
                  <p className="dash-order-id">
                    {delivery.tracking_number ? `Tracking: ${delivery.tracking_number}` : `Delivery #${delivery.id.slice(0, 8).toUpperCase()}`}
                  </p>
                  <p className="dash-order-date">
                    Ordered {delivery.orders?.created_at
                      ? new Date(delivery.orders.created_at).toLocaleDateString("en-NA", { day: "numeric", month: "long", year: "numeric" })
                      : "—"}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {delivery.orders?.total_amount && (
                    <span className="dash-order-total">{formatCurrency(delivery.orders.total_amount)}</span>
                  )}
                  <span className={`dash-badge ${delivery.status === "delivered" ? "dash-badge-green" : isFailed ? "dash-badge-red" : "dash-badge-blue"}`}>
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
                              <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

              <div className="dash-delivery-details">
                <div className="dash-info-row">
                  <span className="dash-info-label"><MapPin size={14} /> Shipping to</span>
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
                      {new Date(delivery.estimated_delivery_date).toLocaleDateString("en-NA", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                  </div>
                )}
                {delivery.delivered_at && (
                  <div className="dash-info-row">
                    <span className="dash-info-label">Delivered</span>
                    <span className="dash-badge dash-badge-green">
                      {new Date(delivery.delivered_at).toLocaleDateString("en-NA", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
