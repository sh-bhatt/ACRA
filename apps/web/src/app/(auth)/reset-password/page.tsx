import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/forgot-password?error=invalid-link");
  }

  return (
    <>
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
          Secure recovery
        </p>

        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
          Choose a new password
        </h2>

        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Use at least eight characters and avoid reusing an
          old password.
        </p>
      </div>

      <ResetPasswordForm />
    </>
  );
}