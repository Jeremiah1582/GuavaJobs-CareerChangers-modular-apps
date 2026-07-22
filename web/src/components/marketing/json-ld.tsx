import { getSiteUrl } from "@/lib/site-url";

export function SoftwareApplicationJsonLd() {
  const siteUrl = getSiteUrl();

  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "GuavaJobs",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Honest AI-assisted job applications. Generate tailored cover letters, check fit before you apply, and track every role.",
    url: siteUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      description: "Free tier includes 5 AI generations per month.",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
