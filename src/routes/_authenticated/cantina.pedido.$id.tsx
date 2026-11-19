import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderTimeline } from "@/components/pads/order-timeline";
import { PickupReceipt } from "@/components/pads/pickup-receipt";
import { StatusBadge } from "@/components/pads/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/pads/states";
import { supabase } from "@/integrations/supabase/client";
import { formatarDataHora, formatarHora, pedidoQuery } from "@/lib/queries";
import {
  MOTIVO_LABEL,
  MOTIVO_RETIRADA,
  calcularTotal,
  formatarBRL,
  mensagemErro,
  numeroPedido,
} from "@/lib/pedido";

export const Route = createFileRoute("/_authenticated/cantina/pedido/$id")({
  component: PedidoCantina,
});

function PedidoCantina() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery(pedidoQuery(id, true));
  const [codigo, setCodigo] = useState("");
  const [recusa, setRecusa] = useState<string | null>(null);
  const rpc = useMutation({
    mutationFn: async ({ fn, args }: { fn: string; args: Record<string, unknown> }) => {
      const { data, error } = await supabase.rpc(fn as never, args as never);
      if (error) throw error;
      return data as unknown;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pedido", id] }),
    onError: (e) => toast.error(mensagemErro(e)),
  });
  async function conferir(e: FormEvent) {
    e.preventDefault();
    setRecusa(null);
    const r = (await rpc.mutateAsync({
      fn: "conferir_retirada",
      args: { p_pedido: id, p_codigo: codigo },
    })) as { ok: boolean; motivo?: string };
    if (!r.ok) setRecusa(MOTIVO_RETIRADA[r.motivo ?? ""] ?? "Retirada recusada.");
    setCodigo("");
  }
  if (q.isPending) return <LoadingState />;
  if (q.isError)
    return <ErrorState descricao={mensagemErro(q.error)} onRetry={() => q.refetch()} />;
  const p = q.data;
  if (!p)
    return (
      <EmptyState
        titulo="Pedido não encontrado"
        acao={
          <Button asChild>
            <Link to="/cantina">Voltar ao painel</Link>
          </Button>
        }
      />
    );
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/cantina">← Painel</Link>
          </Button>
          <h1 className="text-3xl font-extrabold">Pedido {numeroPedido(p.numero)}</h1>
          <StatusBadge status={p.status} />
        </div>
        <PickupReceipt
          nome={p.aluno?.nome ?? "—"}
          matricula={p.aluno?.matricula ?? "—"}
          numero={p.numero}
          senha={p.senha_retirada}
        >
          {p.status === "recebido" && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="success"
                onClick={() =>
                  rpc.mutate({ fn: "conferir_pedido", args: { p_pedido: id, p_disponivel: true } })
                }
              >
                Disponível · gerar PIX simulado
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm("Cancelar por itens indisponíveis?"))
                    rpc.mutate({
                      fn: "conferir_pedido",
                      args: { p_pedido: id, p_disponivel: false },
                    });
                }}
              >
                Cancelar: itens indisponíveis
              </Button>
            </div>
          )}
          {p.status === "aguardando_pagamento" && (
            <p className="text-sm">
              <strong>O03 · Aguardando pagamento.</strong> PIX simulado{" "}
              {p.pagamento?.referencia_pix} de {formatarBRL(p.pagamento?.valor ?? 0)}.
            </p>
          )}
          {p.status === "em_separacao" && (
            <Button onClick={() => rpc.mutate({ fn: "marcar_pronto", args: { p_pedido: id } })}>
              O04 · Marcar como pronto
            </Button>
          )}
          {p.status === "pronto" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="highlight"
                  onClick={() => rpc.mutate({ fn: "chamar_senha", args: { p_pedido: id } })}
                >
                  O11 · Chamar senha {p.senha_retirada}
                </Button>
                {p.chamado_em && (
                  <span className="text-sm text-muted-foreground">
                    Chamada às {formatarHora(p.chamado_em)}
                  </span>
                )}
              </div>
              <form onSubmit={conferir} className="space-y-2">
                <label htmlFor="cod" className="text-sm font-semibold">
                  O13 · Código de 4 dígitos na tela do aluno
                </label>
                <div className="flex gap-2">
                  <Input
                    id="cod"
                    inputMode="numeric"
                    maxLength={4}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                    className="w-32 text-center font-mono text-xl tracking-widest"
                  />
                  <Button type="submit" disabled={rpc.isPending || codigo.length !== 4}>
                    Registrar entrega
                  </Button>
                </div>
              </form>
              {recusa && (
                <div
                  role="alert"
                  className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm"
                >
                  <p className="font-semibold">E11 · Retirada recusada</p>
                  <p className="text-muted-foreground">{recusa}</p>
                </div>
              )}
            </div>
          )}
          {p.status === "entregue" && (
            <p role="status" className="font-semibold text-success">
              O08 · Entrega registrada em {formatarDataHora(p.retirado_em)}.
            </p>
          )}
          {p.status === "cancelado" && (
            <p className="text-destructive">
              Cancelado: {p.motivo_cancelamento ? MOTIVO_LABEL[p.motivo_cancelamento] : "—"}
            </p>
          )}
        </PickupReceipt>
        <section className="rounded-3xl border bg-card p-5">
          <ul className="space-y-2 text-sm">
            {p.item_pedido.map((i) => (
              <li key={i.produto?.id} className="flex justify-between">
                <span>
                  {i.quantidade}× {i.produto?.nome}
                </span>
                <span>{formatarBRL(i.quantidade * Number(i.preco_unitario))}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between border-t pt-3 font-bold">
            <span>Total</span>
            <span>{formatarBRL(calcularTotal(p.item_pedido))}</span>
          </p>
        </section>
      </div>
      <aside className="rounded-3xl border bg-card p-5">
        <OrderTimeline pedido={p} />
      </aside>
    </div>
  );
}
