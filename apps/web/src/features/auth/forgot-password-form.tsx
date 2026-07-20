"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  forgotPasswordAction,
} from "@/features/auth/actions";
import {
  initialAuthActionState,
} from "@/features/auth/auth-state";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-neutral-200"
        >
          Email address
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
        />
      </div>

      {state.message ? (
        <p
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              : "border-red-400/20 bg-red-400/10 text-red-200"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-12 w-full rounded-xl bg-emerald-300 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? "Sending reset link..."
          : "Send reset link"}
      </button>

      <p className="text-center text-sm text-neutral-500">
        Remembered your password?{" "}
        <Link
          href="/login"
          className="font-medium text-emerald-300 hover:text-emerald-200"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}