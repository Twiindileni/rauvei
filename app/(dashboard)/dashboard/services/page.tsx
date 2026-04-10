import { getUserProfile, getUserEmail } from "@/lib/dashboard/data";
import ServicesClient from "./ServicesClient";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const [profile, email] = await Promise.all([getUserProfile(), getUserEmail()]);
  return (
    <ServicesClient
      defaultName={profile.full_name ?? ""}
      defaultEmail={email ?? ""}
    />
  );
}
