import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatarBRL } from "@/lib/pedido";
import type { Produto } from "@/lib/queries";
import { ProductArt } from "./product-art";
import { QuantityStepper } from "./quantity-stepper";

export function ProductCard({
  produto,
  quantidade,
  onChange,
}: {
  produto: Produto;
  quantidade: number;
  onChange: (q: number) => void;
}) {
  const indisponivel = !produto.disponivel;
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-card transition",
        quantidade > 0 && "ring-2 ring-primary",
        indisponivel && "opacity-60",
      )}
    >
      <div className="relative">
        <ProductArt nome={produto.nome} categoria={produto.categoria} className="aspect-[4/3]" />
        <span className="absolute bottom-2 left-2 rounded-full bg-card/85 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          Imagem ilustrativa
        </span>
        {indisponivel && (
          <span className="absolute right-2 top-2 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground">
            Indisponível
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-base font-bold leading-tight">{produto.nome}</h3>
        {produto.descricao && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{produto.descricao}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="font-display text-xl font-extrabold tabular-nums">
              {formatarBRL(produto.preco_atual)}
            </p>
            {produto.preco_demonstrativo && (
              <p className="text-[11px] font-semibold text-muted-foreground">
                Preço fictício (demo)
              </p>
            )}
          </div>
          {indisponivel ? null : quantidade > 0 ? (
            <QuantityStepper valor={quantidade} onChange={onChange} nome={produto.nome} />
          ) : (
            <Button
              size="icon"
              className="rounded-full"
              onClick={() => onChange(1)}
              aria-label={`Adicionar ${produto.nome}`}
            >
              <Plus />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
