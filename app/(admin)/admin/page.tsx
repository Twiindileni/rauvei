import Link from "next/link";
import { getAdminStats } from "@/lib/admin/data";
import { Users, ShoppingBag, MessageSquare, FileText, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  const cards = [
    { label: "Total Users",     value: stats.users,        icon: Users,        href: "/admin/users",    color: "#6c63ff" },
    { label: "Total Orders",    value: stats.orders,       icon: ShoppingBag,  href: "/admin/orders",   color: "#c8956c" },
    { label: "Pending Orders",  value: stats.pendingOrders,icon: Clock,        href: "/admin/orders",   color: "#e07b4f" },
    { label: "Messages",        value: stats.messages,     icon: MessageSquare,href: "/admin/messages", color: "#3b9e6e" },
    { label: "Blog Posts",      value: stats.posts,        icon: FileText,     href: "/admin/posts",    color: "#4a90d9" },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard Overview</h1>
        <p className="admin-page-subtitle">Welcome back. Here's what's happening with RauVei today.</p>
      </div>

      <div className="admin-stats-grid">
        {cards.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href} className="admin-stat-card">
            <div className="admin-stat-card__icon" style={{ background: `${color}18`, color }}>
              <Icon size={24} />
            </div>
            <div>
              <p className="admin-stat-card__value">{value}</p>
              <p className="admin-stat-card__label">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="admin-quick-links">
        <h2 className="admin-section-title">Quick Actions</h2>
        <div className="admin-quick-grid">
          <Link href="/admin/posts?new=1" className="admin-quick-card">
            <FileText size={20} />
            <span>Write New Blog Post</span>
          </Link>
          <Link href="/admin/pages" className="admin-quick-card">
            <span style={{ fontSize: "20px" }}>🖼️</span>
            <span>Update Page Images</span>
          </Link>
          <Link href="/admin/orders?status=pending" className="admin-quick-card">
            <Clock size={20} />
            <span>Review Pending Orders</span>
          </Link>
          <Link href="/admin/messages" className="admin-quick-card">
            <MessageSquare size={20} />
            <span>Read Messages</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
