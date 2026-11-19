import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/pads/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/pads/states";
import { formatarDataHora, meusPedidosQuery, perfilQuery } from "@/lib/queries";
import { calcularTotal, formatarBRL, mensagemErro, numeroPedido } from "@/lib/pedido";

export const Route = createFileRoute("/_authenticated/_aluno/pedidos/")({
  head: () => ({ meta: [{ title: "Meus pedidos — PADS CantinIF" }, { name: "description", content: "Histórico e status dos seus pedidos." }, { property: "og:title", content: "Meus pedidos — PADS" }, { property: "og:description", content: "Seus pedidos na cantina." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: MeusPedidos,
});

function MeusPedidos() {
  const perfil = useQuery(perfilQuery);
  const pedidos = useQuery({ ...meusPedidosQuery(perfil.data?.userId ?? ""), enabled: !!perfil.data });
  return (
    <div className="space-y-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">A11 · Meus pedidos</p><h1 className="text-3xl font-extrabold">Meus pedidos</h1></div>
      {pedidos.isPending ? <LoadingState /> : pedidos.isError ? <ErrorState descricao={mensagemErro(pedidos.error)} onRetry={() => pedidos.refetch()} /> :
        pedidos.data.length === 0 ? <EmptyState titulo="Você ainda não fez pedidos" acao={<Button asChild><Link to="/cardapio">Ver cardápio</Link></Button>} /> : (
        <ul className="grid gap-3">{pedidos.data.map((p) => (
          <li key={p.id}><Link to="/pedidos/$id" params={{ id: p.id }} className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-card hover:ring-2 hover:ring-primary">
            <span className="font-mono font-bold">{numeroPedido(p.numero)}</span><StatusBadge status={p.status} />
            <span className="text-sm text-muted-foreground">{formatarDataHora(p.criado_em)} · {p.item_pedido.length} item(ns)</span>
            <span className="ml-auto font-display text-lg font-extrabold">{formatarBRL(calcularTotal(p.item_pedido))}</span>
          </Link></li>))}</ul>)}
    </div>
  );
}
