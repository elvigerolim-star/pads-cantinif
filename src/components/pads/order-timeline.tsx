import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PedidoCompleto } from "@/lib/queries";
import { formatarHora } from "@/lib/queries";

type Etapa = { chave: string; titulo: string; hora?: string | null | undefined };

export function OrderTimeline({ pedido }: { pedido: PedidoCompleto }) {
  const etapas: Etapa[] = [
    { chave: "recebido", titulo: "Pedido recebido", hora: pedido.criado_em },
    { chave: "conferido", titulo: "Conferência da cantina" },
    { chave: "pago", titulo: "Pagamento PIX (simulado)", hora: pedido.pagamento?.confirmado_em },
    { chave: "separacao", titulo: "Em separação" },
    { chave: "pronto", titulo: "Pronto e chamada", hora: pedido.chamado_em },
    { chave: "entregue", titulo: "Entregue", hora: pedido.retirado_em },
  ];
  const ordem: Record<string, number> = {
    recebido: 1, aguardando_pagamento: 2, em_separacao: 4, pronto: 5, entregue: 6,
  };
  let feitas = ordem[pedido.status] ?? 0;
  let falhaEm = -1;
  if (pedido.status === "cancelado") {
    if (pedido.motivo_cancelamento === "itens_indisponiveis") { feitas = 1; falhaEm = 1; }
    else { feitas = 2; falhaEm = 2; }
  }
  return (
    <ol className="relative space-y-0" aria-label="Andamento do pedido">
      {etapas.map((e, i) => {
        const concluida = i < feitas;
        const falhou = i === falhaEm;
        const atual = !falhou && i === feitas && pedido.status !== "cancelado" && pedido.status !== "entregue";
        const ultima = i === etapas.length - 1;
        return (
          <li key={e.chave} className="relative flex gap-3 pb-5 last:pb-0">
            {!ultima && (
              <span className={cn("absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5", concluida ? "bg-success" : "bg-border")} aria-hidden="true" />
            )}
            <span
              className={cn(
                "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold",
                falhou && "border-destructive bg-destructive text-destructive-foreground",
                concluida && !falhou && "border-success bg-success text-success-foreground",
                atual && "border-primary bg-card text-primary",
                !concluida && !falhou && !atual && "border-border bg-card text-muted-foreground",
              )}
              aria-hidden="true"
            >
              {falhou ? <X className="size-3.5" /> : concluida ? <Check className="size-3.5" /> : i + 1}
            </span>
            <div className="pt-0.5">
              <p className={cn("text-sm font-semibold", !concluida && !atual && !falhou && "text-muted-foreground")}>
                {e.titulo}
                <span className="sr-only">{falhou ? " — não concluída" : concluida ? " — concluída" : atual ? " — etapa atual" : " — pendente"}</span>
              </p>
              {concluida && !falhou && e.hora && <p className="text-xs text-muted-foreground">{formatarHora(e.hora)}</p>}
              {atual && <p className="text-xs font-medium text-primary">Etapa atual</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
