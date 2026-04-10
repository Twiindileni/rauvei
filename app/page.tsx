import Link from "next/link";
import { getFeaturedProducts } from "@/lib/data/products";
import { founder } from "@/lib/data/storefront";
import { getPageContentMap } from "@/lib/admin/data";
import StorefrontProducts from "@/components/StorefrontProducts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, content] = await Promise.all([
    getFeaturedProducts(),
    getPageContentMap(),
  ]);

  // Fall back to original static values if the DB row hasn't been seeded yet
  const heroImage       = content.hero_image_url    || "/hero.png";
  const heroTitle       = content.hero_title        || "Setting Fashion Trend";
  const heroSubtitle    = content.hero_subtitle     || "The 2026 Collection";
  const heroDescription = content.hero_description  || "Experience the pinnacle of Namibian elegance. Our curated pieces are designed for those who dare to define their own style.";
  const aboutTitle      = content.about_title       || "A Vision of Elegance";
  const aboutText       = content.about_text        || founder.bio;
  const ceoName         = content.ceo_name          || founder.name;
  const ceoImage        = content.ceo_image_url     || founder.image;
  const ceoPhone        = content.ceo_phone         || founder.phoneLabel;

  // Bold the second word of the hero title (e.g. "Setting **Fashion** Trend")
  const titleWords = heroTitle.split(" ");
  const titleJsx =
    titleWords.length >= 2 ? (
      <>
        {titleWords[0]}{" "}
        <span>{titleWords.slice(1, -1).join(" ")}</span>{" "}
        {titleWords[titleWords.length - 1]}
      </>
    ) : (
      heroTitle
    );

  return (
    <main>
      {/* Hero */}
      <section id="home" className="hero">
        <div className="hero-bg">
          <img src={heroImage} alt="Fashion Hero" />
        </div>
        <div className="hero-content">
          <h2 className="hero-subtitle fadeIn" style={{ animationDelay: "0.2s" }}>{heroSubtitle}</h2>
          <h1 className="hero-title fadeIn" style={{ animationDelay: "0.4s" }}>
            {titleJsx}
          </h1>
          <p className="hero-description fadeIn" style={{ animationDelay: "0.6s" }}>
            {heroDescription}
          </p>
          <div className="hero-btns fadeIn" style={{ animationDelay: "0.8s" }}>
            <a href="#shop" className="btn btn-primary">Explore Shop</a>
            <a href="#about" className="btn btn-secondary">Our Heritage</a>
          </div>
        </div>
      </section>

      {/* New Arrivals — live from database */}
      <section id="shop" className="products-section section-padding">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">New Arrivals</h2>
            <p className="section-subtitle">Curated excellence for the modern wardrobe</p>
          </div>
          <StorefrontProducts products={products} />
        </div>
      </section>

      {/* About */}
      <section id="about" className="about-section section-padding">
        <div className="container">
          <div className="about-container">
            <div className="about-image">
              <img src={ceoImage} alt={ceoName} />
            </div>
            <div className="about-content">
              <h2 className="section-title">{aboutTitle}</h2>
              <p className="about-text" style={{ marginBottom: "24px" }}>{aboutText}</p>
              <div style={{ marginBottom: "40px" }}>
                <Link href="/about" className="btn btn-secondary">Read Our Full Story</Link>
              </div>
              <div className="founder-info">
                <p className="founder-title">Executive Visionary</p>
                <h3 className="founder-name" style={{ fontSize: "1.5rem", marginBottom: "8px" }}>{ceoName}</h3>
                <a
                  href={`tel:${ceoPhone.replace(/\s/g, "")}`}
                  className="founder-contact"
                  style={{ letterSpacing: "0.05em", color: "var(--primary)" }}
                >
                  {ceoPhone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
