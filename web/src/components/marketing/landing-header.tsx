import { BrandMark } from "@/components/marketing/brand-mark";
import { SpringCta } from "@/components/marketing/spring-cta";
import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="flex h-16 items-center justify-between md:h-[72px]">
      <BrandMark className="text-lg" />
      <nav className="flex items-center gap-3 text-sm">
        <Link
          href="/sign-in"
          className="text-muted-foreground transition-colors hover:text-guava-green"
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
