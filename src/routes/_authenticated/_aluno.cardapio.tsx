import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/pads/product-card";
import { QuantityStepper } from "@/components/pads/quantity-stepper";
import { SimulationNotice } from "@/components/pads/simulation-notice";
import { EmptyState, ErrorState, LoadingState } from "@/components/pads/states";
import { supabase } from "@/integrations/supabase/client";
import { produtosQuery } from "@/lib/queries";
import {
  CATEGORIA_LABEL,
  calcularTotal,
  formatarBRL,
  mensagemErro,
  validarCarrinho,
  type Categoria,
} from "@/lib/pedido";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_aluno/cardapio")({
  head: () => ({
    meta: [
      { title: "Cardápio — PADS CantinIF" },
      { name: "description", content: "Escolha salgados, bebidas e doces e envie seu pedido." },
      { property: "og:title", content: "Cardápio — PADS" },
      { property: "og:description", content: "Cardápio da cantina." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Cardapio,
});

const CHAVE = "pads-carrinho";

function Cardapio() {
  const produtos = useQuery(produtosQuery);
  const qc = useQueryClient();
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [filtro, setFiltro] = useState<Categoria | "todos">("todos");
  const [etapa, setEtapa] = useState<"cardapio" | "revisar">("cardapio");
  const [erro, setErro] = useState<{ codigo: string; texto: string } | null>(null);
  const [enviado, setEnviado] = useState<string | null>(null);

  useEffect(() => {
    try {
      setCarrinho(JSON.parse(sessionStorage.getItem(CHAVE) ?? "{}"));
    } catch {
      /* vazio */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(CHAVE, JSON.stringify(carrinho));
    } catch {
      /* vazio */
    }
  }, [carrinho]);

  const mapa = useMemo(() => new Map((produtos.data ?? []).map((p) => [p.id, p])), [produtos.data]);
  const itens = Object.entries(carrinho)
    .filter(([id, q]) => q > 0 && mapa.has(id))
    .map(([id, q]) => ({ produto: mapa.get(id)!, quantidade: q }));
  const total = calcularTotal(
    itens.map((i) => ({ quantidade: i.quantidade, preco_unitario: i.produto.preco_atual })),
  );
  const setQ = (id: string, q: number) =>
    setCarrinho((c) => {
      const n = { ...c };
      if (q <= 0) delete n[id];
      else n[id] = q;
      return n;
    });

  const enviar = useMutation({
    mutationFn: async () => {
      const payload = itens.map((i) => ({ id_produto: i.produto.id, quantidade: i.quantidade }));
      const { data, error } = await supabase.rpc("criar_pedido", { p_itens: payload });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (id) => {
      setCarrinho({});
      setEnviado(id);
      qc.invalidateQueries({ queryKey: ["meus-pedidos"] });
    },
    onError: (e) => {
      setErro({ codigo: "E03 · Erro ao enviar", texto: mensagemErro(e) });
      qc.invalidateQueries({ queryKey: ["produtos"] });
    },
  });

  function confirmar() {
    setErro(null);
    const v = validarCarrinho(
      itens.map((i) => ({ id_produto: i.produto.id, quantidade: i.quantidade })),
    );
    if (v) return setErro({ codigo: "E04 · Validação", texto: v });
    if (itens.some((i) => !i.produto.disponivel))
      return setErro({
        codigo: "E04 · Validação",
        texto: "Remova os itens que ficaram indisponíveis.",
      });
    enviar.mutate();
  }

  if (enviado)
    return (
      <div className="mx-auto max-w-md space-y-4 py-12 text-center" role="status">
        <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-success/15 text-success">
          <CheckCircle2 className="size-8" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          E07 · Pedido enviado
        </p>
        <h1 className="text-3xl font-extrabold">Pedido enviado!</h1>
        <p className="text-muted-foreground">
          A cantina vai conferir a disponibilidade dos itens. Acompanhe o status.
        </p>
        <Button asChild variant="hero" size="lg" className="w-full">
          <Link to="/pedidos/$id" params={{ id: enviado }}>
            Acompanhar pedido
          </Link>
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setEnviado(null);
            setEtapa("cardapio");
          }}
        >
          Fazer outro pedido
        </Button>
      </div>
    );

  if (produtos.isPending) return <LoadingState titulo="E01 · Carregando cardápio…" />;
  if (produtos.isError)
    return (
      <ErrorState
        titulo="Não foi possível carregar o cardápio"
        descricao={mensagemErro(produtos.error)}
        onRetry={() => produtos.refetch()}
      />
    );

  const lista = (produtos.data ?? []).filter((p) => filtro === "todos" || p.categoria === filtro);
  const resumo = (
    <aside
      className="space-y-4 rounded-3xl border bg-card p-5 shadow-card lg:sticky lg:top-24"
      aria-label="Seu pedido"
    >
      <h2 className="flex items-center gap-2 text-lg font-extrabold">
        <ShoppingBag className="size-5" />
        {etapa === "revisar" ? "A03 · Revisar pedido" : "Seu pedido"}
      </h2>
      {itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum item escolhido.</p>
      ) : (
        <ul className="space-y-3">
          {itens.map((i) => (
            <li key={i.produto.id} className="flex items-center gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{i.produto.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {formatarBRL(i.produto.preco_atual)} cada
                  {!i.produto.disponivel && " · indisponível"}
                </p>
              </div>
              <QuantityStepper
                valor={i.quantidade}
                onChange={(q) => setQ(i.produto.id, q)}
                nome={i.produto.nome}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQ(i.produto.id, 0)}
                aria-label={`Remover ${i.produto.nome}`}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between border-t pt-3">
        <span className="font-semibold">Total</span>
        <span className="font-display text-2xl font-extrabold tabular-nums">
          {formatarBRL(total)}
        </span>
      </div>
      {erro && (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm"
        >
          <p className="font-semibold">{erro.codigo}</p>
          <p className="text-muted-foreground">{erro.texto}</p>
        </div>
      )}
      {etapa === "cardapio" ? (
        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={() => {
            setErro(null);
            setEtapa("revisar");
          }}
        >
          Revisar pedido
        </Button>
      ) : (
        <div className="grid gap-2">
          <Button variant="hero" size="lg" onClick={confirmar} disabled={enviar.isPending}>
            {enviar.isPending && <Loader2 className="animate-spin" />}Enviar pedido
          </Button>
          <Button variant="ghost" onClick={() => setEtapa("cardapio")}>
            Voltar ao cardápio
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        O valor final é recalculado pelo servidor com os preços atuais.
      </p>
    </aside>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          A01 · Cardápio
        </p>
        <h1 className="text-3xl font-extrabold">O que vai ser hoje?</h1>
      </div>
      <SimulationNotice />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categorias">
            {(["todos", "salgado", "bebida", "doce"] as const).map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={filtro === c}
                onClick={() => setFiltro(c)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold",
                  filtro === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:bg-muted",
                )}
              >
                {c === "todos" ? "Todos" : CATEGORIA_LABEL[c]}
              </button>
            ))}
          </div>
          {lista.length === 0 ? (
            <EmptyState
              titulo="E02 · Nenhum produto aqui"
              descricao="Não há produtos nesta categoria no momento."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {lista.map((p) => (
                <ProductCard
                  key={p.id}
                  produto={p}
                  quantidade={carrinho[p.id] ?? 0}
                  onChange={(q) => setQ(p.id, q)}
                />
              ))}
            </div>
          )}
        </div>
        {resumo}
      </div>
    </div>
  );
}
