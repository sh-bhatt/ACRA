import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#09090B] px-6 py-12">

      <div className="mx-auto max-w-7xl">

        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">

          {/* Brand */}

          <div className="text-center md:text-left">

            <h3 className="text-2xl font-bold tracking-tight text-white">
              ACRA
            </h3>

            <p className="mt-3 max-w-sm text-sm leading-7 text-zinc-500">
              AI-powered code reviews for modern
              TypeScript and JavaScript projects.
            </p>

          </div>

          {/* Navigation */}

          <nav className="flex items-center gap-8 text-sm">

            <Link
              href="/"
              className="text-zinc-400 transition hover:text-white"
            >
              Home
            </Link>

            <Link
              href="/login"
              className="text-zinc-400 transition hover:text-white"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              className="text-zinc-400 transition hover:text-white"
            >
              Get Started
            </Link>

          </nav>

        </div>

        {/* Bottom */}

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-zinc-600">

          © {new Date().getFullYear()} ACRA. All rights reserved.

        </div>

      </div>

    </footer>
  );
}