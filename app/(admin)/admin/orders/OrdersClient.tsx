"use client";

import { useTransition, useState, useActionState } from "react";
import {
  updateOrderStatusAction,
  createDeliveryForOrderAction,
  saveDeliveryAction,
} from "@/lib/admin/actions";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import type { AdminOrder } from "@/lib/admin/data";

const STATUS_OPTIONS = [
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"
];

const STATUS_COLORS: Record<string, string> = {
  pending:    "#f59e0b",
  confirmed:  "#3b82f6",
  processing: "#8b5cf6",
  shipped:    "#06b6d4",
  delivered:  "#10b981",
  cancelled:  "#ef4444",
  refunded:   "#6b7280",
};

const DELIVERY_STATUS_OPTIONS: [string, string][] = [
  ["preparing", "Preparing"],
  ["dispatched", "Dispatched"],
  ["in_transit", "In transit"],
  ["out_for_delivery", "Out for delivery"],
  ["delivered", "Delivered"],
  ["failed", "Failed"],
  ["returned", "Returned"],
];

function OrderShipmentForm({ order }: { order: AdminOrder }) {
  const delivery = order.deliveries?.[0];
  const [createState, createAction, createPending] = useActionState(createDeliveryForOrderAction, null);
  const [saveState, saveAction, savePending] = useActionState(saveDeliveryAction, null);

  if (!delivery) {
    return (
      <div className="admin-shipment-panel">
        <p className="admin-label">Shipment tracking</p>
        <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "12px", lineHeight: 1.5 }}>
          No tracking record yet. Create one so the customer sees this order under Deliveries and you can share live map
          coordinates until they confirm receipt.
        </p>
        {createState?.error && (
          <p className="admin-alert admin-alert--error" style={{ marginBottom: "12px" }}>{createState.error}</p>
        )}
        <form action={createAction}>
          <input type="hidden" name="order_id" value={order.id} />
          <button type="submit" className="admin-btn admin-btn--primary" disabled={createPending}>
            {createPending ? "Creating…" : "Create shipment tracking"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-shipment-panel">
      <p className="admin-label">Shipment tracking</p>
      <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "16px", lineHeight: 1.5 }}>
        Use decimal latitude & longitude (WGS84). Leave both empty to clear the pin. The customer&apos;s map refreshes about
        every 25 seconds until the delivery is completed or they confirm receipt.
      </p>
      {saveState?.error && (
        <p className="admin-alert admin-alert--error" style={{ marginBottom: "12px" }}>{saveState.error}</p>
      )}
      <form action={saveAction} className="admin-shipment-form">
        <input type="hidden" name="delivery_id" value={delivery.id} />
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label>Delivery status</label>
            <select name="delivery_status" defaultValue={delivery.status} required>
              {DELIVERY_STATUS_OPTIONS.map(([v, lab]) => (
                <option key={v} value={v}>{lab}</option>
              ))}
            </select>
          </div>
          <div className="admin-form-group">
            <label>Estimated delivery date</label>
            <input
              type="date"
              name="estimated_delivery_date"
              defaultValue={delivery.estimated_delivery_date?.slice(0, 10) ?? ""}
            />
          </div>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label>Courier</label>
            <input type="text" name="courier" defaultValue={delivery.courier ?? ""} placeholder="e.g. City Express" />
          </div>
          <div className="admin-form-group">
            <label>Tracking number</label>
            <input type="text" name="tracking_number" defaultValue={delivery.tracking_number ?? ""} />
          </div>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label>Current latitude</label>
            <input
              type="text"
              name="current_latitude"
              placeholder="-22.5609"
              defaultValue={delivery.current_latitude != null ? String(delivery.current_latitude) : ""}
            />
          </div>
          <div className="admin-form-group">
            <label>Current longitude</label>
            <input
              type="text"
              name="current_longitude"
              placeholder="17.0658"
              defaultValue={delivery.current_longitude != null ? String(delivery.current_longitude) : ""}
            />
          </div>
        </div>
        <div className="admin-form-group">
          <label>Internal notes</label>
          <textarea name="delivery_notes" rows={2} defaultValue={delivery.notes ?? ""} />
        </div>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={savePending}>
          {savePending ? "Saving…" : "Save shipment updates"}
        </button>
      </form>
    </div>
  );
}

export default function OrdersClient({ orders }: { orders: AdminOrder[] }) {
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusChange = (orderId: string, status: string) => {
    setUpdating(orderId);
    startTransition(async () => {
      await updateOrderStatusAction(orderId, status);
      setUpdating(null);
    });
  };

  if (orders.length === 0) {
    return (
      <div className="admin-empty">
        <Package size={48} />
        <p>No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      {orders.map((order) => (
        <div key={order.id} className="admin-order-card">
          <div className="admin-order-card__head" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
            <div className="admin-order-card__meta">
              <span className="admin-order-card__id">#{order.id.slice(0, 8)}</span>
              <span className="admin-order-card__customer">
                {order.profiles?.full_name ?? order.user_email ?? "Unknown"}
              </span>
              <span className="admin-order-card__email">{order.user_email}</span>
            </div>
            <div className="admin-order-card__actions">
              <span className="admin-badge" style={{ background: `${STATUS_COLORS[order.status]}22`, color: STATUS_COLORS[order.status] }}>
                {order.status}
              </span>
              <span className="admin-order-card__total">N${Number(order.total_amount).toFixed(2)}</span>
              <span className="admin-order-card__date">{new Date(order.created_at).toLocaleDateString()}</span>
              <select
                className="admin-select"
                value={order.status}
                disabled={updating === order.id}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              {expanded === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {expanded === order.id && (
            <div className="admin-order-card__body" onClick={(e) => e.stopPropagation()}>
              <div className="admin-order-card__info-row">
                <div>
                  <p className="admin-label">Shipping Address</p>
                  <p>{order.shipping_address ?? "—"}</p>
                </div>
                {order.notes && (
                  <div>
                    <p className="admin-label">Notes</p>
                    <p>{order.notes}</p>
                  </div>
                )}
                {order.profiles?.phone && (
                  <div>
                    <p className="admin-label">Phone</p>
                    <p>{order.profiles.phone}</p>
                  </div>
                )}
              </div>
              <table className="admin-inner-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.order_items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>N${Number(item.unit_price).toFixed(2)}</td>
                      <td>N${(item.quantity * Number(item.unit_price)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <OrderShipmentForm order={order} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
