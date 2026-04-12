import { getUserProfile, getUserEmail } from "@/lib/dashboard/data";
import { getActiveBoutiqueServicesForUser } from "@/lib/data/boutiqueServices";
import ServicesClient from "./ServicesClient";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const [profile, email, services] = await Promise.all([
    getUserProfile(),
    getUserEmail(),
    getActiveBoutiqueServicesForUser(),
  ]);
  return (
    <ServicesClient
      services={services}
      defaultName={profile.full_name ?? ""}
      defaultEmail={email ?? ""}
    />
  );
}
