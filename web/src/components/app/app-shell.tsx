"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
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
import { OfflineBanner } from "@/components/ui/state-panel";
import { useOnlineStatus } from "@/lib/online";

const links = [
  { href: "/app/jobs", label: "Jobs", icon: Briefcase },
  { href: "/app/applications", label: "Applications", icon: ClipboardText },
  { href: "/app/profile", label: "Profile", icon: UserCircle },
  { href: "/app/settings", label: "Settings", icon: GearSix },
] as const;

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

  return (
    <div
      className="flex min-h-[100dvh]"
      style={{ background: "var(--wash-hero)" }}
    >
      <AppSidebar />
      <AppSidebarSpacer />

      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineBanner online={online} />

        {/* Phone-only top bar */}
        <header className="sticky top-0 z-40 border-b border-guava-green/10 bg-white/80 backdrop-blur-md sm:hidden">
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

        <div className="min-w-0 flex-1 pb-[calc(4.25rem+env(safe-area-inset-bottom))] sm:pb-0">
          {children}
        </div>

        {/* Phone bottom tabs */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-guava-green/10 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
          aria-label="Primary"
        >
          <ul className="mx-auto grid max-w-lg grid-cols-4">
            {links.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      "flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-medium transition-colors",
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
