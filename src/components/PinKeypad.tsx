import { Delete } from "lucide-react";

export function PinKeypad({
  value,
  onChange,
  max = 4,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  max?: number;
  disabled?: boolean;
}) {
  const press = (k: string) => {
    if (disabled) return;
    if (k === "del") onChange(value.slice(0, -1));
    else if (value.length < max) onChange(value + k);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-3" aria-label="PIN entry">
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < value.length;
          return (
            <span
              key={i}
              className="h-3 w-3 rounded-full transition"
              style={{ background: filled ? "var(--brand-navy)" : "var(--border)" }}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => press(n)}
            disabled={disabled}
            className="h-16 rounded-xl border bg-card text-2xl font-semibold text-foreground active:scale-95 active:bg-muted transition disabled:opacity-50"
          >
            {n}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => press("0")}
          disabled={disabled}
          className="h-16 rounded-xl border bg-card text-2xl font-semibold text-foreground active:scale-95 active:bg-muted transition disabled:opacity-50"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => press("del")}
          disabled={disabled}
          aria-label="Delete"
          className="h-16 rounded-xl border grid place-items-center active:scale-95 transition disabled:opacity-50"
          style={{ background: "var(--muted)", color: "var(--brand-navy)" }}
        >
          <Delete size={22} />
        </button>
      </div>
    </div>
  );
}
