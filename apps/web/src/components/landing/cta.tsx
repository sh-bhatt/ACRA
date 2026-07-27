import Link from "next/link";

export function CTASection() {
  return (
    <section className="px-6 py-32">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[40px] border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-zinc-900 p-10 text-center shadow-[0_0_80px_rgba(16,185,129,0.08)] md:p-16">

        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">
          READY TO GET STARTED?
        </p>

        <h2 className="mt-6 text-4xl font-bold leading-tight text-white md:text-6xl">
          Review Code With
          <span className="block text-emerald-400">
            Confidence.
          </span>
        </h2>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-zinc-400">
          Upload your project, receive AI-powered insights,
          detect bugs, improve maintainability and ship better
          software faster with ACRA.
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">

          <Link
            href="/signup"
            className="inline-flex h-14 items-center justify-center rounded-full bg-emerald-400 px-8 font-semibold text-black transition hover:bg-emerald-300"
          >
            Create Free Account
          </Link>

          <Link
            href="/login"
            className="inline-flex h-14 items-center justify-center rounded-full border border-white/10 px-8 font-semibold text-white transition hover:bg-white/5"
          >
            Sign In
          </Link>

        </div>

      </div>
    </section>
  );
}