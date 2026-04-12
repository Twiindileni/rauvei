import { getAllBoutiqueServices } from "@/lib/data/boutiqueServices";
import { getServiceRequests } from "@/lib/admin/data";
import ServicesAdminClient from "./ServicesAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const [services, requests] = await Promise.all([getAllBoutiqueServices(), getServiceRequests()]);

  const pending = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Services</h1>
        <p className="admin-page-subtitle">
          {services.length} catalog entries · {requests.length} requests
          {pending > 0 ? ` · ${pending} pending` : ""}
        </p>
      </div>
      <ServicesAdminClient services={services} requests={requests} />
    </div>
  );
}
