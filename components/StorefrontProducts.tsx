"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart, CheckCircle, AlertCircle, ShoppingCart, X } from "lucide-react";
import { addToCartAction } from "@/lib/dashboard/actions";
import type { Product } from "@/lib/data/products";
import { formatPrice } from "@/lib/data/products";

type Toast = { message: string; type: "success" | "error" | "info" };

export default function StorefrontProducts({ products }: { products: Product[] }) {
  const [addingId, setAddingId]   = useState<string | null>(null);
  const [toast, setToast]         = useState<Toast | null>(null);
  const [, startTransition]       = useTransition();

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3500);
  };

  const onAddToCart = (product: Product) => {
    setAddingId(product.id);
    const fd = new FormData();
    fd.append("product_id",       product.id);
    fd.append("product_name",     product.name);
    fd.append("product_image",    product.image_url);
    fd.append("product_category", product.category);
    fd.append("unit_price",       String(product.price));

    startTransition(async () => {
      const result = await addToCartAction(fd);
      setAddingId(null);

      if (result?.error) {
        if (result.error.toLowerCase().includes("sign in")) {
          showToast({ type: "info", message: "Please log in to save items to your cart." });
        } else {
          showToast({ type: "error", message: result.error });
        }
        return;
      }

      showToast({ type: "success", message: `${product.name} added to your cart!` });
      window.dispatchEvent(new CustomEvent("cart-updated"));
    });
  };

  if (products.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>
        New pieces arriving soon. Stay tuned for the next drop.
      </p>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`storefront-toast storefront-toast--${toast.type}`}>
          <span className="storefront-toast__icon">
            {toast.type === "success" && <CheckCircle size={18} />}
            {toast.type === "error"   && <AlertCircle size={18} />}
            {toast.type === "info"    && <ShoppingCart size={18} />}
          </span>
          <span>{toast.message}</span>
          {toast.type === "info" && (
            <Link href="/login" className="storefront-toast__link">Log in</Link>
          )}
          <button className="storefront-toast__close" onClick={() => setToast(null)} aria-label="Close">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="products-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-image">
              <img src={product.image_url} alt={product.alt_text || product.name} />
              <div className="product-overlay">
                <button className="btn-icon" type="button" aria-label="Add to favourites">
                  <Heart size={18} strokeWidth={1.5} />
                </button>
                <button
                  className="add-to-cart-btn btn btn-primary"
                  style={{ width: "100%" }}
                  type="button"
                  disabled={addingId === product.id}
                  onClick={() => onAddToCart(product)}
                >
                  {addingId === product.id ? "Adding…" : "Add to Cart"}
                </button>
              </div>
            </div>
            <div className="product-info">
              <h3 className="product-name">{product.name}</h3>
              <p className="product-category">{product.category}</p>
              <p className="product-price">{formatPrice(product.price)}</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
