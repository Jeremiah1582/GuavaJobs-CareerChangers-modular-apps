"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/marketing/brand-mark";
import { HeroLine, HeroMotion } from "@/components/marketing/hero-motion";
import { JobsSearchBar } from "@/components/jobs/jobs-search-bar";
import { normalizeAdzunaCountry } from "@/lib/adzuna-countries";

export function HeroJobSearch() {
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

  return (
    <HeroMotion>
      <HeroLine>
        <BrandMark className="text-xl md:text-2xl" />
      </HeroLine>
      <HeroLine className="w-full max-w-xl">
        <JobsSearchBar
          query={query}
          location={location}
          country={country}
          onQueryChange={setQuery}
          onLocationChange={setLocation}
          onCountryChange={(value) => setCountry(normalizeAdzunaCountry(value))}
          onSubmit={onSearch}
          pending={pending}
        />
      </HeroLine>
    </HeroMotion>
  );
}
