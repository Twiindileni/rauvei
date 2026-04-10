"use client";

import { useTransition, useActionState } from "react";
import Link from "next/link";
import { cartTotal, formatCurrency, type CartItem } from "@/lib/dashboard/types";
import { updateCartQuantityAction, removeCartItemAction, checkoutAction } from "@/lib/dashboard/actions";
import {
  ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShoppingCart, AlertCircle, CheckCircle,
} from "lucide-react";

type CheckoutResult = { error?: string; success?: string; orderId?: string } | null;

export default function CartClient({ items: initialItems }: { items: CartItem[] }) {
  const [, startTransition] = useTransition();
  const [checkoutState, checkoutDispatch, checkoutPending] = useActionState(
    async (_prev: CheckoutResult, fd: FormData): Promise<CheckoutResult> => checkoutAction(fd),
    null,
  );

  const total = cartTotal(initialItems);

  const handleQty = (itemId: string, delta: number) => {
    startTransition(async () => { await updateCartQuantityAction(itemId, delta); });
  };

  const handleRemove = (itemId: string) => {
    startTransition(async () => { await removeCartItemAction(itemId); });
  };

  if (checkoutState?.success) {
    return (
      <div className="dash-empty-state">
        <CheckCircle size={56} style={{ color: "var(--primary)", marginBottom: "24px" }} />
        <h2>{checkoutState.success}</h2>
        <p>Your order has been placed and is being processed.</p>
        <div style={{ display: "flex", gap: "16px", marginTop: "32px", justifyContent: "center" }}>
          <Link href="/dashboard/orders" className="btn btn-primary">View My Orders</Link>
          <Link href="/#shop" className="btn btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="dash-page-header">
        <h1 className="dash-page-title">My Cart</h1>
        <p className="dash-page-subtitle">
          {initialItems.length} {initialItems.length === 1 ? "item" : "items"} in your cart
        </p>
      </div>

      {checkoutState?.error && (
        <div className="dash-alert dash-alert-error">
          <AlertCircle size={18} /> {checkoutState.error}
        </div>
      )}

      {initialItems.length === 0 ? (
        <div className="dash-empty-state">
          <ShoppingCart size={56} style={{ color: "#ddd", marginBottom: "24px" }} />
          <h2>Your cart is empty</h2>
          <p>Discover our latest collections and add items you love.</p>
          <Link href="/#shop" className="btn btn-primary" style={{ marginTop: "32px" }}>Browse Collection</Link>
        </div>
      ) : (
        <div className="dash-cart-layout">
          <div className="dash-cart-items">
            {initialItems.map((item) => (
              <div key={item.id} className="dash-cart-row">
                <div className="dash-cart-img-wrap">
                  {item.product_image
                    ? <img src={item.product_image} alt={item.product_name} />
                    : <div className="dash-cart-img-placeholder"><ShoppingBag size={24} /></div>}
                </div>
                <div className="dash-cart-details">
                  <p className="dash-cart-name">{item.product_name}</p>
                  <p className="dash-cart-category">{item.product_category}</p>
                  <p className="dash-cart-unit-price">{formatCurrency(item.unit_price)} each</p>
                </div>
                <div className="dash-cart-qty">
                  <button type="button" className="dash-qty-btn" onClick={() => handleQty(item.id, -1)} aria-label="Decrease">
                    <Minus size={14} />
                  </button>
                  <span className="dash-qty-val">{item.quantity}</span>
                  <button type="button" className="dash-qty-btn" onClick={() => handleQty(item.id, 1)} aria-label="Increase">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="dash-cart-subtotal">{formatCurrency(item.quantity * item.unit_price)}</div>
                <button type="button" className="dash-cart-remove" onClick={() => handleRemove(item.id)} aria-label="Remove">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="dash-cart-summary">
            <div className="dash-card">
              <div className="dash-card-header"><h2>Order Summary</h2></div>
              <div className="dash-summary-rows">
                {initialItems.map((item) => (
                  <div className="dash-summary-row" key={item.id}>
                    <span>{item.product_name} × {item.quantity}</span>
                    <span>{formatCurrency(item.quantity * item.unit_price)}</span>
                  </div>
                ))}
                <div className="dash-summary-divider" />
                <div className="dash-summary-row dash-summary-total">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              <form action={checkoutDispatch} style={{ marginTop: "24px" }}>
                <div className="dash-form-group" style={{ marginBottom: "16px" }}>
                  <label>Shipping Address</label>
                  <textarea name="shipping_address" placeholder="Enter your delivery address" rows={3} required style={{ resize: "vertical" }} />
                </div>
                <div className="dash-form-group" style={{ marginBottom: "24px" }}>
                  <label>Order Notes (optional)</label>
                  <input type="text" name="notes" placeholder="Any special instructions?" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={checkoutPending} style={{ width: "100%" }}>
                  {checkoutPending ? "Placing Order…" : (
                    <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                      Place Order <ArrowRight size={16} />
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
