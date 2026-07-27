import {
  Upload,
  SearchCheck,
  BrainCircuit,
  FileCheck2,
} from "lucide-react";

const steps = [
  {
    title: "Upload Code",
    description:
      "Paste your TypeScript or JavaScript code and start a new review in seconds.",
    icon: Upload,
  },
  {
    title: "Static Analysis",
    description:
      "ESLint rules and complexity metrics inspect your code for bugs, maintainability and code quality.",
    icon: SearchCheck,
  },
  {
    title: "AI Review",
    description:
      "AI validates the findings, explains issues and generates intelligent refactoring suggestions.",
    icon: BrainCircuit,
  },
  {
    title: "Review Report",
    description:
      "Receive a complete report with scores, findings, summaries and an actionable improvement plan.",
    icon: FileCheck2,
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="px-6 py-32"
    >
      <div className="mx-auto max-w-7xl">

        <div className="mb-20 text-center">

          <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">
            Workflow
          </p>

          <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">
            From source code
            <br />
            to actionable insights
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            ACRA combines deterministic static analysis with AI-powered reasoning
            to deliver meaningful code reviews you can actually act upon.
          </p>

        </div>

        <div className="grid gap-8 md:grid-cols-4">

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="relative rounded-3xl border border-white/10 bg-zinc-900/60 p-8"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Icon size={28} />
                </div>

                <span className="text-sm text-zinc-500">
                  Step {index + 1}
                </span>

                <h3 className="mt-2 text-xl font-semibold text-white">
                  {step.title}
                </h3>

                <p className="mt-4 leading-7 text-zinc-400">
                  {step.description}
                </p>

                {index !== steps.length - 1 && (
                  <div className="absolute right-[-24px] top-1/2 hidden h-px w-12 bg-white/10 md:block" />
                )}
              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}