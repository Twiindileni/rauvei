"use client";

import { useTransition, useState } from "react";
import { updateOrderStatusAction } from "@/lib/admin/actions";
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
            <div className="admin-order-card__body">
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
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
