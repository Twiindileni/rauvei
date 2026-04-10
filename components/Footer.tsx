"use client";

import Link from "next/link";
import { Globe, Camera, Music } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-container">
          <div className="footer-brand">
            <img src="/lauvei.png" alt="RauVei Logo" />
            <p>Setting the trend for the modern world. Namibian elegance, global appeal.</p>
          </div>
          <div className="footer-links">
            <h4>Navigation</h4>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/#shop">Boutique</Link></li>
              <li><Link href="/about">Heritage</Link></li>
            <li><Link href="/contact">Concierge</Link></li>
              <li><Link href="/blog">Editorial</Link></li>
            </ul>
          </div>
          <div className="footer-social">
            <h4>Social Presence</h4>
            <div className="social-icons">
              <a href="#" aria-label="Facebook"><Globe size={20} /></a>
              <a href="#" aria-label="Instagram"><Camera size={20} /></a>
              <a href="#" aria-label="TikTok"><Music size={20} /></a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 RauVei Fashion Boutique. Designed for timeless elegance.</p>
        </div>
      </div>
    </footer>
  );
}
