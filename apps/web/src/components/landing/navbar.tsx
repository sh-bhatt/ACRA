"use client";

import type { User } from "@supabase/supabase-js";
import { Menu, X } from "lucide-react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize back to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? "border-b border-white/10 bg-black/60 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 font-bold text-black">
            A
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">
            ACRA
          </span>
        </Link>

        {/* Navigation - desktop */}
        <nav className="hidden items-center gap-10 text-sm text-zinc-400 md:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-white">
            How It Works
          </a>
        </nav>

        {/* Right - desktop */}
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

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-black/90 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            
             <a href="#features"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              Features
            </a>
            
             <a  href="#how-it-works"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              How It Works
            </a>

            <div className="mt-2 flex flex-col gap-3 border-t border-white/10 pt-4">
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
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-center text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full bg-emerald-400 px-5 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}