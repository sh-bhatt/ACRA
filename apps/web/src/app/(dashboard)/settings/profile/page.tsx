import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileAvatar } from "@/features/profile/profile-avatar";
import { ProfileForm } from "@/features/profile/profile-form";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileSettingsPage() {
    const supabase = await createClient();

    const { data: claimsData, error: claimsError } =
        await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
        redirect("/login");
    }

    const { data: profile, error: profileError } =
        await supabase
            .from("profiles")
            .select(
                "name, avatar_url, default_review_focus",
            )
            .eq("user_id", userId)
            .single();

    if (profileError || !profile) {
        throw new Error("Unable to load your profile");
    }

    return (
        <main className="min-h-screen bg-[#090d0c] px-5 py-8 text-white sm:px-8">
            <div className="mx-auto max-w-4xl">
                <header className="border-b border-white/10 pb-7">
                    <Link
                        href="/dashboard"
                        className="text-sm text-neutral-500 transition hover:text-white"
                    >
                        ← Back to dashboard
                    </Link>

                    <p className="mt-8 font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
                        Account settings
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                        Profile preferences
                    </h1>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
                        Manage how your name appears and which review
                        categories ACRA selects by default.
                    </p>
                </header>

                <section className="grid gap-8 py-10 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <ProfileAvatar
                        userId={userId}
                        displayName={profile.name}
                        initialAvatarUrl={profile.avatar_url}
                    />

                    <ProfileForm
                        initialName={profile.name}
                        initialReviewFocus={
                            profile.default_review_focus
                        }
                    />
                </section>
            </div>
        </main>
    );
}