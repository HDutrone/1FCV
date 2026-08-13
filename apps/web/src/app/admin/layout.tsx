import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }
  if (user.status === "PENDING") {
    redirect("/register?step=2");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
