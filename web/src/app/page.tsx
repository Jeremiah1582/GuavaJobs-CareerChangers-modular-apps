import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export default function HomePage() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--wash-hero)" }}
      />
      <div className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col px-4 py-8 md:px-6 md:py-10">
        <header className="flex items-center justify-between">
          <p className="text-lg font-semibold tracking-tight text-foreground">
            GuavaJobs
          </p>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/sign-in"
              className="text-muted-foreground transition-opacity hover:opacity-80"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 font-medium text-primary-foreground transition-transform active:scale-[0.98]"
            >
              Get started
              <ArrowRight className="size-4" weight="regular" />
            </Link>
          </nav>
        </header>

        <section className="mt-auto grid max-w-2xl gap-6 pb-16 pt-24 md:pb-24">
          <p className="text-sm font-medium tracking-wide text-guava-pink">
            Honest applications, less busywork
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl md:leading-none">
            Apply with a tailored letter — without inventing your past.
          </h1>
          <p className="max-w-[65ch] text-base leading-relaxed text-muted-foreground">
            GuavaJobs helps you search roles, generate grounded cover letters and
            ATS feedback, then track every application in one calm place.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-guava-pink px-5 py-2.5 text-sm font-medium text-accent-foreground transition-transform active:scale-[0.98]"
            >
              Start free
              <ArrowRight className="size-4" weight="regular" />
            </Link>
            <Link
              href="/sign-in"
              className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              I already have an account
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
