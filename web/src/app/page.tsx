import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingHeader } from "@/components/marketing/landing-header";
import { SoftwareApplicationJsonLd } from "@/components/marketing/json-ld";
import { HeroLine, HeroMotion, SoftOrb } from "@/components/marketing/hero-motion";
import { HeroStage } from "@/components/marketing/hero-stage";
import {
  ClosingSection,
  FreemiumSection,
  ListingsSection,
  LoopSection,
  ProblemSection,
} from "@/components/marketing/landing-sections";
import { SectionFrame } from "@/components/marketing/section-frame";
import { GreenPulseMark } from "@/components/marketing/illustrations";
import { SpringCta } from "@/components/marketing/spring-cta";
import type { LoopItem } from "@/components/marketing/loop-rail";
import type { Metadata } from "next";

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

        <SectionFrame wash="mint" borderTone="green" orbs>
          <ProblemSection />
        </SectionFrame>

        <SectionFrame wash="pink" borderTone="pink" orbs>
          <LoopSection items={loop} />
        </SectionFrame>

        <SectionFrame wash="mint" borderTone="green">
          <FreemiumSection />
        </SectionFrame>

        <SectionFrame wash="plain" borderTone="neutral">
          <ListingsSection />
        </SectionFrame>

        <SectionFrame wash="hero" borderTone="green" orbs>
          <ClosingSection />
        </SectionFrame>

        <LandingFooter />
      </main>
    </>
  );
}
