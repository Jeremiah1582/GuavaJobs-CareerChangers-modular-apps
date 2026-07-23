import Link from "next/link";
import { BrandMark } from "@/components/marketing/brand-mark";
import { SpringCta } from "@/components/marketing/spring-cta";

export function LandingHeader({ floating = false }: { floating?: boolean }) {
  return (
    <header
      className={
        floating
          ? "flex h-14 items-center justify-between rounded-2xl border border-guava-pink/15 bg-white/75 px-4 shadow-[0_12px_40px_-24px_color-mix(in_oklab,var(--guava-pink)_35%,transparent)] backdrop-blur-md md:h-16 md:px-6"
          : "flex h-16 items-center justify-between md:h-[72px]"
      }
    >
      <Link href="/" className="shrink-0">
        <BrandMark className="text-lg" />
      </Link>
      <nav className="flex items-center gap-2 text-sm md:gap-3">
        <Link
          href="/jobs"
          className="hidden rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-guava-green sm:inline"
        >
          Browse jobs
        </Link>
        <Link
          href="/sign-in"
          className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-guava-green"
        >
          Sign in
        </Link>
        <SpringCta href="/sign-up" variant="pink" withArrow className="text-sm">
          Get started
        </SpringCta>
      </nav>
    </header>
  );
}
