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
      className="justify-center px-4 pb-12 pt-[calc(4.25rem+env(safe-area-inset-top))] sm:px-5 sm:pb-16 md:px-6 md:pb-20 md:pt-28"
    >
      <HeroIndustryBackdrop />

      <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-[96rem] flex-1 flex-col justify-center gap-6 sm:gap-8 md:gap-12">
        <Reveal className="w-full min-w-0 max-w-3xl md:max-w-4xl">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-[var(--hero-eyebrow)]">
            Live job search
          </p>
          <h1
            className="mt-4 max-w-[18ch] text-balance text-[clamp(2rem,5.2vw,3.5rem)] font-semibold leading-[1.05] tracking-tight text-white [overflow-wrap:anywhere] [min-width:0]"
            style={{ fontStyle: "normal" }}
          >
            How will you position yourself for tomorrow&apos;s jobs?
          </h1>
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-white/80 md:text-lg">
            Search real listings on GuavaJobs. See fit signals before you spend
            a generation on the wrong role.
          </p>
        </Reveal>

        <Reveal className="w-full min-w-0" delay={0.06} animate={false}>
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

        <Reveal className="w-full min-w-0" delay={0.08} animate={false}>
          <RoleChipMarquee chips={ROLE_CHIPS} onSelect={onChipSelect} />
        </Reveal>
      </div>
    </LandingFullscreenSection>
  );
}
