"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState } from "react";

import { UserMenu } from "@/components/common/user-menu";

type LandingNavbarProps = {
  user: User | null;
  displayName: string;
  avatarUrl: string | null;
};

export function LandingNavbar({
  user,
  displayName,
  avatarUrl,
}: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll,
      );
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-black/60 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        {/* Logo */}

        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 font-bold text-black">
            A
          </div>

          <span className="text-xl font-semibold tracking-tight text-white">
            ACRA
          </span>
        </Link>

        {/* Navigation */}

        <nav className="hidden items-center gap-10 text-sm text-zinc-400 md:flex">
          <a
            href="#features"
            className="transition hover:text-white"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="transition hover:text-white"
          >
            How It Works
          </a>
        </nav>

        {/* Right */}

        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <UserMenu
              displayName={displayName}
              email={user.email ?? ""}
              avatarUrl={avatarUrl}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-zinc-400 transition hover:text-white"
              >
                Sign In
              </Link>

              <Link
                href="/signup"
                className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-300"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}