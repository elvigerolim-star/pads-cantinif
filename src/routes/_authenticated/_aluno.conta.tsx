import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { perfilQuery } from "@/lib/queries";
import { useSair } from "@/hooks/use-sair";

export const Route = createFileRoute("/_authenticated/_aluno/conta")({
  head: () => ({ meta: [{ title: "Minha conta — PADS CantinIF" }, { name: "description", content: "Dados da sua conta de aluno." }, { property: "og:title", content: "Minha conta — PADS" }, { property: "og:description", content: "Conta do aluno." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Conta,
});

function Conta() {
  const perfil = useQuery(perfilQuery);
  const sair = useSair("/entrar");
  const a = perfil.data?.aluno;
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">A18 · Minha conta</p><h1 className="text-3xl font-extrabold">Minha conta</h1></div>
      <dl className="grid gap-3 rounded-3xl border bg-card p-5 shadow-card">
        <div><dt className="text-xs text-muted-foreground">Nome</dt><dd className="font-semibold">{a?.nome}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Matrícula</dt><dd className="font-mono font-semibold">{a?.matricula}</dd></div>
        <div><dt className="text-xs text-muted-foreground">E-mail</dt><dd className="font-semibold">{a?.email}</dd></div>
      </dl>
      <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link to="/pedidos">Meus pedidos</Link></Button><Button variant="destructive" onClick={sair}><LogOut />Sair</Button></div>
    </div>
  );
}
