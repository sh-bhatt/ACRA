import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090d0c] px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.12),transparent_35%)]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1210] shadow-2xl shadow-black/40 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden min-h-[680px] flex-col justify-between border-r border-white/10 p-12 lg:flex">
          <div>
            <p className="font-mono text-sm tracking-[0.28em] text-emerald-300">
              ACRA
            </p>

            <h1 className="mt-8 max-w-lg text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">
              Review code before someone else has to.
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-neutral-400">
              Static analysis and AI-powered feedback for cleaner,
              safer and more maintainable code.
            </p>
          </div>

          <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-600">
            AI Code Review Assistant
          </p>
        </section>

        <section className="flex min-h-[620px] items-center p-6 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-sm">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}