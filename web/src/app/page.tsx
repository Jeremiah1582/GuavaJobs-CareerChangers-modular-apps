import type { Metadata } from "next";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingHeader } from "@/components/marketing/landing-header";
import { SoftwareApplicationJsonLd } from "@/components/marketing/json-ld";
import { HeroLine, HeroMotion, SoftOrb } from "@/components/marketing/hero-motion";
import { HeroStage } from "@/components/marketing/hero-stage";
import {
  GreenPulseMark,
  HonestyIllustration,
} from "@/components/marketing/illustrations";
import { LoopRail, type LoopItem } from "@/components/marketing/loop-rail";
import { QuotaPips } from "@/components/marketing/quota-pips";
import { Reveal } from "@/components/marketing/reveal";
import { SpringCta } from "@/components/marketing/spring-cta";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const loop: LoopItem[] = [
  {
    title: "Discover",
    body: "Search roles with real listings. Fit signals before you spend a generation.",
    icon: "Binoculars",
  },
  {
    title: "Generate",
    body: "One tap builds a grounded cover letter and ATS notes from your CV and the job.",
    icon: "Lightning",
  },
  {
    title: "Improve",
    body: "See gaps and suggestions. Edit the letter. Nothing ships until you say so.",
    icon: "PencilSimple",
  },
  {
    title: "Apply",
    body: "Open the employer apply link when you are ready. Assisted, not fake one-click.",
    icon: "PaperPlaneTilt",
  },
  {
    title: "Track",
    body: "Status, snapshots, and next steps stay together so nothing falls through.",
    icon: "CheckCircle",
  },
];

export default function HomePage() {
  return (
    <>
      <SoftwareApplicationJsonLd />
      <main className="bg-background text-foreground">
        {/* Hero: centered message on a layered paper stage */}
        <section
          className="relative overflow-hidden px-4 pb-10 pt-2 md:px-6 md:pb-14"
          style={{ background: "var(--wash-hero)" }}
        >
          <SoftOrb className="left-[-8%] top-[10%] z-0 h-64 w-64 bg-guava-pink/15" />
          <SoftOrb className="right-[-6%] top-[30%] z-0 h-72 w-72 bg-guava-green/25" />
          <div className="relative z-10 mx-auto max-w-7xl">
            <LandingHeader />
            <div className="mt-4 md:mt-6">
              <HeroStage>
                <HeroMotion>
                  <HeroLine>
                    <p className="inline-flex items-center justify-center gap-2 text-sm font-medium tracking-wide text-guava-pink">
                      Honest applications, less busywork
                      <GreenPulseMark />
                    </p>
                  </HeroLine>
                  <HeroLine>
                    <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-5xl md:leading-[1.08]">
                      Apply with a tailored letter without inventing your past.
                    </h1>
                  </HeroLine>
                  <HeroLine>
                    <p className="mx-auto max-w-[36ch] text-base leading-relaxed text-muted-foreground md:max-w-[42ch]">
                      Find roles that fit your skills. Apply less. Improve every
                      package with honest{" "}
                      <span className="font-medium text-guava-green">fit</span>{" "}
                      insights.
                    </p>
                  </HeroLine>
                  <HeroLine>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                      <SpringCta href="/sign-up" variant="pink" withArrow>
                        Get started
                      </SpringCta>
                      <SpringCta href="/sign-in" variant="ghost">
                        I already have an account
                      </SpringCta>
                    </div>
                  </HeroLine>
                </HeroMotion>
              </HeroStage>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section
          className="border-t border-guava-green/15"
          style={{ background: "var(--wash-mint)" }}
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-12 md:items-center md:gap-12 md:px-6 md:py-24">
            <Reveal className="md:col-span-5">
              <HonestyIllustration />
            </Reveal>
            <Reveal className="md:col-span-7" delay={0.08}>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Career change needs honesty, not hype.
              </h2>
              <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
                Generic generators invent experience. Spreadsheet trackers lose
                context. GuavaJobs frames transferable skills, scores{" "}
                <span className="font-medium text-guava-green">fit</span> against
                the real job, and keeps every draft with its snapshots.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Core loop */}
        <section
          className="border-t border-guava-pink/15"
          style={{ background: "var(--wash-pink)" }}
        >
          <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
            <Reveal>
              <h2 className="max-w-xl text-2xl font-semibold tracking-tight md:text-3xl">
                Discover, generate, improve, apply, track.
              </h2>
              <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
                One calm loop from first search to a hired outcome. AI assists.
                You stay in control.
              </p>
            </Reveal>
            <LoopRail items={loop} />
          </div>
        </section>

        {/* Freemium */}
        <section
          className="border-t border-guava-green/20"
          style={{ background: "var(--wash-mint)" }}
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-12 md:px-6 md:py-24">
            <Reveal className="md:col-span-4">
              <p className="font-mono text-6xl font-semibold tracking-tight text-guava-green md:text-7xl">
                5
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                AI generations / month on Free
              </p>
              <QuotaPips />
            </Reveal>
            <Reveal className="md:col-span-8" delay={0.06}>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Free to start. Clear about the limit.
              </h2>
              <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
                Free includes five AI generations each month. Manual tracking
                stays unlimited. Paid raises the generation cap when you need
                more speed. No invented past, either way.
              </p>
              <div className="mt-8">
                <SpringCta href="/sign-up" variant="green" withArrow>
                  Get started
                </SpringCta>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Jobs attribution */}
        <section className="border-t border-border">
          <Reveal className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Real listings, not a fake feed.
            </h2>
            <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
              Job search draws on live market data. Where Adzuna results appear
              in product, we show{" "}
              <span className="font-medium text-guava-green">Jobs by Adzuna</span>
              . You always leave GuavaJobs to finish the employer application.
            </p>
          </Reveal>
        </section>

        {/* Closing CTA */}
        <section
          className="border-t border-guava-green/15"
          style={{ background: "var(--wash-hero)" }}
        >
          <Reveal className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-20 md:px-6 md:py-24">
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight md:text-3xl">
              Ready for applications that sound like you?
            </h2>
            <p className="max-w-[40ch] text-sm text-muted-foreground">
              Your first honest package is a few taps away.
            </p>
            <SpringCta href="/sign-up" variant="green" withArrow>
              Get started
            </SpringCta>
          </Reveal>
        </section>

        <LandingFooter />
      </main>
    </>
  );
}
