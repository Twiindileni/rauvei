"use client";

import { founder } from "@/lib/data/storefront";
import { Award, Feather, Globe, Target } from "lucide-react";

export default function AboutPage() {
  return (
    <main style={{ paddingTop: "120px" }}>
      {/* Hero Section */}
      <section className="hero" style={{ height: "60vh" }}>
        <div className="hero-bg">
          <img src="/about_hero_boutique_interior_1775823933228.png" alt="RauVei Heritage" style={{ filter: "brightness(0.5)" }} />
        </div>
        <div className="hero-content" style={{ textAlign: "center" }}>
          <h2 className="hero-subtitle fadeIn">Heritage & Vision</h2>
          <h1 className="hero-title fadeIn" style={{ animationDelay: "0.2s" }}>The Story of RauVei</h1>
        </div>
      </section>

      {/* Story Section */}
      <section className="section-padding">
        <div className="container" style={{ maxWidth: "1000px" }}>
          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            <h2 className="section-title" style={{ fontSize: "3rem", marginBottom: "32px" }}>Where Elegance Meets Roots</h2>
            <div style={{ color: "var(--text-muted)", fontSize: "1.15rem", lineHeight: "2", textAlign: "justify" }}>
              <p style={{ marginBottom: "24px" }}>
                Founded in the heart of Windhoek, RauVei Fashion Boutique was born from a singular vision: 
                to bridge the gap between timeless Namibian elegance and the fast-paced world of global high fashion. 
                What started as a passion for exquisite fabrics and sharp silhouettes has evolved into a premier 
                destination for those who view fashion as an extension of their identity.
              </p>
              <p>
                Our name, RauVei, stands for the balance between heritage and future. Every collection we curate 
                is a testament to our commitment to quality, sophistication, and the empowerment of our clients. 
                We don't just sell clothes; we provide the pieces that define your most memorable moments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="section-padding" style={{ background: "var(--bg-offset)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "40px" }}>
            <div style={{ textAlign: "center", padding: "40px", background: "#fff", boxShadow: "var(--shadow-sm)" }}>
              <Feather size={32} style={{ color: "var(--primary)", marginBottom: "24px" }} />
              <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "16px" }}>Craftsmanship</h4>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Meticulous attention to detail in every stitch and seam.</p>
            </div>
            <div style={{ textAlign: "center", padding: "40px", background: "#fff", boxShadow: "var(--shadow-sm)" }}>
              <Target size={32} style={{ color: "var(--primary)", marginBottom: "24px" }} />
              <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "16px" }}>Vision</h4>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Setting trends that celebrate individuality and confidence.</p>
            </div>
            <div style={{ textAlign: "center", padding: "40px", background: "#fff", boxShadow: "var(--shadow-sm)" }}>
              <Globe size={32} style={{ color: "var(--primary)", marginBottom: "24px" }} />
              <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "16px" }}>Heritage</h4>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Deeply rooted in Namibian elegance with a global appeal.</p>
            </div>
            <div style={{ textAlign: "center", padding: "40px", background: "#fff", boxShadow: "var(--shadow-sm)" }}>
              <Award size={32} style={{ color: "var(--primary)", marginBottom: "24px" }} />
              <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "16px" }}>Excellence</h4>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>A commitment to providing a premium boutique experience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="section-padding">
        <div className="container">
          <div className="about-container" style={{ alignItems: "center" }}>
            <div className="about-image">
              <img src={founder.image} alt={founder.imageAlt} style={{ borderRadius: "0" }} />
            </div>
            <div className="about-content">
              <h2 className="hero-subtitle" style={{ marginBottom: "12px" }}>The Founder</h2>
              <h2 className="section-title" style={{ fontSize: "3rem", marginBottom: "24px" }}>{founder.name}</h2>
              <p style={{ fontSize: "1.1rem", lineHeight: "1.8", color: "var(--text-muted)", marginBottom: "32px" }}>
                As the Executive Visionary behind RauVei, Rauna Amutenya has dedicated her career to redefining 
                sophistication in the Namibian fashion landscape. Her belief is simple: fashion is a language 
                that should be spoken with grace, strength, and unwavering quality.
              </p>
              <div style={{ borderLeft: "2px solid var(--primary)", paddingLeft: "32px" }}>
                <p style={{ fontStyle: "italic", fontSize: "1.2rem", color: "var(--text)" }}>
                  "RauVei is more than a boutique; it is a movement towards a more elegant world where everyone has the confidence to stand out."
                </p>
                <p style={{ marginTop: "16px", fontWeight: "700", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.1em" }}>
                  — Rauna Amutenya
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
