"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";

import { UserMenu } from "@/components/common/user-menu";

type DashboardNavbarProps = {
  user: User;
  displayName: string;
  avatarUrl: string | null;
};

export function DashboardNavbar({
  user,
  displayName,
  avatarUrl,
}: DashboardNavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md">

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        <Link
          href="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 font-bold text-zinc-950 shadow-sm shadow-emerald-500/20 transition-transform group-hover:scale-105">
            A
          </div>

          <span className="text-lg font-bold tracking-tight text-white">
            ACRA
          </span>
        </Link>

        <UserMenu
          displayName={displayName}
          email={user.email ?? ""}
          avatarUrl={avatarUrl}
        />

      </div>

    </header>
  );
}