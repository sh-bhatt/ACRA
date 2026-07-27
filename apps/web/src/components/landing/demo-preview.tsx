export function DemoPreviewSection() {
  return (
    <section className="px-6 pb-32">
      <div className="mx-auto max-w-7xl">

        <div className="mb-16 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">
            Live Analysis Preview
          </p>

          <h2 className="mt-4 text-4xl font-bold text-white">
            Everything you need.
            <br />
            Nothing you don't.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-zinc-400">
            Static analysis, AI insights, complexity metrics and
            actionable recommendations in one clean report.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl">

          {/* Browser Bar */}

          <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4">

            <div className="h-3 w-3 rounded-full bg-red-400" />

            <div className="h-3 w-3 rounded-full bg-yellow-400" />

            <div className="h-3 w-3 rounded-full bg-green-400" />

            <div className="ml-6 rounded-full bg-zinc-900 px-4 py-1 text-xs text-zinc-500">
              acra.dev/review
            </div>

          </div>

          <div className="grid gap-8 p-8 lg:grid-cols-3">

            {/* Left */}

            <div className="space-y-5">

              <div className="rounded-2xl bg-zinc-900 p-5">

                <p className="text-sm text-zinc-400">
                  Overall Score
                </p>

                <h3 className="mt-3 text-5xl font-bold text-emerald-400">
                  91
                </h3>

              </div>

              <div className="rounded-2xl bg-zinc-900 p-5">

                <p className="text-sm text-zinc-400">
                  Findings
                </p>

                <div className="mt-4 space-y-2 text-sm">

                  <div className="flex justify-between">
                    <span>Medium</span>
                    <span className="text-yellow-400">
                      2
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Low</span>
                    <span className="text-blue-400">
                      3
                    </span>
                  </div>

                </div>

              </div>

            </div>

            {/* Middle */}

            <div className="rounded-2xl bg-zinc-900 p-5">

              <p className="mb-4 text-sm text-zinc-400">
                AI Summary
              </p>

              <p className="leading-7 text-zinc-300">
                The project demonstrates strong maintainability with
                low cyclomatic complexity. The primary improvements
                involve removing unused declarations, replacing
                <code className="rounded bg-zinc-800 px-1 mx-1">
                  any
                </code>
                types and enforcing strict equality.
              </p>

            </div>

            {/* Right */}

            <div className="rounded-2xl bg-zinc-900 p-5">

              <p className="mb-4 text-sm text-zinc-400">
                Refactoring Plan
              </p>

              <ul className="space-y-3 text-sm text-zinc-300">

                <li>✓ Replace any with explicit types</li>

                <li>✓ Remove unused variables</li>

                <li>✓ Enable strict equality</li>

                <li>✓ Delete debugger statements</li>

                <li>✓ Add unit tests</li>

              </ul>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}