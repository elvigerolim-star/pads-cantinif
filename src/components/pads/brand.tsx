import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
  to = "/",
}: {
  className?: string;
  compact?: boolean;
  to?: "/" | "/cantina" | "/cardapio";
}) {
  return (
    <Link
      to={to}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="CantinIF PADS — início"
    >
      <span
        className="grid size-10 place-items-center rounded-2xl bg-gradient-brand font-display text-lg font-extrabold text-primary-foreground shadow-pop"
        aria-hidden="true"
      >
        C
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-extrabold">CantinIF</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            PADS
          </span>
        </span>
      )}
    </Link>
  );
}
