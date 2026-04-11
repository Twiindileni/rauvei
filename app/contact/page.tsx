import ContactPageClient from "./ContactPageClient";
import { getPageContentMap } from "@/lib/admin/data";

export default async function ContactPage() {
  const content = await getPageContentMap();
  const heroImageUrl = content.contact_hero_image_url ?? "";

  return <ContactPageClient heroImageUrl={heroImageUrl} />;
}
