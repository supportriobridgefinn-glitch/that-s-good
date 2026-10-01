import { cn } from "@/lib/utils";

export function BrandMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <span className="brand-cube" aria-hidden="true">
        <span className="brand-cube-top" />
        <span className="brand-cube-left" />
        <span className="brand-cube-right" />
      </span>
      {!compact && (
        <span className="min-w-0 leading-none">
          <span className="block whitespace-nowrap font-display text-lg font-extrabold uppercase tracking-wide text-foreground sm:text-2xl">
            RIO-BRIDGE
          </span>
          <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.3em] text-primary sm:text-xs">Finance</span>
        </span>
      )}
    </span>
  );
}