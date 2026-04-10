"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, CheckCircle, AlertCircle, ShoppingCart, X } from "lucide-react";
import { addToCartAction } from "@/lib/dashboard/actions";
import { toggleProductLikeAction } from "@/lib/storefront/actions";
import type { Product } from "@/lib/data/productModel";
import { formatPrice } from "@/lib/data/productModel";

type Toast = { message: string; type: "success" | "error" | "info" };

type Props = {
  products: Product[];
  /** IDs the signed-in user has already liked */
  likedProductIds?: string[];
};

export default function StorefrontProducts({ products, likedProductIds = [] }: Props) {
  const router = useRouter();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [likeBusyId, setLikeBusyId] = useState<string | null>(null);
  const [likedSet, setLikedSet] = useState(() => new Set(likedProductIds));
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(products.map((p) => [p.id, p.likes_count ?? 0])),
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    setLikedSet(new Set(likedProductIds));
    setCounts(Object.fromEntries(products.map((p) => [p.id, p.likes_count ?? 0])));
  }, [products, likedProductIds]);

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3500);
  };

  const onAddToCart = (product: Product) => {
    setAddingId(product.id);
    const fd = new FormData();
    fd.append("product_id", product.id);
    fd.append("product_name", product.name);
    fd.append("product_image", product.image_url);
    fd.append("product_category", product.category);
    fd.append("unit_price", String(product.price));

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

  const onToggleLike = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setLikeBusyId(product.id);
    const wasLiked = likedSet.has(product.id);
    const prevCount = counts[product.id] ?? product.likes_count ?? 0;

    setLikedSet((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(product.id);
      else next.add(product.id);
      return next;
    });
    setCounts((c) => ({
      ...c,
      [product.id]: Math.max(0, prevCount + (wasLiked ? -1 : 1)),
    }));

    startTransition(async () => {
      const result = await toggleProductLikeAction(product.id);
      setLikeBusyId(null);

      if (result?.error) {
        setLikedSet((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(product.id);
          else next.delete(product.id);
          return next;
        });
        setCounts((c) => ({ ...c, [product.id]: prevCount }));
        if (result.error.toLowerCase().includes("sign in")) {
          showToast({ type: "info", message: "Please log in to save likes." });
        } else {
          showToast({ type: "error", message: result.error });
        }
        return;
      }

      router.refresh();
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
      {toast && (
        <div className={`storefront-toast storefront-toast--${toast.type}`}>
          <span className="storefront-toast__icon">
            {toast.type === "success" && <CheckCircle size={18} />}
            {toast.type === "error" && <AlertCircle size={18} />}
            {toast.type === "info" && <ShoppingCart size={18} />}
          </span>
          <span>{toast.message}</span>
          {toast.type === "info" && (
            <Link href="/login" className="storefront-toast__link">
              Log in
            </Link>
          )}
          <button className="storefront-toast__close" onClick={() => setToast(null)} aria-label="Close">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="products-grid">
        {products.map((product) => {
          const liked = likedSet.has(product.id);
          const count = counts[product.id] ?? product.likes_count ?? 0;
          return (
            <article className="product-card" key={product.id}>
              <div className="product-image">
                <img src={product.image_url} alt={product.alt_text || product.name} />
                <div className="product-overlay">
                  <button
                    className={`btn-icon product-like-btn ${liked ? "product-like-btn--active" : ""}`}
                    type="button"
                    disabled={likeBusyId === product.id}
                    aria-pressed={liked}
                    aria-label={liked ? "Unlike" : "Like"}
                    onClick={(e) => onToggleLike(e, product)}
                  >
                    <Heart size={18} strokeWidth={1.5} fill={liked ? "currentColor" : "none"} />
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
                <p className="product-like-count" aria-live="polite">
                  <Heart size={14} strokeWidth={1.5} className="product-like-count__icon" />
                  {count} {count === 1 ? "like" : "likes"}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
