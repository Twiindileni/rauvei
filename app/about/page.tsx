import AboutPageClient from "./AboutPageClient";
import { getPageContentMap } from "@/lib/admin/data";

export default async function AboutPage() {
  const content = await getPageContentMap();
  const heroImageUrl = content.about_hero_image_url ?? "";

  return <AboutPageClient heroImageUrl={heroImageUrl} />;
}
