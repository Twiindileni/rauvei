import { getDeliveries } from "@/lib/dashboard/data";
import DeliveriesClient, { DeliveriesEmpty } from "./DeliveriesClient";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  const deliveries = await getDeliveries();

  return (
    <div>
      <div className="dash-page-header">
        <h1 className="dash-page-title">Deliveries</h1>
        <p className="dash-page-subtitle">Track your shipments in real-time</p>
      </div>

      {deliveries.length === 0 ? (
        <DeliveriesEmpty />
      ) : (
        <DeliveriesClient deliveries={deliveries} />
      )}
    </div>
  );
}
