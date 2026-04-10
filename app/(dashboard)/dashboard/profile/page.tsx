import { getUserProfile, getUserEmail } from "@/lib/dashboard/data";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [profile, email] = await Promise.all([getUserProfile(), getUserEmail()]);
  return <ProfileClient profile={profile} email={email} />;
}
