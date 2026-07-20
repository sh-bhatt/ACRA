"use client";

import { useActionState } from "react";

import {
  resetPasswordAction,
} from "@/features/auth/actions";
import {
  initialAuthActionState,
} from "@/features/auth/auth-state";

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-neutral-200"
        >
          New password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          placeholder="At least 8 characters"
          className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-neutral-200"
        >
          Confirm new password
        </label>

        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          placeholder="Repeat your new password"
          className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
        />
      </div>

      {state.message ? (
        <p
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
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
          ? "Updating password..."
          : "Update password"}
      </button>
    </form>
  );
}