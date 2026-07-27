import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pt-28 pb-24">
      {/* Background Glow */}
      <div className="absolute left-1/2 top-0 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[140px]" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center">

        {/* Badge */}

        <div className="mb-8 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          AI-powered Static Analysis + Intelligent Reviews
        </div>

        {/* Heading */}

        <h1 className="max-w-5xl text-center text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
          Ship Better Code.
          <br />
          <span className="text-emerald-400">
            Review Smarter.
          </span>
        </h1>

        {/* Description */}

        <p className="mt-8 max-w-3xl text-center text-lg leading-8 text-zinc-400">
          ACRA combines static analysis with AI-powered code reviews
          to uncover bugs, security risks, performance bottlenecks
          and actionable refactoring opportunities before your code
          reaches production.
        </p>

        {/* Buttons */}

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">

          <Link
            href="/signup"
            className="rounded-full bg-emerald-500 px-8 py-4 font-semibold text-black transition hover:bg-emerald-400"
          >
            Start Reviewing
          </Link>

          <button
            className="rounded-full border border-white/10 px-8 py-4 text-white transition hover:bg-white/5"
          >
            View Demo
          </button>

        </div>

      </div>
    </section>
  );
}