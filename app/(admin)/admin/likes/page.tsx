import Link from "next/link";
import { getAllProducts } from "@/lib/data/products";
import { Heart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProductLikesPage() {
  const products = await getAllProducts();
  const sorted = [...products].sort(
    (a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0),
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Product likes</h1>
        <p className="admin-page-subtitle">
          Total likes across all products:{" "}
          <strong>{sorted.reduce((s, p) => s + (p.likes_count ?? 0), 0)}</strong>
        </p>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Collection</th>
              <th>Likes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td className="admin-td-muted">{p.collection}</td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                    <Heart size={16} style={{ color: "#e11d48" }} />
                    {p.likes_count ?? 0}
                  </span>
                </td>
                <td>
                  <Link href="/admin/products" className="admin-reply-link">Edit product</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
