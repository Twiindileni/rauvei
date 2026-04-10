"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, 
  ShoppingBag, 
  Menu, 
  X, 
  ChevronDown,
  User
} from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = async () => {
    try {
      const res = await fetch("/api/cart/count", { cache: "no-store" });
      const data = await res.json();
      setCartCount(data.count ?? 0);
    } catch {
      // silently ignore if not logged in
    }
  };

  useEffect(() => {
    fetchCartCount();

    const onCartUpdated = () => fetchCartCount();
    window.addEventListener("cart-updated", onCartUpdated);

    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("cart-updated", onCartUpdated);
    };
  }, []);

  const onNavClick = (target: string) => {
    setActiveNav(target);
    setMobileMenuOpen(false);
    setMobileDropdownOpen(false);
  };

  const toggleMobileDropdown = (e: React.MouseEvent) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      setMobileDropdownOpen(!mobileDropdownOpen);
    }
  };

  return (
    <nav className={`navbar glass ${isScrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        <Link href="/" className="nav-logo" onClick={() => onNavClick("home")}>
          <img src="/lauvei.png" alt="RauVei Logo" />
        </Link>

        <div className={`nav-links ${mobileMenuOpen ? "active" : ""}`}>
          <Link
            href="/"
            className={`nav-link ${activeNav === "home" ? "active" : ""}`}
            onClick={() => onNavClick("home")}
          >
            Home
          </Link>
          <Link
            href="/#shop"
            className={`nav-link ${activeNav === "shop" ? "active" : ""}`}
            onClick={() => onNavClick("shop")}
          >
            Exclusives
          </Link>
          <div className={`nav-dropdown ${mobileDropdownOpen ? "mobile-open" : ""}`} onClick={toggleMobileDropdown}>
            <span className="nav-link dropdown-toggle">
              Collections <ChevronDown size={12} style={{ marginLeft: "4px", display: "inline", transform: mobileDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.3s" }} />
            </span>
            <div className="dropdown-menu">
              <Link href="/collections/women" onClick={() => setMobileMenuOpen(false)}>Women</Link>
              <Link href="/collections/men" onClick={() => setMobileMenuOpen(false)}>Men</Link>
              <Link href="/collections/accessories" onClick={() => setMobileMenuOpen(false)}>Accessories</Link>
              <Link href="/collections/limited-edition" onClick={() => setMobileMenuOpen(false)}>Limited Edition</Link>
            </div>
          </div>
          <Link
            href="/about"
            className={`nav-link ${activeNav === "about" ? "active" : ""}`}
            onClick={() => onNavClick("about")}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={`nav-link ${activeNav === "contact" ? "active" : ""}`}
            onClick={() => onNavClick("contact")}
          >
            Contact
          </Link>
          <Link href="/blog" className="nav-link">
            Stories
          </Link>
        </div>

        <div className="nav-icons">
          <a href="/#shop" className="nav-icon" aria-label="Search products">
            <Search size={20} strokeWidth={1.5} />
          </a>
          <Link href="/login" className="nav-icon" aria-label="User Account">
            <User size={20} strokeWidth={1.5} />
          </Link>
          <Link href="/dashboard/cart" className="nav-icon" aria-label="Shopping bag" style={{ position: "relative" }}>
            <ShoppingBag size={20} strokeWidth={1.5} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          <button
            className="mobile-toggle"
            aria-label="Toggle mobile menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
