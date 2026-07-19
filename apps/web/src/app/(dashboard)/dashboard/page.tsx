import { logoutAction } from "@/features/auth/actions";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#090d0c] p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <p className="font-mono text-sm text-emerald-300">
              ACRA
            </p>

            <h1 className="mt-2 text-2xl font-semibold">
              Dashboard
            </h1>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
            >
              Log out
            </button>
          </form>
        </header>

        <section className="py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-600">
            Authentication successful
          </p>

          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
            Your code-review workspace is ready.
          </h2>
        </section>
      </div>
    </main>
  );
}