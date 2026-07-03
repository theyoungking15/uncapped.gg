import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin-shell";
import { EnvNotice } from "@/components/status";
import { getCurrentShop } from "@/lib/data";
import { createUserSupabaseClient, hasSupabaseEnv } from "@/lib/supabase";

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (!hasSupabaseEnv()) return <EnvNotice />;

  const supabase = await createUserSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { shop } = await getCurrentShop();
  return <AdminShell shop={shop}>{children}</AdminShell>;
}
