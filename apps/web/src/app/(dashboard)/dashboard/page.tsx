import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
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
    .select("name")
    .eq("user_id", user.id)
    .single();

  const displayName = profile?.name ?? "Developer";

  return (
    <section className="mx-auto max-w-7xl px-6 py-14 text-white">

      <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">
        Dashboard
      </p>

      <h1 className="mt-5 text-5xl font-bold tracking-tight">
        Welcome back,
        <br />
        {displayName}.
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
        Your private AI code review workspace is ready.
        Reviews, findings, complexity reports and AI insights
        will appear here once the analysis pipeline is connected.
      </p>

      <div className="mt-12 flex flex-wrap gap-4">

        <Link
          href="/reviews/new"
          className="rounded-full bg-emerald-400 px-8 py-4 font-semibold text-black transition hover:bg-emerald-300"
        >
          New Review
        </Link>

        <Link
          href="/settings/profile"
          className="rounded-full border border-white/10 px-8 py-4 text-white transition hover:bg-white/5"
        >
          Manage Profile
        </Link>

      </div>

      

    </section>
  );
}