import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { numeroPedido } from "@/lib/pedido";

export function PickupReceipt({
  nome, matricula, numero, senha, children, className,
}: { nome: string; matricula: string; numero: number; senha: string; children?: ReactNode; className?: string }) {
  return (
    <section aria-label="Comprovante de retirada" className={cn("overflow-hidden rounded-3xl border bg-card shadow-card", className)}>
      <div className="bg-gradient-brand px-5 py-4 text-primary-foreground">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-90">Comprovante de retirada</p>
        <p className="font-display text-sm opacity-90">Pedido {numeroPedido(numero)}</p>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <dl className="grid gap-2 text-sm">
          <div><dt className="text-xs text-muted-foreground">Aluno</dt><dd className="font-semibold">{nome}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Matrícula</dt><dd className="font-mono font-semibold">{matricula}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Pedido</dt><dd className="font-mono font-semibold">{numeroPedido(numero)}</dd></div>
        </dl>
        <div className="rounded-2xl border-2 border-dashed border-primary/40 px-6 py-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Senha</p>
          <p className="font-display text-5xl font-extrabold tabular-nums text-primary">{senha}</p>
        </div>
      </div>
      {children && <div className="border-t border-dashed p-5">{children}</div>}
    </section>
  );
}
