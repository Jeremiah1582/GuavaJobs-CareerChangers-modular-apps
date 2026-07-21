"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  CaretDoubleLeft,
  CaretDoubleRight,
  ClipboardText,
  GearSix,
  SignOut,
  UserCircle,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HAS_APPS_COOKIE } from "@/lib/applications";
import { ONBOARDING_COOKIE } from "@/lib/onboarding";

const links = [
  { href: "/app/jobs", label: "Jobs", icon: Briefcase },
  { href: "/app/applications", label: "Applications", icon: ClipboardText },
  { href: "/app/profile", label: "Profile", icon: UserCircle },
  { href: "/app/settings", label: "Settings", icon: GearSix },
] as const;

const STORAGE_KEY = "gj_sidebar_collapsed";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const sidebarWash =
  "bg-gradient-to-b from-[oklch(0.52_0.13_12)] via-[oklch(0.42_0.14_14)] to-[oklch(0.28_0.10_20)]";

/** Expanded rail widths scale with viewport (tablet → desktop). */
const EXPANDED =
  "w-[min(13.5rem,22vw)] md:w-[min(14rem,20vw)] lg:w-56 xl:w-60 2xl:w-64";
const COLLAPSED = "w-14 md:w-16";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1" || stored === "0") {
        setCollapsed(stored === "1");
      } else {
        // Default: collapsed on tablet, expanded on large desktop
        const preferCollapsed =
          typeof window !== "undefined" &&
          window.matchMedia("(max-width: 1023px)").matches;
        setCollapsed(preferCollapsed);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  // Keep preference in sync when crossing tablet/desktop without a stored override
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    function onChange(e: MediaQueryListEvent) {
      try {
        if (localStorage.getItem(STORAGE_KEY) != null) return;
      } catch {
        /* ignore */
      }
      setCollapsed(e.matches);
      window.dispatchEvent(new Event("gj-sidebar-toggle"));
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("gj-sidebar-toggle"));
      }
      return next;
    });
  }

  async function onSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = `${ONBOARDING_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = `${HAS_APPS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 hidden flex-col text-white shadow-[8px_0_48px_-24px_color-mix(in_oklab,var(--guava-pink)_32%,transparent),inset_0_1px_0_oklch(1_0_0_/_0.06)] sm:flex",
        sidebarWash,
        "transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? COLLAPSED : EXPANDED,
        ready ? "opacity-100" : "opacity-0",
      ].join(" ")}
      aria-label="Main"
      data-collapsed={collapsed ? "true" : "false"}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,oklch(1_0_0_/_0.07)_0%,transparent_38%,oklch(0_0_0_/_0.16)_100%)]"
      />

      <div className="relative flex h-full flex-col px-2 py-4 md:px-3 md:py-5">
        <Link
          href="/app"
          className={[
            "mb-6 flex items-center gap-2.5 rounded-xl px-2 py-2 outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 md:mb-8",
            collapsed ? "justify-center px-0" : "",
          ].join(" ")}
          aria-label="GuavaJobs home"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-semibold tracking-tight shadow-inner backdrop-blur-sm md:size-9">
            G
          </span>
          <span
            className={[
              "overflow-hidden whitespace-nowrap text-sm font-semibold tracking-tight transition-[opacity,transform] duration-300 md:text-base",
              collapsed
                ? "w-0 translate-x-1 opacity-0"
                : "w-auto translate-x-0 opacity-100",
            ].join(" ")}
          >
            GuavaJobs
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                aria-current={active ? "page" : undefined}
                className={[
                  "group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-[background-color,transform] duration-200 active:scale-[0.98] md:gap-3 md:px-3 md:py-2.5",
                  collapsed ? "justify-center px-0" : "",
                  active
                    ? "bg-white/22 text-white shadow-[inset_0_1px_0_oklch(1_0_0_/_0.2)]"
                    : "text-white/85 hover:bg-white/12 hover:text-white",
                ].join(" ")}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white md:h-6"
                  />
                ) : null}
                <Icon
                  className="size-5 shrink-0"
                  weight={active ? "duotone" : "regular"}
                />
                <span
                  className={[
                    "overflow-hidden whitespace-nowrap transition-[opacity,transform] duration-300",
                    collapsed
                      ? "w-0 translate-x-1 opacity-0"
                      : "w-auto translate-x-0 opacity-100",
                  ].join(" ")}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-white/15 pt-3 md:pt-4">
          <button
            type="button"
            onClick={onSignOut}
            title={collapsed ? "Sign out" : undefined}
            className={[
              "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/12 hover:text-white active:scale-[0.98] md:gap-3 md:px-3 md:py-2.5",
              collapsed ? "justify-center px-0" : "",
            ].join(" ")}
          >
            <SignOut className="size-5 shrink-0" weight="regular" />
            <span
              className={[
                "overflow-hidden whitespace-nowrap transition-[opacity,transform] duration-300",
                collapsed
                  ? "w-0 translate-x-1 opacity-0"
                  : "w-auto opacity-100",
              ].join(" ")}
            >
              Sign out
            </span>
          </button>

          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            className={[
              "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/12 hover:text-white active:scale-[0.98] md:gap-3 md:px-3 md:py-2.5",
              collapsed ? "justify-center px-0" : "",
            ].join(" ")}
          >
            {collapsed ? (
              <CaretDoubleRight className="size-5" weight="bold" />
            ) : (
              <CaretDoubleLeft className="size-5" weight="bold" />
            )}
            <span
              className={[
                "overflow-hidden whitespace-nowrap transition-[opacity,transform] duration-300",
                collapsed
                  ? "w-0 translate-x-1 opacity-0"
                  : "w-auto opacity-100",
              ].join(" ")}
            >
              Collapse
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}

/** Spacer so main content clears the fixed sidebar (sm+). */
export function AppSidebarSpacer() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    function sync() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "1" || stored === "0") {
          setCollapsed(stored === "1");
          return;
        }
        setCollapsed(window.matchMedia("(max-width: 1023px)").matches);
      } catch {
        /* ignore */
      }
    }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("gj-sidebar-toggle", sync);
    const mq = window.matchMedia("(max-width: 1023px)");
    mq.addEventListener("change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("gj-sidebar-toggle", sync);
      mq.removeEventListener("change", sync);
    };
  }, []);

  return (
    <div
      aria-hidden
      className={[
        "hidden shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:block",
        collapsed ? COLLAPSED : EXPANDED,
      ].join(" ")}
      data-collapsed={collapsed ? "true" : "false"}
    />
  );
}
