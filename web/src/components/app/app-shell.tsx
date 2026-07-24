"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Briefcase,
  ChartBar,
  ClipboardText,
  GearSix,
  UserCircle,
} from "@phosphor-icons/react";
import { BrandMark } from "@/components/marketing/brand-mark";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  AppSidebar,
  AppSidebarSpacer,
} from "@/components/app/app-sidebar";
import { AnalyticsSessionTracker } from "@/components/app/analytics-session-tracker";
import { OfflineBanner } from "@/components/ui/state-panel";
import { GenerationWatchProvider } from "@/components/app/generation-watch-provider";
import { isStaffRole, useMeQuery } from "@/hooks/use-me";
import { identifyAnalyticsUser } from "@/lib/analytics";
import { useOnlineStatus } from "@/lib/online";

const baseLinks = [
  { href: "/app/jobs", label: "Jobs", icon: Briefcase },
  { href: "/app/applications", label: "Applications", icon: ClipboardText },
  { href: "/app/profile", label: "Profile", icon: UserCircle },
  { href: "/app/settings", label: "Settings", icon: GearSix },
] as const;

const adminLink = {
  href: "/app/admin",
  label: "Admin",
  icon: ChartBar,
} as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Logged-in chrome:
 * - sm+: retractable pink-gradient left sidebar
 * - phone: compact top bar + bottom tabs
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const online = useOnlineStatus();
  const { data: me } = useMeQuery();

  const links = isStaffRole(me?.platformRole)
    ? [...baseLinks, adminLink]
    : [...baseLinks];

  useEffect(() => {
    if (me?.id) {
      identifyAnalyticsUser(me.id);
    }
  }, [me?.id]);

  return (
    <div
      className="flex min-h-[100dvh] w-full min-w-0 max-w-full overflow-x-hidden"
      style={{ background: "var(--wash-hero)" }}
    >
      <AnalyticsSessionTracker />
      <AppSidebar />
      <AppSidebarSpacer />

      <div className="flex w-0 min-w-0 flex-1 flex-col overflow-x-hidden">
        <OfflineBanner online={online} />
        <GenerationWatchProvider />

        <header className="sticky top-0 z-40 shrink-0 border-b border-guava-green/10 bg-white/80 backdrop-blur-md sm:hidden">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <Link
              href="/app"
              className="shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-guava-pink/40"
              aria-label="GuavaJobs home"
            >
              <BrandMark className="text-lg" />
            </Link>
            <SignOutButton />
          </div>
        </header>

        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden pb-[calc(4.25rem+env(safe-area-inset-bottom))] sm:pb-0">
          {children}
        </div>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-guava-green/10 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
          aria-label="Primary"
        >
          <ul
            className={[
              "mx-auto grid max-w-lg",
              links.length > 4 ? "grid-cols-5" : "grid-cols-4",
            ].join(" ")}
          >
            {links.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      "flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors",
                      active
                        ? "text-guava-green"
                        : "text-muted-foreground",
                    ].join(" ")}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      className="size-5"
                      weight={active ? "duotone" : "regular"}
                    />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
