"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { logoutAction } from "@/lib/auth/actions";
import {
  User,
  ShoppingBag,
  Package,
  Truck,
  Scissors,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",           label: "Overview",   icon: LayoutDashboard },
  { href: "/dashboard/profile",   label: "My Profile", icon: User },
  { href: "/dashboard/cart",      label: "Cart",       icon: ShoppingBag },
  { href: "/dashboard/orders",    label: "Orders",     icon: Package },
  { href: "/dashboard/deliveries",label: "Deliveries", icon: Truck },
  { href: "/dashboard/services",  label: "Services",   icon: Scissors },
];

type Props = { userName: string | null; email: string | null };

export default function DashboardNav({ userName, email }: Props) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() ?? "U";

  return (
    <aside className="dash-sidebar">
      {/* Brand */}
      <div className="dash-sidebar-brand">
        <Link href="/">
          <img src="/lauvei.png" alt="LauVei" className="dash-logo" />
        </Link>
      </div>

      {/* User card */}
      <div className="dash-user-card">
        <div className="dash-avatar">{initials}</div>
        <div className="dash-user-info">
          <p className="dash-user-name">{userName ?? "My Account"}</p>
          <p className="dash-user-email">{email ?? ""}</p>
        </div>
      </div>

      <div className="dash-divider" />

      {/* Nav */}
      <nav className="dash-nav">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`dash-nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {isActive && <span className="dash-nav-dot" />}
            </Link>
          );
        })}
      </nav>

      <div className="dash-spacer" />

      <div className="dash-divider" />

      {/* Logout */}
      <button
        className="dash-logout"
        onClick={handleLogout}
        disabled={pending}
        type="button"
      >
        <LogOut size={18} strokeWidth={1.8} />
        <span>{pending ? "Signing out…" : "Sign Out"}</span>
      </button>
    </aside>
  );
}
