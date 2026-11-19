import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_QUANTIDADE_POR_ITEM } from "@/lib/pedido";

export function QuantityStepper({
  valor,
  onChange,
  nome,
  className,
  min = 0,
}: {
  valor: number;
  onChange: (v: number) => void;
  nome: string;
  className?: string;
  min?: number;
}) {
  return (
    <div
      className={cn("inline-flex items-center rounded-full border bg-card p-0.5", className)}
      role="group"
      aria-label={`Quantidade de ${nome}`}
    >
      <button
        type="button"
        className="grid size-8 place-items-center rounded-full text-foreground transition hover:bg-muted disabled:opacity-40"
        onClick={() => onChange(Math.max(min, valor - 1))}
        disabled={valor <= min}
        aria-label={`Diminuir ${nome}`}
      >
        <Minus className="size-4" />
      </button>
      <span className="w-7 text-center text-sm font-bold tabular-nums" aria-live="polite">
        {valor}
      </span>
      <button
        type="button"
        className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary-strong disabled:opacity-40"
        onClick={() => onChange(Math.min(MAX_QUANTIDADE_POR_ITEM, valor + 1))}
        disabled={valor >= MAX_QUANTIDADE_POR_ITEM}
        aria-label={`Aumentar ${nome}`}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
