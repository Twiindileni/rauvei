import { getAdminCoupons } from "@/lib/admin/data";
import { getAllProducts } from "@/lib/data/products";
import CouponsClient from "./CouponsClient";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const [coupons, products] = await Promise.all([getAdminCoupons(), getAllProducts()]);
  const activeCount = coupons.filter((c) => c.active).length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Coupon Management</h1>
        <p className="admin-page-subtitle">
          {coupons.length} coupons · {activeCount} active
        </p>
      </div>
      <CouponsClient coupons={coupons} products={products} />
    </div>
  );
}
