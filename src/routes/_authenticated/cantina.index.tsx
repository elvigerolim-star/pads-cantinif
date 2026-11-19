import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/pads/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/pads/states";
import { supabase } from "@/integrations/supabase/client";
import { formatarHora, painelQuery, type PedidoCompleto } from "@/lib/queries";
import {
  MOTIVO_LABEL,
  calcularTotal,
  formatarBRL,
  mensagemErro,
  numeroPedido,
  type StatusPedido,
} from "@/lib/pedido";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cantina/")({ component: Painel });

const ABAS: { status: StatusPedido; label: string }[] = [
  { status: "recebido", label: "O02 · Conferência" },
  { status: "aguardando_pagamento", label: "O03 · Aguardando pagamento" },
  { status: "em_separacao", label: "O04 · Separação" },
  { status: "pronto", label: "O05 · Prontos" },
  { status: "entregue", label: "Entregues" },
  { status: "cancelado", label: "O07 · Cancelados" },
];

export function useAcoesCantina() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fn,
      args,
    }: {
      fn: "conferir_pedido" | "marcar_pronto" | "chamar_senha";
      args: Record<string, unknown>;
    }) => {
      const { error } = await supabase.rpc(fn as never, args as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["painel"] });
      qc.invalidateQueries({ queryKey: ["pedido"] });
    },
    onError: (e) => toast.error(mensagemErro(e)),
  });
}

function Card({ p }: { p: PedidoCompleto }) {
  const acao = useAcoesCantina();
  return (
    <li className="space-y-3 rounded-2xl border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-2xl font-extrabold text-primary">
          {p.senha_retirada}
        </span>
        <span className="font-mono text-sm">{numeroPedido(p.numero)}</span>
        <StatusBadge status={p.status} />
        <span className="ml-auto text-xs text-muted-foreground">{formatarHora(p.criado_em)}</span>
      </div>
      <p className="text-sm">
        <strong>{p.aluno?.nome}</strong> · {p.aluno?.matricula}
      </p>
      <p className="text-sm text-muted-foreground">
        {p.item_pedido.map((i) => `${i.quantidade}× ${i.produto?.nome}`).join(", ")} ·{" "}
        <strong>{formatarBRL(calcularTotal(p.item_pedido))}</strong>
      </p>
      {p.motivo_cancelamento && (
        <p className="text-sm text-destructive">Motivo: {MOTIVO_LABEL[p.motivo_cancelamento]}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {p.status === "recebido" && (
          <>
            <Button
              size="sm"
              variant="success"
              disabled={acao.isPending}
              onClick={() =>
                acao.mutate({ fn: "conferir_pedido", args: { p_pedido: p.id, p_disponivel: true } })
              }
            >
              Disponível · gerar PIX
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={acao.isPending}
              onClick={() => {
                if (confirm("Cancelar por itens indisponíveis?"))
                  acao.mutate({
                    fn: "conferir_pedido",
                    args: { p_pedido: p.id, p_disponivel: false },
                  });
              }}
            >
              Cancelar: indisponível
            </Button>
          </>
        )}
        {p.status === "em_separacao" && (
          <Button
            size="sm"
            disabled={acao.isPending}
            onClick={() => acao.mutate({ fn: "marcar_pronto", args: { p_pedido: p.id } })}
          >
            Marcar como pronto
          </Button>
        )}
        {p.status === "pronto" && (
          <Button
            size="sm"
            variant="highlight"
            disabled={acao.isPending}
            onClick={() => acao.mutate({ fn: "chamar_senha", args: { p_pedido: p.id } })}
          >
            Chamar senha
          </Button>
        )}
        <Button size="sm" variant="ghost" asChild>
          <Link to="/cantina/pedido/$id" params={{ id: p.id }}>
            {p.status === "pronto" ? "Conferir retirada" : "Detalhes"}
          </Link>
        </Button>
      </div>
    </li>
  );
}

function Painel() {
  const q = useQuery(painelQuery);
  const [aba, setAba] = useState<StatusPedido>("recebido");
  const [busca, setBusca] = useState("");
  if (q.isPending) return <LoadingState titulo="Carregando pedidos…" />;
  if (q.isError)
    return <ErrorState descricao={mensagemErro(q.error)} onRetry={() => q.refetch()} />;
  const lista = q.data.filter(
    (p) => p.status === aba && (!busca || p.senha_retirada.includes(busca)),
  );
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          O01 · Painel de pedidos
        </p>
        <h1 className="text-3xl font-extrabold">Pedidos de hoje</h1>
      </div>
      <Input
        placeholder="Buscar pela senha (ex.: 042)"
        value={busca}
        onChange={(e) => setBusca(e.target.value.replace(/\D/g, ""))}
        className="max-w-xs"
        aria-label="Buscar pela senha"
      />
      <div className="flex flex-wrap gap-2" role="tablist">
        {ABAS.map((a) => {
          const n = q.data.filter((p) => p.status === a.status).length;
          return (
            <button
              key={a.status}
              role="tab"
              aria-selected={aba === a.status}
              onClick={() => setAba(a.status)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold",
                aba === a.status
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card hover:bg-muted",
              )}
            >
              {a.label} ({n})
            </button>
          );
        })}
      </div>
      {lista.length === 0 ? (
        <EmptyState titulo="Nenhum pedido nesta etapa" />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {lista.map((p) => (
            <Card key={p.id} p={p} />
          ))}
        </ul>
      )}
    </div>
  );
}
