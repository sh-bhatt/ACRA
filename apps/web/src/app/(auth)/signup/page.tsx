import { SignupForm } from "@/features/auth/signup-form";

export default function SignupPage() {
  return (
    <>
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
          Start reviewing
        </p>

        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
          Create your account
        </h2>

        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Submit code and receive actionable review reports.
        </p>
      </div>

      <SignupForm />
    </>
  );
}