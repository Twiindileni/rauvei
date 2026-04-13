import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminCoupons, getAdminEmailCampaigns, getAllOrders } from "@/lib/admin/data";
import EmailsClient from "./EmailsClient";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [campaigns, orders, coupons] = await Promise.all([
    getAdminEmailCampaigns(25),
    getAllOrders(),
    getAdminCoupons(),
  ]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Email Campaigns</h1>
        <p className="admin-page-subtitle">
          Send polished promotions, coupons, and invoices from admin.
        </p>
      </div>
      <EmailsClient
        campaigns={campaigns}
        orders={orders}
        coupons={coupons}
        currentUserId={user?.id ?? ""}
      />
    </div>
  );
}
