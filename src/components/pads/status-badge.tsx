import { cn } from "@/lib/utils";
import { STATUS_LABEL, type StatusPedido } from "@/lib/pedido";

const ESTILO: Record<StatusPedido, string> = {
  recebido: "bg-accent text-accent-foreground",
  aguardando_pagamento: "bg-highlight/25 text-foreground",
  em_separacao: "bg-primary/15 text-primary-strong dark:text-primary",
  pronto: "bg-success/15 text-success",
  entregue: "bg-muted text-muted-foreground",
  cancelado: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status, className }: { status: StatusPedido; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", ESTILO[status], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}
