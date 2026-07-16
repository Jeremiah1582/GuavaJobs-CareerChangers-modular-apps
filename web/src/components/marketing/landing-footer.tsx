import Link from "next/link";
import { BrandMark } from "@/components/marketing/brand-mark";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 md:flex-row md:items-start md:justify-between md:px-6">
        <div className="max-w-sm">
          <BrandMark />
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The job platform for career changers and career growers. Honest
            applications, less busywork.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <Link
            href="/sign-up"
            className="text-foreground transition-opacity hover:opacity-80"
          >
            Get started
          </Link>
          <Link
            href="/sign-in"
            className="text-muted-foreground transition-opacity hover:opacity-80"
          >
            Sign in
          </Link>
          <Link
            href="/privacy"
            className="text-muted-foreground transition-opacity hover:opacity-80"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-muted-foreground transition-opacity hover:opacity-80"
          >
            Terms
          </Link>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted-foreground md:px-6">
          Job listings may include results powered by Adzuna. You review every
          application before you send it.
        </p>
      </div>
    </footer>
  );
}
