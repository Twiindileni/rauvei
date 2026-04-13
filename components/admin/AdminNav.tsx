"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  MessageSquare,
  FileText,
  Image,
  Package,
  Heart,
  LogOut,
  ChevronRight,
  Scissors,
  Mail,
} from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";

const navItems = [
  { href: "/admin",          label: "Overview",     icon: LayoutDashboard },
  { href: "/admin/products", label: "Products",     icon: Package },
  { href: "/admin/likes",    label: "Likes",        icon: Heart },
  { href: "/admin/orders",   label: "Orders",       icon: ShoppingBag },
  { href: "/admin/services", label: "Services",     icon: Scissors },
  { href: "/admin/emails",   label: "Emails",       icon: Mail },
  { href: "/admin/users",    label: "Users",        icon: Users },
  { href: "/admin/messages", label: "Messages",     icon: MessageSquare },
  { href: "/admin/posts",    label: "Blog Posts",   icon: FileText },
  { href: "/admin/pages",    label: "Page Content", icon: Image },
];

type Props = { adminEmail: string };

export default function AdminNav({ adminEmail }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__header">
        <img src="/lauvei.png" alt="RauVei" className="admin-sidebar__logo" />
        <div>
          <p className="admin-sidebar__brand">RauVei Admin</p>
          <p className="admin-sidebar__email">{adminEmail}</p>
        </div>
      </div>

      <nav className="admin-sidebar__nav">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`admin-nav-item ${isActive(href) ? "admin-nav-item--active" : ""}`}
          >
            <Icon size={18} />
            <span>{label}</span>
            {isActive(href) && <ChevronRight size={14} className="admin-nav-item__arrow" />}
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar__footer">
        <Link href="/" className="admin-nav-item" style={{ marginBottom: "8px" }}>
          <span style={{ fontSize: "0.8rem" }}>← Back to Site</span>
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="admin-nav-item admin-nav-item--logout" style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
