import { getPageContent } from "@/lib/admin/data";
import PagesClient from "./PagesClient";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  const items = await getPageContent();

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Page Content</h1>
        <p className="admin-page-subtitle">Update storefront text and images. Changes go live immediately.</p>
      </div>
      <PagesClient items={items} />
    </div>
  );
}
