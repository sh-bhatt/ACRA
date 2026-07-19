import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
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

      <LoginForm />
    </>
  );
}