"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/marketing/brand-mark";
import { SignOutButton } from "@/components/auth/sign-out-button";

const links = [
  { href: "/app/jobs", label: "Jobs" },
  { href: "/app/applications", label: "Applications" },
  { href: "/app/profile", label: "Profile" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-guava-green/10 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
        <Link href="/app/profile" className="shrink-0">
          <BrandMark className="text-lg" />
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1.5 text-sm md:gap-2">
          {links.map(({ href, label }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "rounded-full px-3 py-1.5 font-medium transition-colors",
                  active
                    ? "bg-guava-green/12 text-guava-green"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
