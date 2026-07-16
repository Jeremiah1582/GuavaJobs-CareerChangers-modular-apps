"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ONBOARDING_COOKIE } from "@/lib/onboarding";

export function SignOutButton() {
  const router = useRouter();

  async function onSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = `${ONBOARDING_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      className="text-sm text-muted-foreground transition-opacity hover:opacity-80"
    >
      Sign out
    </button>
  );
}
