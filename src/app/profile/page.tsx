import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getSession();
  if (session) {
    redirect(`/users/${session.login}`);
  }
  redirect("/login");
}
