import { getProductsByCollection } from "@/lib/data/products";
import { getLikedProductIdsForUser } from "@/lib/data/productLikes";
import { collectionMeta } from "@/lib/data/storefront";
import StorefrontProducts from "@/components/StorefrontProducts";

export const dynamic = "force-dynamic";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = collectionMeta[slug as keyof typeof collectionMeta];

  if (!meta) {
    return (
      <div className="section-padding container" style={{ marginTop: "100px", textAlign: "center" }}>
        <h1 className="section-title">Collection Not Found</h1>
        <p>Return to our <a href="/" style={{ color: "var(--primary)" }}>Home Page</a></p>
      </div>
    );
  }

  const products = await getProductsByCollection(slug);
  const likedProductIds = await getLikedProductIdsForUser(products.map((p) => p.id));

  return (
    <>
      <section className="hero" style={{ height: "60vh" }}>
        <div className="hero-bg">
          <img src={meta.heroImage} alt={meta.title} />
        </div>
        <div className="hero-content">
          <h2 className="hero-subtitle fadeIn" style={{ animationDelay: "0.2s" }}>{meta.subtitle}</h2>
          <h1 className="hero-title fadeIn" style={{ animationDelay: "0.4s" }}>{meta.title}</h1>
          <p className="hero-description fadeIn" style={{ animationDelay: "0.6s" }}>{meta.description}</p>
        </div>
      </section>

      <section className="products-section section-padding">
        <div className="container">
          <StorefrontProducts products={products} likedProductIds={likedProductIds} />
        </div>
      </section>
    </>
  );
}
