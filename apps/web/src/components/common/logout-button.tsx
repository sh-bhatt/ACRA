"use client";

import { LogOut } from "lucide-react";

import { logoutAction } from "@/features/auth/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-red-400 transition hover:bg-red-500/10"
      >
        <LogOut size={18} />
        Logout
      </button>
    </form>
  );
}