import Link from "next/link";
import { BrandMark } from "@/components/marketing/brand-mark";
import { SpringCta } from "@/components/marketing/spring-cta";

export function LandingHeader({ floating = false }: { floating?: boolean }) {
  return (
    <header
      className={
        floating
          ? "flex min-h-12 min-w-0 items-center justify-between gap-1.5 overflow-hidden rounded-2xl border border-guava-pink/15 bg-white/75 px-2.5 shadow-[0_12px_40px_-24px_color-mix(in_oklab,var(--guava-pink)_35%,transparent)] backdrop-blur-md sm:min-h-14 sm:gap-2 sm:px-4 md:min-h-16 md:px-6"
          : "flex min-h-14 min-w-0 items-center justify-between gap-2 overflow-hidden sm:gap-3 md:min-h-[72px]"
      }
    >
      <Link href="/" className="min-w-0 shrink-0">
        <BrandMark className="text-[0.95rem] sm:text-lg" />
      </Link>
      <nav className="flex min-w-0 shrink items-center gap-0.5 sm:gap-2 md:gap-3">
        <Link
          href="/jobs"
          className="inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:text-guava-green sm:px-3"
        >
          <span className="sm:hidden">Jobs</span>
          <span className="hidden sm:inline">Browse jobs</span>
        </Link>
        <Link
          href="/sign-in"
          className="hidden min-h-11 items-center whitespace-nowrap rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-guava-green sm:inline-flex"
        >
          Sign in
        </Link>
        <SpringCta
          href="/sign-up"
          variant="pink"
          withArrow
          className="shrink-0 px-2.5 text-xs sm:px-4 sm:text-sm [&_svg]:hidden sm:[&_svg]:block"
        >
          <span className="sm:hidden">Start</span>
          <span className="hidden sm:inline">Get started</span>
        </SpringCta>
      </nav>
    </header>
  );
}
