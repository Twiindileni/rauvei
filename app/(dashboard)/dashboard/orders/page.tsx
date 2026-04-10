import Link from "next/link";
import { getOrders, formatCurrency } from "@/lib/dashboard/data";
import { Package, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:    { label: "Pending",    className: "dash-badge-yellow" },
  confirmed:  { label: "Confirmed",  className: "dash-badge-blue" },
  processing: { label: "Processing", className: "dash-badge-blue" },
  shipped:    { label: "Shipped",    className: "dash-badge-purple" },
  delivered:  { label: "Delivered",  className: "dash-badge-green" },
  cancelled:  { label: "Cancelled",  className: "dash-badge-red" },
  refunded:   { label: "Refunded",   className: "dash-badge-gray" },
};

export default async function OrdersPage() {
  const orders = await getOrders();

  if (orders.length === 0) {
    return (
      <div>
        <div className="dash-page-header">
          <h1 className="dash-page-title">My Orders</h1>
          <p className="dash-page-subtitle">Track and manage your purchases</p>
        </div>
        <div className="dash-empty-state">
          <Package size={56} style={{ color: "#ddd", marginBottom: "24px" }} />
          <h2>No orders yet</h2>
          <p>When you place an order it will appear here.</p>
          <Link href="/#shop" className="btn btn-primary" style={{ marginTop: "32px" }}>Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="dash-page-header">
        <h1 className="dash-page-title">My Orders</h1>
        <p className="dash-page-subtitle">{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>
      </div>

      <div className="dash-orders-list">
        {orders.map((order) => {
          const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, className: "dash-badge-gray" };
          return (
            <div key={order.id} className="dash-card dash-order-card">
              <div className="dash-order-header">
                <div>
                  <p className="dash-order-id">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="dash-order-date">
                    {new Date(order.created_at).toLocaleDateString("en-NA", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span className="dash-order-total">{formatCurrency(order.total_amount)}</span>
                  <span className={`dash-badge ${cfg.className}`}>{cfg.label}</span>
                </div>
              </div>

              {order.order_items.length > 0 && (
                <div className="dash-order-items">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="dash-order-item-row">
                      <div className="dash-order-item-img">
                        {item.product_image
                          ? <img src={item.product_image} alt={item.product_name} />
                          : <div className="dash-cart-img-placeholder" style={{ width: "100%", height: "100%" }}><ShoppingBag size={20} /></div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p className="dash-cart-name">{item.product_name}</p>
                        <p className="dash-cart-category">{item.product_category}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p className="dash-cart-unit-price">× {item.quantity}</p>
                        <p style={{ fontWeight: 600 }}>{formatCurrency(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {order.shipping_address && (
                <div className="dash-order-address">
                  <span className="dash-info-label">Ship to:</span>{" "}
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{order.shipping_address}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
