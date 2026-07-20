import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/features/auth/actions";
import { UserAvatar } from "@/features/profile/user-avatar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
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
            .select("name, avatar_url")
            .eq("user_id", userId)
            .single();

    if (profileError) {
        console.error(
            "Failed to load dashboard profile:",
            profileError.message,
        );
    }

    const displayName = profile?.name ?? "Developer";
    const avatarUrl = profile?.avatar_url ?? null;

    return (
        <main className="min-h-screen bg-[#090d0c] px-5 py-6 text-white sm:px-8">
            <div className="mx-auto max-w-6xl">
                <header className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div>
                        <p className="font-mono text-sm tracking-[0.18em] text-emerald-300">
                            ACRA
                        </p>

                        <h1 className="mt-2 text-2xl font-semibold">
                            Dashboard
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/settings/profile"
                            aria-label="Open profile settings"
                            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] py-1.5 pl-1.5 pr-4 transition hover:border-white/20 hover:bg-white/[0.05]"
                        >
                            <UserAvatar
                                displayName={displayName}
                                avatarUrl={avatarUrl}
                                size="small"
                            />

                            <span className="hidden max-w-40 truncate text-sm font-medium text-neutral-200 sm:block">
                                {displayName}
                            </span>
                        </Link>

                        <form action={logoutAction}>
                            <button
                                type="submit"
                                className="h-12 rounded-xl border border-white/10 px-4 text-sm text-neutral-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                            >
                                Log out
                            </button>
                        </form>
                    </div>
                </header>

                <section className="py-20">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">
                        Private workspace
                    </p>

                    <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                        Welcome back, {displayName}.
                    </h2>

                    <p className="mt-5 max-w-xl text-base leading-7 text-neutral-500">
                        Your private code-review workspace is ready.
                        Reviews, findings and complexity reports will appear
                        here once the analysis pipeline is connected.
                    </p>

                    <div className="mt-10 flex flex-wrap gap-3">
                        <Link
                            href="/settings/profile"
                            className="inline-flex h-12 items-center rounded-xl border border-white/10 px-5 text-sm font-medium text-neutral-200 transition hover:border-white/20 hover:bg-white/5"
                        >
                            Manage profile
                        </Link>

                        <Link
                            href="/reviews/new"
                            className="inline-flex h-12 items-center rounded-xl bg-emerald-300 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200"
                        >
                            New review
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}