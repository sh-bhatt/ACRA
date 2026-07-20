import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const parameters = await searchParams;
  const invalidLink =
    parameters.error === "invalid-link" ||
    parameters.error === "otp_expired";

  return (
    <>
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
          Account recovery
        </p>

        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
          Reset your password
        </h2>

        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Enter your email and we will send you a secure
          password-reset link.
        </p>
      </div>

      {invalidLink ? (
        <p className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          That reset link is invalid or has expired.
          Request a new one below.
        </p>
      ) : null}

      <ForgotPasswordForm />
    </>
  );
}