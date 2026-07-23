export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      <span className="text-[var(--brand-guava)]">Guava</span>
      <span className="text-[var(--brand-jobs)]">Jobs</span>
    </span>
  );
}
