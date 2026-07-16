export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      <span className="bg-gradient-to-br from-[oklch(0.72_0.18_12)] via-[oklch(0.64_0.19_12)] to-[oklch(0.56_0.16_18)] bg-clip-text text-transparent">
        Guava
      </span>
      <span className="bg-gradient-to-br from-[oklch(0.66_0.14_150)] via-[oklch(0.58_0.16_150)] to-[oklch(0.5_0.12_155)] bg-clip-text text-transparent">
        Jobs
      </span>
    </span>
  );
}
