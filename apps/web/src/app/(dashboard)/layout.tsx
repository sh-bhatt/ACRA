import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardNavbar } from "@/components/dashboard/navbar";
import { createClient } from "@/lib/supabase/server";

type DashboardLayoutProps = {
  children: ReactNode;
};
export const dynamic = "force-dynamic";
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("user_id", user.id)
    .single();

  const displayName = profile?.name ?? "Developer";
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <>
      <DashboardNavbar
        user={user}
        displayName={displayName}
        avatarUrl={avatarUrl}
      />

      <main className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#09090B]">

        {/* Background Glow */}

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-280px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[180px]" />

          <div className="absolute right-[-150px] top-[700px] h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[180px]" />

          <div className="absolute left-[-200px] bottom-[200px] h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[180px]" />
        </div>

        {/* Grid */}

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(to right, white 1px, transparent 1px),
              linear-gradient(to bottom, white 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Page Content */}

        <div className="relative z-10">
          {children}
        </div>
      </main>
    </>
  );
}