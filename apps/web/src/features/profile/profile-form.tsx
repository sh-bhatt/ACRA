"use client";

import { useActionState } from "react";

import { updateProfileAction } from "@/features/profile/actions";
import {
  REVIEW_FOCUS_OPTIONS,
} from "@/features/profile/profile-options";
import {
  initialProfileActionState,
} from "@/features/profile/profile-state";

type ProfileFormProps = {
  initialName: string;
  initialReviewFocus: string[];
};

export function ProfileForm({
  initialName,
  initialReviewFocus,
}: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialProfileActionState,
  );

  return (
    <form action={formAction} className="space-y-8">
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="text-sm font-medium text-neutral-200"
        >
          Display name
        </label>

        <input
          id="name"
          name="name"
          type="text"
          defaultValue={initialName}
          minLength={2}
          maxLength={80}
          required
          className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
        />

        <p className="text-xs leading-5 text-neutral-500">
          This name appears in your private ACRA workspace.
        </p>
      </div>

      <fieldset className="space-y-4">
        <div>
          <legend className="text-sm font-medium text-neutral-200">
            Default review focus
          </legend>

          <p className="mt-1 text-xs leading-5 text-neutral-500">
            These categories will be selected when you create
            a new review.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {REVIEW_FOCUS_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-white/20 hover:bg-white/[0.04]"
            >
              <input
                type="checkbox"
                name="defaultReviewFocus"
                value={option.value}
                defaultChecked={initialReviewFocus.includes(
                  option.value,
                )}
                className="mt-1 size-4 accent-emerald-300"
              />

              <span>
                <span className="block text-sm font-medium text-neutral-200">
                  {option.label}
                </span>

                <span className="mt-1 block text-xs leading-5 text-neutral-500">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

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
        className="h-12 rounded-xl bg-emerald-300 px-6 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving changes..." : "Save changes"}
      </button>
    </form>
  );
}