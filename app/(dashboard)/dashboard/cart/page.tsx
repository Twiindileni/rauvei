import { getCartItems } from "@/lib/dashboard/data";
import CartClient from "./CartClient";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const items = await getCartItems();
  return <CartClient items={items} />;
}
