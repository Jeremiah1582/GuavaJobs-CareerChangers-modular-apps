export function QuotaChip({
  used,
  limit,
  className = "",
}: {
  used: number;
  limit: number | null;
  className?: string;
}) {
  const unlimited = limit == null;
  const remaining = unlimited ? null : Math.max(0, limit - used);
  const tight = !unlimited && remaining !== null && remaining <= 1;

  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-sm",
        tight
          ? "border-guava-pink/40 bg-guava-pink/10 text-foreground"
          : "border-guava-green/35 bg-guava-green/10 text-foreground",
        className,
      ].join(" ")}
    >
      <span className="text-xs font-sans text-muted-foreground">AI gens</span>
      <span className={tight ? "text-guava-pink" : "text-guava-green"}>
        {used}
        {unlimited ? " / unlimited" : ` / ${limit}`}
      </span>
    </div>
  );
}
