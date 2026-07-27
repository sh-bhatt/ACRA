export function SupportedLanguagesSection() {
  const languages = [
    {
      short: "TS",
      name: "TypeScript",
      color: "bg-blue-500/15 text-blue-300",
    },
    {
      short: "TSX",
      name: "TypeScript TSX",
      color: "bg-sky-500/15 text-sky-300",
    },
    {
      short: "JS",
      name: "JavaScript",
      color: "bg-yellow-500/15 text-yellow-300",
    },
    {
      short: "JSX",
      name: "JavaScript JSX",
      color: "bg-amber-500/15 text-amber-300",
    },
  ];

  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-7xl">

        <p className="mb-10 text-center text-sm uppercase tracking-[0.35em] text-zinc-500">
          Currently Supports
        </p>

        <div className="flex flex-wrap items-center justify-center gap-5">

          {languages.map((language) => (
            <div
              key={language.short}
              className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 px-6 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-zinc-900"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold ${language.color}`}
              >
                {language.short}
              </div>

              <div>
                <p className="font-medium text-white">
                  {language.name}
                </p>

                <p className="text-sm text-zinc-500">
                  Fully Supported
                </p>
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}