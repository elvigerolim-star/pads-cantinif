import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, GraduationCap, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/pads/brand";
import { ThemeToggle } from "@/components/pads/theme-toggle";
import { SimulationNotice } from "@/components/pads/simulation-notice";

export const Route = createFileRoute("/ajuda")({
  head: () => ({
    meta: [
      { title: "Ajuda para testar o protótipo — PADS CantinIF" },
      { name: "description", content: "Roteiro de teste e contas fictícias de demonstração do PADS para professores." },
      { property: "og:title", content: "Ajuda — PADS CantinIF" },
      { property: "og:description", content: "Como testar o fluxo do aluno e da cantina com contas de demonstração." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Ajuda,
});

const CONTAS = [
  { perfil: "Aluna (demo)", icon: GraduationCap, email: "aluna.demo@example.com", info: "Ana Exemplo · matrícula 20260001", entrar: "/entrar" as const },
  { perfil: "Aluno 2 (demo)", icon: GraduationCap, email: "aluno2.demo@example.com", info: "Bruno Exemplo · matrícula 20260002", entrar: "/entrar" as const },
  { perfil: "Atendente (demo)", icon: Store, email: "atendente.demo@example.com", info: "Carla Exemplo · usuário atendente.demo", entrar: "/atendente/entrar" as const },
];

const ROTEIRO = [
  "Entre como aluna, escolha itens no cardápio, revise o total e envie o pedido (status: Recebido).",
  "Em outra janela anônima, entre como atendente. No painel, aba Conferência, marque o pedido como disponível (gera um PIX simulado) ou cancele por itens indisponíveis.",
  "De volta à aluna, abra o pedido e use “Simular pagamento aprovado” ou “Simular falha”. Aprovado vai para Em separação; falha cancela o pedido.",
  "Como atendente, marque como pronto e clique em Chamar senha. A aluna vê a chamada e um código de 4 dígitos que muda a cada 30 segundos.",
  "Na tela Conferir retirada, o atendente compara nome, matrícula e senha e digita o código da tela da aluna. Código certo registra a entrega; errado mostra Retirada recusada.",
  "Teste também: Disponibilidade (desligar um produto), acesso negado (aluna abrindo /cantina) e Meus pedidos.",
];

function Ajuda() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-20 max-w-5xl items-center gap-3 px-4 sm:px-6">
        <Logo />
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost"><Link to="/"><ArrowLeft />Início</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-10 px-4 pb-16 sm:px-6">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Ajuda para o professor</p>
          <h1 className="text-4xl font-extrabold">Como testar o PADS</h1>
          <p className="max-w-2xl text-muted-foreground">Todas as contas abaixo são fictícias e existem só para demonstração. Os e-mails não recebem mensagens.</p>
          <SimulationNotice />
        </div>

        <section aria-labelledby="contas" className="space-y-4">
          <h2 id="contas" className="text-2xl font-extrabold">Contas de demonstração</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {CONTAS.map((c) => (
              <article key={c.email} className="flex flex-col gap-3 rounded-3xl border bg-card p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-accent text-accent-foreground"><c.icon className="size-5" aria-hidden="true" /></span>
                  <div><h3 className="font-bold">{c.perfil}</h3><p className="text-xs text-muted-foreground">{c.info}</p></div>
                </div>
                <dl className="space-y-1 rounded-2xl bg-muted p-3 text-sm">
                  <div><dt className="text-xs text-muted-foreground">E-mail</dt><dd className="break-all font-mono">{c.email}</dd></div>
                </dl>
                <Button asChild variant="outline" className="mt-auto"><Link to={c.entrar} search={{}}>Entrar com esta conta</Link></Button>
              </article>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Essas contas não têm privilégios administrativos: a atendente só consegue operar pedidos e disponibilidade. Novas contas de atendente só são criadas diretamente no banco.</p>
        </section>

        <section aria-labelledby="roteiro" className="space-y-4">
          <h2 id="roteiro" className="text-2xl font-extrabold">Roteiro sugerido</h2>
          <ol className="space-y-3">
            {ROTEIRO.map((r, i) => (
              <li key={i} className="flex gap-4 rounded-2xl border bg-card p-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground">{i + 1}</span>
                <p className="pt-1 text-sm">{r}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="limites" className="space-y-3 rounded-3xl border bg-card p-6">
          <h2 id="limites" className="text-2xl font-extrabold">O que é simulado ou limitado</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>O PIX é 100% simulado: não há QR Code real nem integração financeira. Só a aluna dona do pedido pode simular aprovação ou falha.</li>
            <li>Preços marcados como “preço fictício” são dados de demonstração; os demais seguem os valores informados pelo PO.</li>
            <li>As imagens dos produtos são ilustrações, não fotos reais.</li>
            <li>Recuperação de senha e confirmação de e-mail só funcionam com um endereço de e-mail real.</li>
            <li>O código de retirada é calculado no servidor a partir de uma chave secreta do pedido, que nunca é enviada ao navegador.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
