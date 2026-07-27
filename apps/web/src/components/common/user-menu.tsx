"use client";

import Link from "next/link";
import {
  ChevronDown,
  LayoutDashboard,
  User as UserIcon,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { LogoutButton } from "@/components/common/logout-button";
import { UserAvatar } from "@/features/profile/user-avatar";

type UserMenuProps = {
  displayName: string;
  email: string;
  avatarUrl: string | null;
};

export function UserMenu({
  displayName,
  email,
  avatarUrl,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);

  const containerRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent,
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        onClick={() =>
          setOpen((prev) => !prev)
        }
        className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 transition hover:border-emerald-500/20 hover:bg-white/[0.05]"
      >
        <UserAvatar
          displayName={displayName}
          avatarUrl={avatarUrl}
          size="small"
        />

        <div className="hidden text-left md:block">
          <p className="text-sm font-medium text-white">
            {displayName}
          </p>

          <p className="text-xs text-zinc-500">
            {email}
          </p>
        </div>

        <ChevronDown
          size={16}
          className={`text-zinc-500 transition duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#111113] shadow-2xl">

          <div className="flex items-center gap-3 border-b border-white/10 p-4">

            <UserAvatar
              displayName={displayName}
              avatarUrl={avatarUrl}
              size="small"
            />

            <div className="min-w-0">
              <p className="truncate font-medium text-white">
                {displayName}
              </p>

              <p className="truncate text-sm text-zinc-500">
                {email}
              </p>
            </div>

          </div>

          <div className="p-2">

            <Link
              href="/dashboard"
              onClick={() =>
                setOpen(false)
              }
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>

            <Link
              href="/settings/profile"
              onClick={() =>
                setOpen(false)
              }
              className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              <UserIcon size={18} />
              Profile
            </Link>

            <div className="mt-2 border-t border-white/10 pt-2">
              <LogoutButton />
            </div>

          </div>

        </div>
      )}
    </div>
  );
}