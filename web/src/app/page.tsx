/* Hallmark · genre: playful-professional · macrostructure: Narrative Workflow
 * theme: Guava custom (pink/green) · enrichment: industry photo backdrop + role chips
 * nav: N5 floating pill · footer: Ft8 marquee
 * taste: variance 8 · motion 6 · density 4 · anti-emoji · asymmetric mid-band
 * hero: soft photo rotation behind black tint — UI stays focal
 */
import { LandingHeader } from "@/components/marketing/landing-header";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { SoftwareApplicationJsonLd } from "@/components/marketing/json-ld";
import { LandingJobSearchSection } from "@/components/marketing/landing-job-search-section";
import { LandingCvFitSection } from "@/components/marketing/landing-cv-fit-section";
import {
  ClosingSection,
  HonestyStripSection,
  LoopSection,
  ProblemSection,
  ProofBandSection,
} from "@/components/marketing/landing-sections";
import { SectionFrame } from "@/components/marketing/section-frame";
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
        <div className="fixed inset-x-0 top-0 z-50 px-[2.5vw] pt-3 md:px-[3vw] md:pt-4">
          <div className="mx-auto w-[min(94vw,96rem)]">
            <LandingHeader floating />
          </div>
        </div>

        <LandingJobSearchSection />

        <SectionFrame wash="plain" borderTone="neutral">
          <HonestyStripSection />
        </SectionFrame>

        <SectionFrame wash="pink" borderTone="pink">
          <ProblemSection />
        </SectionFrame>

        <SectionFrame wash="mint" borderTone="green">
          <LoopSection items={loop} />
        </SectionFrame>

        <LandingCvFitSection />

        <SectionFrame wash="plain" borderTone="neutral">
          <ProofBandSection />
        </SectionFrame>

        <SectionFrame wash="hero" borderTone="pink">
          <ClosingSection />
        </SectionFrame>

        <LandingFooter />
      </main>
    </>
  );
}
