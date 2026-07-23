"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Briefcase,
  FirstAidKit,
  GraduationCap,
  Heart,
  House,
  Megaphone,
  Package,
  Palette,
  Path,
  TrendUp,
  UsersThree,
} from "@phosphor-icons/react";
import { JobsSearchBar } from "@/components/jobs/jobs-search-bar";
import { HeroIndustryBackdrop } from "@/components/marketing/hero-industry-backdrop";
import { LandingFullscreenSection } from "@/components/marketing/landing-fullscreen-section";
import { Reveal } from "@/components/marketing/reveal";
import {
  RoleChipMarquee,
  type RoleChip,
} from "@/components/marketing/role-chip-marquee";
import { SoftOrb } from "@/components/marketing/hero-motion";
import { normalizeAdzunaCountry } from "@/lib/adzuna-countries";

const ROLE_CHIPS: RoleChip[] = [
  { label: "Career changer", query: "career change", Icon: Path },
  { label: "Project manager", query: "project manager", Icon: UsersThree },
  { label: "Data analyst", query: "data analyst", Icon: TrendUp },
  { label: "Marketing", query: "marketing", Icon: Megaphone },
  { label: "Remote roles", query: "remote", Icon: House },
  { label: "Design", query: "product design", Icon: Palette },
  { label: "Working student", query: "working student", Icon: GraduationCap },
  { label: "Social work", query: "social worker", Icon: Heart },
  { label: "Logistics", query: "logistics", Icon: Package },
  { label: "Freelance", query: "freelance", Icon: Briefcase },
  { label: "Healthcare", query: "healthcare", Icon: FirstAidKit },
  { label: "Office admin", query: "office administrator", Icon: Briefcase },
];

export function LandingJobSearchSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("gb");
  const [pending, setPending] = useState(false);

  function onSearch() {
    setPending(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("where", location.trim());
    params.set("country", normalizeAdzunaCountry(country));
    const qs = params.toString();
    router.push(qs ? `/jobs?${qs}` : "/jobs");
  }

  function onChipSelect(chip: RoleChip) {
    setQuery(chip.query);
  }

  return (
    <LandingFullscreenSection
      id="search"
      wash="photo"
      aria-label="Search jobs"
      className="justify-center px-[2.5vw] pb-16 pt-24 md:px-[3vw] md:pb-20 md:pt-28"
    >
      <HeroIndustryBackdrop />

      <SoftOrb className="left-[-12%] top-[8%] z-[1] h-72 w-72 bg-guava-pink/15" />
      <SoftOrb className="right-[-10%] bottom-[12%] z-[1] h-80 w-80 bg-guava-green/12" />

      <div className="relative z-10 mx-auto flex w-full max-w-[96rem] flex-1 flex-col justify-center gap-10 md:gap-12">
        <Reveal className="w-full max-w-3xl md:max-w-4xl">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-[oklch(0.86_0.08_12)]">
            Live job search
          </p>
          <h1
            className="mt-4 max-w-[18ch] text-balance text-[clamp(2rem,5.2vw,3.5rem)] font-semibold leading-[1.05] tracking-tight text-white [overflow-wrap:anywhere] [min-width:0] drop-shadow-[0_2px_24px_oklch(0_0_0_/_0.35)]"
            style={{ fontStyle: "normal" }}
          >
            How will you position yourself for tomorrow&apos;s jobs?
          </h1>
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-white/80 md:text-lg">
            Search real listings on GuavaJobs. See fit signals before you spend
            a generation on the wrong role.
          </p>
        </Reveal>

        <Reveal className="w-[min(94vw,100%)]" delay={0.06}>
          <RoleChipMarquee chips={ROLE_CHIPS} onSelect={onChipSelect} />
        </Reveal>

        <Reveal className="w-[min(93vw,100%)]" delay={0.1}>
          <JobsSearchBar
            query={query}
            location={location}
            country={country}
            onQueryChange={setQuery}
            onLocationChange={setLocation}
            onCountryChange={(value) =>
              setCountry(normalizeAdzunaCountry(value))
            }
            onSubmit={onSearch}
            pending={pending}
          />
        </Reveal>
      </div>
    </LandingFullscreenSection>
  );
}
