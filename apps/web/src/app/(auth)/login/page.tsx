import { LoginForm } from "@/features/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{
    passwordReset?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const parameters = await searchParams;
  const passwordWasReset =
    parameters.passwordReset === "success";

  return (
    <>
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
          Welcome back
        </p>

        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
          Sign in to ACRA
        </h2>

        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Continue reviewing and improving your code.
        </p>
      </div>

      {passwordWasReset ? (
        <p className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          Your password has been updated. Sign in using your
          new password.
        </p>
      ) : null}

      <LoginForm />
    </>
  );
}