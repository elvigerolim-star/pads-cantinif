import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OrderTimeline } from "@/components/pads/order-timeline";
import { PickupReceipt } from "@/components/pads/pickup-receipt";
import { SimulationNotice } from "@/components/pads/simulation-notice";
import { StatusBadge } from "@/components/pads/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/pads/states";
import { supabase } from "@/integrations/supabase/client";
import { formatarDataHora, formatarHora, pedidoQuery, perfilQuery } from "@/lib/queries";
import { MOTIVO_LABEL, calcularTotal, formatarBRL, mensagemErro, numeroPedido } from "@/lib/pedido";

export const Route = createFileRoute("/_authenticated/_aluno/pedidos/$id")({
  head: () => ({ meta: [{ title: "Acompanhar pedido — PADS CantinIF" }, { name: "description", content: "Status, pagamento simulado e retirada do pedido." }, { property: "og:title", content: "Pedido — PADS" }, { property: "og:description", content: "Acompanhe seu pedido." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: PedidoAluno,
});

function CodigoRetirada({ id }: { id: string }) {
  const q = useQuery({
    queryKey: ["codigo", id],
    queryFn: async () => { const { data, error } = await supabase.rpc("codigo_retirada", { p_pedido: id }); if (error) throw error; return data as { codigo: string; segundos_restantes: number }; },
    refetchInterval: (s) => ((s.state.data?.segundos_restantes ?? 5) * 1000) + 300,
  });
  const [restam, setRestam] = useState(0);
  useEffect(() => { setRestam(q.data?.segundos_restantes ?? 0); const t = setInterval(() => setRestam((r) => Math.max(0, r - 1)), 1000); return () => clearInterval(t); }, [q.data]);
  if (q.isPending) return <LoadingState titulo="Gerando código…" className="py-4" />;
  if (q.isError) return <p className="text-sm text-destructive">{mensagemErro(q.error)}</p>;
  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Código de conferência</p>
      <p className="font-mono text-5xl font-bold tracking-[0.3em]" aria-live="polite">{q.data.codigo}</p>
      <p className="text-xs text-muted-foreground">Muda em {restam}s · mostre ao atendente</p>
    </div>
  );
}

function PedidoAluno() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const perfil = useQuery(perfilQuery);
  const pedido = useQuery(pedidoQuery(id));
  const pagar = useMutation({
    mutationFn: async (aprovado: boolean) => { const { error } = await supabase.rpc("simular_pagamento", { p_pedido: id, p_aprovado: aprovado }); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pedido", id] }),
    onError: (e) => toast.error(mensagemErro(e)),
  });
  if (pedido.isPending) return <LoadingState />;
  if (pedido.isError) return <ErrorState descricao={mensagemErro(pedido.error)} onRetry={() => pedido.refetch()} />;
  const p = pedido.data;
  if (!p) return <EmptyState titulo="Pedido não encontrado" acao={<Button asChild><Link to="/pedidos">Meus pedidos</Link></Button>} />;
  const total = calcularTotal(p.item_pedido);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-extrabold">Pedido {numeroPedido(p.numero)}</h1><StatusBadge status={p.status} /></div>
        {p.status === "recebido" && <section className="rounded-3xl border bg-card p-5"><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">A04</p><h2 className="text-xl font-bold">Pedido recebido</h2><p className="text-muted-foreground">Aguardando a cantina conferir a disponibilidade dos itens.</p></section>}
        {p.status === "cancelado" && <section role="alert" className="rounded-3xl border border-destructive/40 bg-destructive/10 p-5"><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{p.motivo_cancelamento === "pagamento_falhou" ? "A08 · Pagamento falhou" : "A05 · Cancelado por indisponibilidade"}</p><h2 className="text-xl font-bold">Pedido cancelado</h2><p className="text-muted-foreground">Motivo: {p.motivo_cancelamento ? MOTIVO_LABEL[p.motivo_cancelamento] : "—"}. Nenhum valor foi cobrado.</p></section>}
        {p.status === "aguardando_pagamento" && p.pagamento && (
          <section className="space-y-4 rounded-3xl border bg-card p-5 shadow-card">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">A06 · Pagamento PIX (simulado)</p>
            <SimulationNotice>Este não é um PIX real. Use os botões abaixo para simular o resultado.</SimulationNotice>
            <p>Valor: <strong className="font-display text-2xl">{formatarBRL(p.pagamento.valor)}</strong></p>
            <p className="break-all rounded-xl bg-muted p-3 font-mono text-xs">SIMULACAO-SEM-VALOR · {p.pagamento.referencia_pix}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="success" onClick={() => pagar.mutate(true)} disabled={pagar.isPending}>{pagar.isPending && <Loader2 className="animate-spin" />}Simular pagamento aprovado</Button>
              <Button variant="outline" onClick={() => pagar.mutate(false)} disabled={pagar.isPending}>Simular falha no pagamento</Button>
            </div>
          </section>)}
        {(p.status === "em_separacao" || p.status === "pronto" || p.status === "entregue") && perfil.data?.aluno && (
          <PickupReceipt nome={perfil.data.aluno.nome} matricula={perfil.data.aluno.matricula} numero={p.numero} senha={p.senha_retirada}>
            {p.status === "em_separacao" && <p className="text-sm"><strong>A07 · Em separação.</strong> Guarde sua senha; o código de retirada aparece quando o pedido estiver pronto.</p>}
            {p.status === "pronto" && <div className="space-y-3"><p className="flex items-center gap-2 font-bold text-success"><BellRing className="size-5" />A09 · Pronto! {p.chamado_em ? `Senha chamada às ${formatarHora(p.chamado_em)}.` : "Aguarde a chamada."}</p><CodigoRetirada id={p.id} /></div>}
            {p.status === "entregue" && <p className="text-sm"><strong>A10 · Entregue</strong> em {formatarDataHora(p.retirado_em)}. Senha já utilizada.</p>}
          </PickupReceipt>)}
        <section className="rounded-3xl border bg-card p-5"><h2 className="mb-3 font-bold">Itens</h2>
          <ul className="space-y-2 text-sm">{p.item_pedido.map((i) => <li key={i.produto?.id} className="flex justify-between"><span>{i.quantidade}× {i.produto?.nome}</span><span>{formatarBRL(i.quantidade * Number(i.preco_unitario))}</span></li>)}</ul>
          <p className="mt-3 flex justify-between border-t pt-3 font-bold"><span>Total</span><span>{formatarBRL(total)}</span></p></section>
      </div>
      <aside className="rounded-3xl border bg-card p-5"><h2 className="mb-4 font-bold">Andamento</h2><OrderTimeline pedido={p} /></aside>
    </div>
  );
}
