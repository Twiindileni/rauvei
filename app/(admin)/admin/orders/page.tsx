import { getAllOrders } from "@/lib/admin/data";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Orders</h1>
        <p className="admin-page-subtitle">{orders.length} total orders</p>
      </div>
      <OrdersClient orders={orders} />
    </div>
  );
}
