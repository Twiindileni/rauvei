import { getAllProducts } from "@/lib/data/products";
import ProductsClient from "./ProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  const active   = products.filter(p => p.active).length;
  const featured = products.filter(p => p.featured).length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Products</h1>
        <p className="admin-page-subtitle">
          {products.length} total · {active} active · {featured} featured in New Arrivals
        </p>
      </div>
      <ProductsClient products={products} />
    </div>
  );
}
