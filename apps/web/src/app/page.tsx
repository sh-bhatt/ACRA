import { LandingNavbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero";
import { FeaturesSection } from "@/components/landing/features";
import { DemoPreviewSection } from "@/components/landing/demo-preview";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { CTASection } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";
import { SupportedLanguagesSection } from "@/components/landing/supported-languages";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = "Developer";
  let avatarUrl: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("user_id", user.id)
      .single();

    displayName = profile?.name ?? "Developer";
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#09090B] text-white">

      {/* Background Glow */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-280px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[180px]" />

        <div className="absolute right-[-150px] top-[700px] h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[180px]" />

        <div className="absolute left-[-200px] bottom-[200px] h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[180px]" />
      </div>

      {/* Grid */}

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, white 1px, transparent 1px),
            linear-gradient(to bottom, white 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10">

        <LandingNavbar
          user={user}
          displayName={displayName}
          avatarUrl={avatarUrl}
        />

        <HeroSection />

        <SupportedLanguagesSection />

        <FeaturesSection />

        <DemoPreviewSection />

        <HowItWorksSection />

        <CTASection />

        <LandingFooter />

      </div>

    </main>
  );
}