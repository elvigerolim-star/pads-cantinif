import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { ErrorState, LoadingState } from "@/components/pads/states";
import { supabase } from "@/integrations/supabase/client";
import { produtosQuery } from "@/lib/queries";
import { CATEGORIA_LABEL, formatarBRL, mensagemErro } from "@/lib/pedido";

export const Route = createFileRoute("/_authenticated/cantina/disponibilidade")({
  component: Disponibilidade,
});

function Disponibilidade() {
  const qc = useQueryClient();
  const q = useQuery(produtosQuery);
  const m = useMutation({
    mutationFn: async ({ id, d }: { id: string; d: boolean }) => {
      const { error } = await supabase.rpc("definir_disponibilidade", {
        p_produto: id,
        p_disponivel: d,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["produtos"] }),
    onError: (e) => toast.error(mensagemErro(e)),
  });
  if (q.isPending) return <LoadingState />;
  if (q.isError)
    return <ErrorState descricao={mensagemErro(q.error)} onRetry={() => q.refetch()} />;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          O06 · Disponibilidade
        </p>
        <h1 className="text-3xl font-extrabold">Disponibilidade dos produtos</h1>
      </div>
      {(["salgado", "bebida", "doce"] as const).map((c) => (
        <section key={c} className="rounded-3xl border bg-card p-5">
          <h2 className="mb-3 text-lg font-bold">{CATEGORIA_LABEL[c]}</h2>
          <ul className="divide-y">
            {q.data
              .filter((p) => p.categoria === c)
              .map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <div className="flex-1">
                    <p className="font-semibold">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatarBRL(p.preco_atual)}
                      {p.preco_demonstrativo && " · preço fictício"}
                    </p>
                  </div>
                  <span className="text-sm">{p.disponivel ? "Disponível" : "Indisponível"}</span>
                  <Switch
                    checked={p.disponivel}
                    disabled={m.isPending}
                    onCheckedChange={(d) => m.mutate({ id: p.id, d })}
                    aria-label={`Disponibilidade de ${p.nome}`}
                  />
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
