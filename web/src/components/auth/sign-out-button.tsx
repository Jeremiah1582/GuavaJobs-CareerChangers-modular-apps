"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HAS_APPS_COOKIE } from "@/lib/applications";
import { ONBOARDING_COOKIE } from "@/lib/onboarding";

export function SignOutButton() {
  const router = useRouter();

  async function onSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = `${ONBOARDING_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = `${HAS_APPS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
    >
      Sign out
    </button>
  );
}
