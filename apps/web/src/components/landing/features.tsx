import {
  BrainCircuit,
  ShieldCheck,
  Gauge,
  Sparkles,
} from "lucide-react";

const features = [
  {
    title: "AI Code Reviews",
    description:
      "Understand your code with AI-generated summaries, strengths and actionable refactoring plans.",
    icon: BrainCircuit,
  },
  {
    title: "Security Analysis",
    description:
      "Detect common security risks and unsafe coding patterns before deployment.",
    icon: ShieldCheck,
  },
  {
    title: "Performance Insights",
    description:
      "Identify bottlenecks, complexity hotspots and optimisation opportunities.",
    icon: Gauge,
  },
  {
    title: "Clean Code",
    description:
      "Improve maintainability with intelligent suggestions backed by static analysis.",
    icon: Sparkles,
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="px-6 py-28"
    >
      <div className="mx-auto max-w-7xl">

        <div className="mb-16 text-center">

          <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">
            Features
          </p>

          <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">
            Built for modern developers
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Everything required to review code faster, write cleaner software
            and catch issues before they reach production.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-2">

          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-3xl border border-white/10 bg-zinc-900/60 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-zinc-900"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500 group-hover:text-black">
                  <Icon size={28} />
                </div>

                <h3 className="mt-8 text-2xl font-semibold text-white">
                  {feature.title}
                </h3>

                <p className="mt-4 leading-7 text-zinc-400">
                  {feature.description}
                </p>
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}